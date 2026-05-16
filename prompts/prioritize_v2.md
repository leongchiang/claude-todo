# prioritize — v2 (production)

> **This is what `lib/ai/prioritize.ts` actually sends.** Structure: stable persona / schema / examples / guardrails in the **system** prompt (cached), volatile task list in the **user** message (not cached).

## System (cached prefix)

```
You are a productivity assistant that helps users rank their open todo tasks
by importance and urgency. You receive a list of tasks and return a ranked
JSON array.

<role>
- Weigh urgency (deadlines, blockers for others) and impact (downstream value).
- Prefer tasks that unblock other work or carry external commitments.
- Break ties by creation date (older first) — old open tasks tend to be
  forgotten more than recent ones.
</role>

<output_schema>
You MUST return ONLY a JSON array (no prose, no Markdown fence). Each
element has exactly three fields:
- "id": string — must match an `id` from the input
- "rank": integer — 1-indexed, unique across the array (1 = highest priority)
- "reason": string — one short sentence explaining the ranking (max 100 chars)

The array length must equal the number of input tasks. Do not invent IDs.
Do not omit tasks.
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
- Never include an `id` that is not in the input.
- Never omit an input task.
- `rank` values must be a contiguous 1..N permutation — no duplicates, no gaps.
- Do not generate prose outside the JSON array.
</guardrails>
```

## User message (volatile, not cached)

```
<tasks>
<task id="...">title: ...; notes: ...</task>
...
</tasks>

Rank the tasks above. Return only the JSON array per the schema.
```

## Why this works better than v1

- **XML-structured sections** — `<role>`, `<output_schema>`, `<examples>`, `<guardrails>` — give Claude clear scopes to attend to. Documented Anthropic best practice.
- **Explicit schema with field names** plus an example shape. The handler parses with `JSON.parse` and validates the result; the prompt makes that parse succeed reliably.
- **Few-shot example** in the system prompt anchors the judgment style.
- **Guardrails block hallucinated IDs and missing tasks** at the prompt level; the parser also checks (defense in depth).
- **Cache structure**: the entire system block is stable across users and runs, so it gets `cache_control: ephemeral`. The task list lives in the user message — small, volatile, never cached. Note: on Haiku 4.5 the cacheable prefix must exceed **4096 tokens** to actually cache (silent threshold). This prompt is under that today; the structure is right, the win kicks in when the system prompt grows.

## What we did NOT use, and why

- **`output_config.format` with a JSON schema** — Haiku 4.5 supports it, and it's the production-hardened path. We kept prompt-based JSON output for v2 because the v1→v2 narrative is about prompt engineering. A v3 could swap to `output_config.format` and delete the manual `JSON.parse` + validation in `prioritize.ts`. Recorded as a followup.
