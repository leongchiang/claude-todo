# prompts/

Production prompts and their predecessors for each AI feature. We keep v1 alongside v2 because the v1 → v2 delta is the chapter's teachable artifact — readers see both the failure modes and the fixes.

## Files

| File | What it is |
|---|---|
| `prioritize_v1.md` | Naive first attempt at rank-my-open-tasks. Underspecified output, no examples, no guardrails. |
| `prioritize_v2.md` | **Production.** XML-structured persona/schema/examples/guardrails in the cached system prompt; task list in the volatile user message. |
| `summary_v1.md` | Naive daily summary. No length contract, no tone guidance, no empty-state handling. |
| `summary_v2.md` | **Production.** Hard three-sentence contract, warm tone with example, empty-state short-circuited in code. |

## What changed from v1 → v2 (across both features)

1. **Output shape made explicit.** v1 said "return JSON" or "summarize"; v2 declares the schema field-by-field (prioritize) or the sentence count (summary).
2. **Few-shot examples added.** Cheapest accuracy lever for constrained output.
3. **Structured XML sections** (`<role>`, `<output_schema>`, `<examples>`, `<guardrails>`). Gives Claude scopes to attend to instead of one undifferentiated wall of instructions.
4. **Guardrails enumerated** and re-checked in code. Defense in depth.
5. **Cache structure**: stable content (persona/schema/examples) in the cacheable `system` block; volatile content (today's task list) in `messages[]`. Caller hits `cache_control: {type: "ephemeral"}` on the system block.

## Where the code lives

- `lib/ai/client.ts` — the SDK wrapper. Cost ceiling, prompt caching, audit log.
- `lib/ai/prioritize.ts` — assembles the prioritize prompt, parses + validates output.
- `lib/ai/summary.ts` — assembles the summary prompt, enforces sentence count.

## Versioning convention

When a prompt changes substantively, bump the filename (`_v3.md`) and keep the old one. Trivial tweaks (typos, comment edits) modify in place. The chapter's narrative depends on the v1 → v2 diff staying visible.

## Followup: structured outputs

A `_v3` for `prioritize` could replace prompt-based JSON instructions with `output_config.format` + a JSON schema (Haiku 4.5 supports it). That would let us delete the manual `JSON.parse` + invariant checks in `prioritize.ts`. Not done in v2 because the prompt-engineering arc is the teaching point; this is a known-good future hardening.
