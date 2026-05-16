import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  _setAnthropicClientForTesting,
  _setAuditLoggerForTesting,
  complete,
  DAILY_COST_CEILING_MICROS,
} from "@/lib/ai/client";
import { AiUnavailableError, CostCeilingExceededError } from "@/lib/errors";
import {
  _resetDefaultDbForTesting,
  getDailyCostMicros,
  getDb,
  recordAiCost,
  todayUtc,
  upsertUser,
} from "@/lib/storage";

let tmpDir: string;
let auditLog: Record<string, unknown>[];
let mockCreate: ReturnType<typeof vi.fn>;

function fakeUsage(over: Partial<Record<string, number>> = {}) {
  return {
    input_tokens: 100,
    output_tokens: 50,
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    ...over,
  };
}

function fakeMessage(over: { id?: string; text?: string; usage?: object } = {}) {
  return {
    id: over.id ?? "msg_test_1",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text: over.text ?? "OK" }],
    usage: over.usage ?? fakeUsage(),
  };
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-ai-"));
  process.env.DATABASE_PATH = join(tmpDir, "test.db");
  process.env.ANTHROPIC_API_KEY = "sk-test";
  _resetDefaultDbForTesting();

  auditLog = [];
  _setAuditLoggerForTesting((entry) => auditLog.push(entry));

  mockCreate = vi.fn();
  _setAnthropicClientForTesting({ messages: { create: mockCreate } as never });

  // Seed a user so the FK story is consistent (cost ledger doesn't FK but it's
  // cleaner than passing bare strings).
  upsertUser(getDb(), {
    provider: "google",
    provider_user_id: "u1",
    email: null,
    display_name: null,
  });
});

