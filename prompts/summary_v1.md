# summary — v1 (naive)

> First attempt. Kept as a teaching artifact — production uses v2.

```
Summarize what the user got done today.

Completed tasks:
{{TASK_LIST}}
```

## Why we moved on

- **No length constraint.** The spec asks for exactly 3 sentences; v1 returned anywhere from 1 to 10.
- **No tone guidance.** Default register was overly formal ("The user successfully accomplished..."). Reads like a status report from 2003.
- **No empty-state handling in the prompt** — the model would invent activity when the task list was empty rather than say "you completed nothing today." (We now short-circuit empty in code without calling the model; v1 had us calling the model with an empty list and getting hallucinations back.)
- **No cache structure** — same problem as `prioritize_v1.md`.

See `summary_v2.md`.
