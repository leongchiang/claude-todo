# prioritize — v1 (naive)

> The first attempt. Kept in the repo as a teaching artifact — **the production code uses v2**.

```
You are a productivity assistant. Given a user's open tasks, rank them by importance.
Return a JSON array.

Tasks:
{{TASK_LIST}}
```

## Why we moved on from v1

- **Underspecified output shape.** "Return a JSON array" gives no signal on field names, ordering, or whether to wrap in an object. Claude sometimes returned `{ "tasks": [...] }`, sometimes a bare array, sometimes JSON inside a code-fence. Production code had to handle all three.
- **No role/persona depth.** "You are a productivity assistant" doesn't bias toward the *kind* of judgment we want (urgency vs. effort vs. impact). The model defaulted to alphabetical or creation-order in surprising cases.
- **No examples.** Few-shot is the cheapest accuracy lever for a constrained output task; v1 has none.
- **No guardrails.** The model occasionally hallucinated task IDs that weren't in the input (TC-PR-06 catches this in v2, but v1 had no defense).
- **Not cacheable.** The whole prompt — task list and all — was inlined into a single template. Every call sent a fresh prefix; cache hit rate = 0.

See `prioritize_v2.md` for the working version.
