import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _setAnthropicClientForTesting, _setAuditLoggerForTesting } from "@/lib/ai/client";
import { prioritize } from "@/lib/ai/prioritize";
import { AiResponseInvalidError, AiResponseParseError } from "@/lib/errors";
import { _resetDefaultDbForTesting, addTask, getDb, upsertUser } from "@/lib/storage";

let tmpDir: string;
let mockCreate: ReturnType<typeof vi.fn>;
let userId: string;

function reply(text: string, usage: object = { input_tokens: 10, output_tokens: 10 }) {
  return {
    id: "msg_pri",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text }],
    usage,
  };
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-pri-"));
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

describe("prioritize", () => {
  it("TC-PR-01: returns ranks 1..N unique for each input task", async () => {
    const a = addTask(getDb(), userId, { title: "alpha" });
    const b = addTask(getDb(), userId, { title: "beta" });
    const c = addTask(getDb(), userId, { title: "gamma" });

    mockCreate.mockResolvedValue(
      reply(
        JSON.stringify([
          { id: c.id, rank: 1, reason: "most urgent" },
          { id: a.id, rank: 2, reason: "secondary" },
          { id: b.id, rank: 3, reason: "deferrable" },
        ]),
      ),
    );

    const ranked = await prioritize(getDb(), userId);
    expect(ranked).toHaveLength(3);
    const ranks = new Set(ranked.map((r) => r.rank));
    expect(ranks).toEqual(new Set([1, 2, 3]));
  });

  it("TC-PR-02: 0 open tasks short-circuits to [] with no SDK call", async () => {
    const empty = await prioritize(getDb(), userId);
    expect(empty).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("TC-PR-03: with 51 open tasks, only sends 50 and accepts a 50-item response", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 51; i++) {
      ids.push(addTask(getDb(), userId, { title: `t${i}` }).id);
    }

    mockCreate.mockResolvedValue(
      reply(JSON.stringify(ids.slice(0, 50).map((id, i) => ({ id, rank: i + 1, reason: "r" })))),
    );

    const ranked = await prioritize(getDb(), userId);
    expect(ranked.length).toBeLessThanOrEqual(50);

    // The user message should NOT contain the 51st task's id.
    const userMessage = mockCreate.mock.calls[0]?.[0].messages[0].content as string;
    expect(userMessage).not.toContain(ids[50] as string);
  });

  it("TC-PR-04: malformed JSON in model output throws AiResponseParseError", async () => {
    addTask(getDb(), userId, { title: "x" });
    mockCreate.mockResolvedValue(reply("this is not JSON at all"));

    await expect(prioritize(getDb(), userId)).rejects.toThrow(AiResponseParseError);
  });

  it("tolerates a Markdown code-fence around valid JSON", async () => {
    const t = addTask(getDb(), userId, { title: "x" });
    mockCreate.mockResolvedValue(
      reply(`\`\`\`json\n${JSON.stringify([{ id: t.id, rank: 1, reason: "ok" }])}\n\`\`\``),
    );

    const ranked = await prioritize(getDb(), userId);
    expect(ranked).toHaveLength(1);
  });

  it("TC-PR-05: duplicate ranks throw AiResponseInvalidError", async () => {
    const a = addTask(getDb(), userId, { title: "a" });
    const b = addTask(getDb(), userId, { title: "b" });

    mockCreate.mockResolvedValue(
      reply(
        JSON.stringify([
          { id: a.id, rank: 1, reason: "r" },
          { id: b.id, rank: 1, reason: "r" },
        ]),
      ),
    );

    await expect(prioritize(getDb(), userId)).rejects.toThrow(AiResponseInvalidError);
  });

  it("TC-PR-06: hallucinated task IDs throw AiResponseInvalidError", async () => {
    addTask(getDb(), userId, { title: "real" });

    mockCreate.mockResolvedValue(reply(JSON.stringify([{ id: "ghost-id", rank: 1, reason: "r" }])));

    await expect(prioritize(getDb(), userId)).rejects.toThrow(AiResponseInvalidError);
  });
});