afterEach(() => {
  _setAnthropicClientForTesting(undefined);
  _setAuditLoggerForTesting(undefined);
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("complete()", () => {
  it("TC-AI-01: sends model=claude-haiku-4-5-20251001 with cache_control on the system block", async () => {
    mockCreate.mockResolvedValue(fakeMessage());

    await complete({
      feature: "prioritize",
      userId: "google:u1",
      systemStable: "STABLE",
      userMessage: "VOLATILE",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0]?.[0];
    expect(args.model).toBe("claude-haiku-4-5-20251001");
    expect(args.system).toEqual([
      { type: "text", text: "STABLE", cache_control: { type: "ephemeral" } },
    ]);
    expect(args.messages).toEqual([{ role: "user", content: "VOLATILE" }]);
  });

  it("TC-AI-02: writes one audit line per call with counts/model/feature/latency/request_id/user_id", async () => {
    mockCreate.mockResolvedValue(
      fakeMessage({
        id: "msg_abc",
        usage: fakeUsage({
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 800,
        }),
      }),
    );

    await complete({
      feature: "prioritize",
      userId: "google:u1",
      systemStable: "STABLE",
      userMessage: "X",
    });

    expect(auditLog).toHaveLength(1);
    const entry = auditLog[0] as Record<string, unknown>;
    expect(entry.model).toBe("claude-haiku-4-5-20251001");
    expect(entry.feature).toBe("prioritize");
    expect(entry.user_id).toBe("google:u1");
    expect(entry.input_tokens).toBe(100);
    expect(entry.output_tokens).toBe(50);
    expect(entry.cached_tokens).toBe(800);
    expect(entry.request_id).toBe("msg_abc");
    expect(typeof entry.latency_ms).toBe("number");
    expect(typeof entry.ts).toBe("string");
    expect(typeof entry.cost_usd_est).toBe("number");
  });

  it("TC-AI-03: audit log never contains prompt or response bodies", async () => {
    mockCreate.mockResolvedValue(fakeMessage({ text: "SECRET_RESPONSE" }));

    await complete({
      feature: "prioritize",
      userId: "google:u1",
      systemStable: "SECRET_PROMPT_BODY",
      userMessage: "ALSO_SECRET",
    });

    const blob = JSON.stringify(auditLog);
    expect(blob).not.toContain("SECRET_PROMPT_BODY");
    expect(blob).not.toContain("ALSO_SECRET");
    expect(blob).not.toContain("SECRET_RESPONSE");
  });

  it("TC-AI-04: throws CostCeilingExceededError when current+estimate > ceiling; no SDK call", async () => {
    // Seed today's ledger close to the ceiling.
    recordAiCost(getDb(), "google:u1", todayUtc(), DAILY_COST_CEILING_MICROS - 100);

    await expect(
      complete({
        feature: "prioritize",
        userId: "google:u1",
        systemStable: "S",
        userMessage: "X",
        maxTokens: 800, // estimate = 800 * 5 = 4000 micros, sum > 100,000
      }),
    ).rejects.toThrow(CostCeilingExceededError);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("TC-AI-05: succeeds when current+estimate is under the ceiling", async () => {
    recordAiCost(getDb(), "google:u1", todayUtc(), 50_000); // half the cap
    mockCreate.mockResolvedValue(fakeMessage());

    await expect(
      complete({
        feature: "summary",
        userId: "google:u1",
        systemStable: "S",
        userMessage: "X",
        maxTokens: 200,
      }),
    ).resolves.toBeDefined();
  });

  it("TC-AI-06: ceiling is per-user — u2 can call while u1 is capped", async () => {
    recordAiCost(getDb(), "google:u1", todayUtc(), DAILY_COST_CEILING_MICROS);
    mockCreate.mockResolvedValue(fakeMessage());

    await expect(
      complete({
        feature: "prioritize",
        userId: "google:u2",
        systemStable: "S",
        userMessage: "X",
      }),
    ).resolves.toBeDefined();
  });

  it("TC-AI-07: missing ANTHROPIC_API_KEY throws AiUnavailableError; no SDK call", async () => {
    // Drop the cached client so getAnthropicClient() re-resolves env.
    _setAnthropicClientForTesting(undefined);
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      complete({
        feature: "prioritize",
        userId: "google:u1",
        systemStable: "S",
        userMessage: "X",
      }),
    ).rejects.toThrow(AiUnavailableError);
  });

  it("TC-AI-09: caller-supplied model override flows through to SDK and audit log", async () => {
    mockCreate.mockResolvedValue(
      fakeMessage({
        usage: fakeUsage(),
      }),
    );

    await complete({
      feature: "prioritize",
      userId: "google:u1",
      systemStable: "S",
      userMessage: "X",
      model: "claude-sonnet-4-6",
    });

    expect(mockCreate.mock.calls[0]?.[0].model).toBe("claude-sonnet-4-6");
    expect(auditLog[0]?.model).toBe("claude-sonnet-4-6");
  });

  it("computes cost from usage and writes to the daily ledger", async () => {
    mockCreate.mockResolvedValue(
      fakeMessage({
        usage: fakeUsage({
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        }),
      }),
    );

    await complete({
      feature: "prioritize",
      userId: "google:u1",
      systemStable: "S",
      userMessage: "X",
    });

    // 100*1 + 50*5 = 350 micros = $0.000350
    expect(getDailyCostMicros(getDb(), "google:u1", todayUtc())).toBe(350);
  });

  it("TC-AI-10: parallel calls increment the ledger atomically", async () => {
    mockCreate.mockResolvedValue(
      fakeMessage({
        usage: fakeUsage({ input_tokens: 100, output_tokens: 0 }),
      }),
    );

    await Promise.all([
      complete({ feature: "x", userId: "google:u1", systemStable: "S", userMessage: "A" }),
      complete({ feature: "x", userId: "google:u1", systemStable: "S", userMessage: "B" }),
      complete({ feature: "x", userId: "google:u1", systemStable: "S", userMessage: "C" }),
    ]);

    expect(getDailyCostMicros(getDb(), "google:u1", todayUtc())).toBe(300);
  });
});
