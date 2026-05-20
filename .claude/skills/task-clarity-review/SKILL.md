# task-clarity-review

Review a todo task title for clarity, specificity, and actionability. Suggest concrete rewrites.

## When to invoke

Use `/task-clarity-review` when a task title is vague, could mean multiple things, or lacks a clear done-state. Examples of titles worth reviewing: "Fix bug", "Look into auth", "Update docs".

## What to do

1. **Read the task title from the user's message.** If none is provided, ask for one.

2. **Evaluate on three axes:**
   - **Specific** — does it name what exactly needs to change? ("Fix login redirect" beats "Fix auth")
   - **Actionable** — does it start with a verb that implies a clear action? ("Write", "Add", "Remove", "Investigate", "Fix", "Deploy")
   - **Bounded** — is there a clear done state? ("Add email validation to signup form" is bounded; "Improve UX" is not)

3. **Score each axis** as ✅ (clear) or ⚠ (needs work), one line each.

4. **Suggest 2–3 alternative titles** ordered from most to least specific. Each should:
   - Keep the same intent as the original
   - Be ≤ 80 characters
   - Start with an imperative verb

5. **Pick a recommended rewrite** (usually the most specific) and say why.

## Format

Keep the response short. No headers longer than one line. No preamble. Output:

```
Original: <title>

Clarity check:
  Specific:   ✅ / ⚠  <one-line note>
  Actionable: ✅ / ⚠  <one-line note>
  Bounded:    ✅ / ⚠  <one-line note>

Alternatives:
  1. <most specific rewrite>
  2. <moderate rewrite>
  3. <minimal rewrite>

Recommended: #<n> — <one sentence why>
```

## Example

Input: "look into the slow query"

```
Original: look into the slow query

Clarity check:
  Specific:   ⚠  Which query? Which endpoint or feature?
  Actionable: ⚠  "Look into" has no clear output — investigate and document? fix?
  Bounded:    ⚠  Done when? When it's understood? When it's fixed?

Alternatives:
  1. Profile /api/v1/tasks list query and add a covering index if needed
  2. Investigate slow query on tasks list and file a fix ticket
  3. Fix the slow tasks list query

Recommended: #1 — names the endpoint, the tool (profiling), and the outcome (index or not).
```
