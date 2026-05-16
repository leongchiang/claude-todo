import { AiResponseInvalidError, AiResponseParseError } from "../errors";
import type { Db } from "../storage";
import { listTasks } from "../storage";

import { complete } from "./client";

const MAX_TASKS = 50;

// Source: prompts/prioritize_v2.md. Kept inline so the bundle doesn't depend
// on disk reads at request time; markdown stays in sync via review.
const SYSTEM_PROMPT = `You are a productivity assistant that helps users rank their open todo tasks by importance and urgency. You receive a list of tasks and return a ranked JSON array.

<role>
- Weigh urgency (deadlines, blockers for others) and impact (downstream value).
- Prefer tasks that unblock other work or carry external commitments.
- Break ties by creation date (older first) — old open tasks tend to be forgotten more than recent ones.
</role>

<output_schema>
You MUST return ONLY a JSON array (no prose, no Markdown fence). Each element has exactly three fields:
- "id": string — must match an \`id\` from the input
- "rank": integer — 1-indexed, unique across the array (1 = highest priority)
- "reason": string — one short sentence explaining the ranking (max 100 chars)

The array length must equal the number of input tasks. Do not invent IDs. Do not omit tasks.
</output_schema>

<examples>
Input:
<tasks>
<task id="a">title: Reply to Dana's deploy question; notes: she's blocked</task>
<task id="b">title: Refactor invoice formatter; notes: tech debt</task>
<task id="c">title: Pick lunch spot for Friday</task>
</tasks>

Output:
[
  {"id":"a","rank":1,"reason":"unblocks a teammate — external dependency"},
  {"id":"b","rank":2,"reason":"non-urgent but real engineering value"},
  {"id":"c","rank":3,"reason":"low stakes, easy to defer"}
]
</examples>

<guardrails>
- Never include an \`id\` that is not in the input.
- Never omit an input task.
- \`rank\` values must be a contiguous 1..N permutation — no duplicates, no gaps.
- Do not generate prose outside the JSON array.
</guardrails>`;

export interface RankedTask {
  id: string;
  rank: number;
  reason: string;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildUserMessage(
  tasks: ReadonlyArray<{ id: string; title: string; notes: string | null }>,
): string {
  const items = tasks
    .map(
      (t) =>
        `<task id="${escapeXml(t.id)}">title: ${escapeXml(t.title)}; notes: ${escapeXml(t.notes ?? "")}</task>`,
    )
    .join("\n");
  return `<tasks>\n${items}\n</tasks>\n\nRank the tasks above. Return only the JSON array per the schema.`;
}

function parseAndValidate(text: string, inputIds: ReadonlyArray<string>): RankedTask[] {
  // Tolerate a code-fence even though the prompt forbids it (defense in depth).
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new AiResponseParseError(`prioritize: model returned non-JSON — ${(e as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new AiResponseParseError("prioritize: expected JSON array");
  }

  const result: RankedTask[] = [];
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { id: unknown }).id !== "string" ||
      typeof (item as { rank: unknown }).rank !== "number" ||
      typeof (item as { reason: unknown }).reason !== "string"
    ) {
      throw new AiResponseParseError("prioritize: invalid item shape in array");
    }
    result.push(item as RankedTask);
  }

  // Invariants (TC-PR-05, TC-PR-06): unique 1..N ranks, IDs all from input.
  const inputSet = new Set(inputIds);
  const seenRanks = new Set<number>();
  for (const item of result) {
    if (!inputSet.has(item.id)) {
      throw new AiResponseInvalidError(`prioritize: model returned unknown task id ${item.id}`);
    }
    if (!Number.isInteger(item.rank) || item.rank < 1 || item.rank > result.length) {
      throw new AiResponseInvalidError(
        `prioritize: rank ${item.rank} out of range 1..${result.length}`,
      );
    }
    if (seenRanks.has(item.rank)) {
      throw new AiResponseInvalidError(`prioritize: duplicate rank ${item.rank}`);
    }
    seenRanks.add(item.rank);
  }
  if (result.length !== inputIds.length) {
    throw new AiResponseInvalidError(
      `prioritize: model returned ${result.length} items, expected ${inputIds.length}`,
    );
  }
  return result;
}

export async function prioritize(db: Db, userId: string): Promise<RankedTask[]> {
  // TC-PR-03: cap at 50 oldest open tasks.
  const { items } = listTasks(db, userId, { status: "open", limit: MAX_TASKS });

  // TC-PR-02: empty list short-circuits — no SDK call, no cost.
  if (items.length === 0) return [];

  const userMessage = buildUserMessage(
    items.map((t) => ({ id: t.id, title: t.title, notes: t.notes })),
  );

  const result = await complete({
    feature: "prioritize",
    userId,
    systemStable: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 800,
  });

  return parseAndValidate(
    result.text,
    items.map((t) => t.id),
  );
}
