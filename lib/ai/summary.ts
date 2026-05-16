import type { Db } from "../storage";
import { listTasks } from "../storage";

import { complete } from "./client";

const EMPTY_RESPONSE = "No tasks completed yet today.";

const SYSTEM_PROMPT = `You write a daily recap of what a user got done today. You receive a list of tasks the user completed today (in UTC) and return a short summary.

<role>
- Speak warmly and personally ("you got X done today"), not like a status report. Avoid bureaucratic phrasing.
- Highlight the most substantive items; minor items can be grouped.
- Do not invent tasks — only summarize what's in the input.
</role>

<output_constraints>
You MUST return EXACTLY three sentences. Not four, not two. Three.
No bullet points. No headers. No leading "Today you...". Plain prose.
Output only the three sentences — no preamble, no closing.
</output_constraints>

<examples>
Input:
- Refactored the invoice formatter
- Reviewed Dana's deploy PR
- Sent the Q3 update to investors

Output:
You shipped the invoice-formatter refactor and got Dana unblocked by reviewing her deploy PR. The Q3 investor update went out today too — a meaningful day on the comms side. Solid output across engineering and operations.
</examples>

<guardrails>
- Never reference tasks not in the input.
- Never include the word "todo" or "task" — write naturally.
- If only 1–2 tasks were completed, still produce exactly 3 sentences (the third can reflect on the day's shape).
</guardrails>`;

function countSentences(text: string): number {
  // Trim and count terminal punctuation. A trailing punctuation char with no
  // text after it still counts; an ellipsis "..." counts as one.
  const normalised = text.trim().replace(/\.{3,}/g, ".");
  const matches = normalised.match(/[.!?]+(?=\s|$)/g);
  return matches?.length ?? 0;
}

function todayCompletedTasks(db: Db, userId: string): string[] {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const cutoff = dayStart.toISOString();

  const { items } = listTasks(db, userId, { status: "done", limit: 50 });
  return items.filter((t) => (t.completed_at ?? "") >= cutoff).map((t) => t.title);
}

export async function summary(db: Db, userId: string): Promise<string> {
  const titles = todayCompletedTasks(db, userId);
  // TC-DS-02: empty short-circuits — no SDK call, no cost.
  if (titles.length === 0) return EMPTY_RESPONSE;

  const userMessage = `Today's completed tasks:\n${titles.map((t) => `- ${t}`).join("\n")}`;

  const first = await complete({
    feature: "summary",
    userId,
    systemStable: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 200,
  });

  if (countSentences(first.text) <= 3) return first.text.trim();

  // TC-DS-03: model overshot. One retry with an explicit reminder.
  const retry = await complete({
    feature: "summary",
    userId,
    systemStable: SYSTEM_PROMPT,
    userMessage:
      userMessage +
      "\n\nYour previous attempt had more than three sentences. Return EXACTLY three sentences.",
    maxTokens: 200,
  });

  if (countSentences(retry.text) <= 3) return retry.text.trim();

  // Last resort: take the first three sentences. Better degraded UX than 500.
  const sentences = retry.text.trim().match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 3).join(" ").trim() || retry.text.trim();
}
