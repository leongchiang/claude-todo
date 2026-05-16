import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as prioritizeHandler } from "@/app/api/v1/tasks/prioritize/route";
import { POST as summaryHandler } from "@/app/api/v1/tasks/summary/route";
import {
  _setAnthropicClientForTesting,
  _setAuditLoggerForTesting,
  DAILY_COST_CEILING_MICROS,
} from "@/lib/ai/client";
import { addTask, recordAiCost, todayUtc } from "@/lib/storage";

import { type ApiHarness, setupApiTest } from "../helpers/api";

let h: ApiHarness;
let mockCreate: ReturnType<typeof vi.fn>;

function reply(text: string) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 10 },
  };
}

const prioritizeReq = (init: RequestInit = {}) =>
  new Request("http://localhost/api/v1/tasks/prioritize", {
    method: "POST",
    ...init,
  }) as unknown as Parameters<typeof prioritizeHandler>[0];

const summaryReq = (init: RequestInit = {}) =>
  new Request("http://localhost/api/v1/tasks/summary", {
    method: "POST",
    ...init,
  }) as unknown as Parameters<typeof summaryHandler>[0];

beforeEach(() => {
  h = setupApiTest();
  process.env.ANTHROPIC_API_KEY = "sk-test";
  _setAuditLoggerForTesting(() => {});
  mockCreate = vi.fn();
  _setAnthropicClientForTesting({ messages: { create: mockCreate } as never });
});

afterEach(() => {
  _setAnthropicClientForTesting(undefined);
  _setAuditLoggerForTesting(undefined);
  h.cleanup();
});

describe("POST /api/v1/tasks/prioritize", () => {
  it("TC-API-10: 200 with ranked array on a happy-path call", async () => {
    const t1 = addTask(h.db, h.userId, { title: "alpha" });
    const t2 = addTask(h.db, h.userId, { title: "beta" });
    mockCreate.mockResolvedValue(
      reply(
        JSON.stringify([
          { id: t2.id, rank: 1, reason: "urgent" },
          { id: t1.id, rank: 2, reason: "less so" },
        ]),
      ),
    );

    const res = await prioritizeHandler(prioritizeReq({ headers: h.authHeaders }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tasks).toHaveLength(2);
    expect(body.tasks[0].rank).toBe(1);
  });

  it("TC-API-12: missing ANTHROPIC_API_KEY returns 503 ai_unavailable", async () => {
    addTask(h.db, h.userId, { title: "x" });
    _setAnthropicClientForTesting(undefined);
    delete process.env.ANTHROPIC_API_KEY;

    const res = await prioritizeHandler(prioritizeReq({ headers: h.authHeaders }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("ai_unavailable");
  });

  it("TC-API-13: cost ceiling reached returns 429 cost_ceiling_exceeded", async () => {
    addTask(h.db, h.userId, { title: "x" });
    recordAiCost(h.db, h.userId, todayUtc(), DAILY_COST_CEILING_MICROS);

    const res = await prioritizeHandler(prioritizeReq({ headers: h.authHeaders }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe("cost_ceiling_exceeded");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("malformed model output surfaces as 502 ai_response_invalid", async () => {
    addTask(h.db, h.userId, { title: "x" });
    mockCreate.mockResolvedValue(reply("not json at all"));

    const res = await prioritizeHandler(prioritizeReq({ headers: h.authHeaders }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("ai_response_invalid");
  });
});

describe("POST /api/v1/tasks/summary", () => {
  it("TC-API-11: 200 with { summary } string", async () => {
    const t = addTask(h.db, h.userId, { title: "shipped feature" });
    // Mark done so it counts as "today's completed"
    h.db
      .prepare("UPDATE tasks SET status='done', completed_at=? WHERE id=?")
      .run(new Date().toISOString(), t.id);

    mockCreate.mockResolvedValue(reply("You shipped one thing. Solid. Good day."));

    const res = await summaryHandler(summaryReq({ headers: h.authHeaders }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.summary).toBe("string");
    expect(body.summary.length).toBeGreaterThan(0);
  });

  it("returns 200 with empty-state string when nothing was completed today", async () => {
    addTask(h.db, h.userId, { title: "still open" });

    const res = await summaryHandler(summaryReq({ headers: h.authHeaders }));
    expect(res.status).toBe(200);
    expect((await res.json()).summary).toBe("No tasks completed yet today.");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
