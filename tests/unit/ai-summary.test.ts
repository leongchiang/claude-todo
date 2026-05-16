import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _setAnthropicClientForTesting, _setAuditLoggerForTesting } from "@/lib/ai/client";
import { summary } from "@/lib/ai/summary";
import { _resetDefaultDbForTesting, addTask, getDb, markDone, upsertUser } from "@/lib/storage";

let tmpDir: string;
let mockCreate: ReturnType<typeof vi.fn>;
let userId: string;

function reply(text: string) {
  return {
    id: "msg_sum",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text }],
    usage: { input_tokens: 30, output_tokens: 40 },
  };
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-sum-"));
  process.env.DATABASE_PATH = join(tmpDir, "test.db");
  process.env.ANTHROPIC_API_KEY = "sk-test";
  _resetDefaultDbForTesting();
  _setAuditLoggerForTesting(() => {});
  mockCreate = vi.fn();
  _setAnthropicClientForTesting({ messages: { create: mockCreate } as never });

  const user = upsertUser(getDb(), {
    provider: "google",
    provider_user_id: "u1",
    email: null,
    display_name: null,
  });
  userId = user.id;
});

afterEach(() => {
  _setAnthropicClientForTesting(undefined);
  _setAuditLoggerForTesting(undefined);
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("summary", () => {
  it("TC-DS-01: returns a 3-sentence string when model behaves", async () => {
    const t = addTask(getDb(), userId, { title: "shipped feature" });
    markDone(getDb(), t.id, userId);

    mockCreate.mockResolvedValue(reply("You shipped a feature. Real progress today. Keep going."));

    const out = await summary(getDb(), userId);
    expect(out).toMatch(/\./);
    const sentences = out.match(/[.!?]+/g);
    expect(sentences?.length).toBe(3);
  });

  it("TC-DS-02: with 0 completed today returns the empty-state string; no SDK call", async () => {
    const out = await summary(getDb(), userId);
    expect(out).toBe("No tasks completed yet today.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("TC-DS-03: model overshoots with 5 sentences — wrapper retries once, then trims to <=3", async () => {
    const t = addTask(getDb(), userId, { title: "x" });
    markDone(getDb(), t.id, userId);

    mockCreate
      .mockResolvedValueOnce(reply("One. Two. Three. Four. Five."))
      .mockResolvedValueOnce(reply("Tighter. Now three. Done."));

    const out = await summary(getDb(), userId);
    const sentences = out.match(/[.!?]+/g);
    expect(sentences?.length).toBeLessThanOrEqual(3);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("falls back to truncation when retry also overshoots", async () => {
    const t = addTask(getDb(), userId, { title: "x" });
    markDone(getDb(), t.id, userId);

    mockCreate.mockResolvedValue(reply("One. Two. Three. Four. Five."));

    const out = await summary(getDb(), userId);
    const sentences = out.match(/[.!?]+/g);
    expect(sentences?.length).toBeLessThanOrEqual(3);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
