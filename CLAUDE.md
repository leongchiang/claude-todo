# CLAUDE.md — ClaudeTodo

> **Purpose of this file:** Claude Code reads `CLAUDE.md` automatically at the start of every session in this project. It carries project-specific rules, conventions, and best practices. The contents are treated as **instructions that override default behavior**.
>
> This file is open source under MIT — fork freely. Sections are labeled `[KEEP]` (recommended for any fork), `[EDIT]` (project-specific, update for your fork), or `[OPTIONAL]`.

---

## 1. Project Overview `[EDIT]`

**ClaudeTodo** is an open-source tutorial project that teaches developers how to build a real, deployed, API-driven web application using Claude Code. The todo-list domain is trivial on purpose — the focus is the build process, captured live in `TUTORIAL.md`.

See [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) for requirements, [`TEST_CASES.md`](TEST_CASES.md) for the test suite, and [`TUTORIAL.md`](TUTORIAL.md) for the running walkthrough.

License: MIT. Repository: personal GitHub (public).

---

## 2. Tech Stack `[EDIT]`

- Node.js 20 LTS, TypeScript (strict mode)
- Next.js 14+ (App Router) — Server Components, Server Actions, Route Handlers
- React + Tailwind CSS (mobile-first)
- NextAuth (Auth.js v5) — Google + Microsoft OAuth/OIDC
- `better-sqlite3` for storage
- Zod for runtime validation
- `@asteasolutions/zod-to-openapi` to generate OpenAPI 3.1 spec
- Scalar for the public API docs UI at `/api/docs`
- `@anthropic-ai/sdk` for Claude calls
- Vitest + Playwright for tests
- Biome for lint + format
- pnpm for packages

---

## 3. Repo Layout `[EDIT]`

```
claude-todo/
├── CLAUDE.md
├── PRODUCT_SPEC.md
├── TEST_CASES.md
├── TUTORIAL.md
├── LICENSE
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── playwright.config.ts
├── next.config.mjs
├── tailwind.config.ts
├── app/                              ← Next.js App Router (pages + UI)
│   ├── layout.tsx
│   ├── page.tsx                      ← Marketing / sign-in landing
│   ├── (app)/
│   │   ├── layout.tsx                ← Auth-required layout
│   │   ├── page.tsx                  ← Todo list UI (responsive)
│   │   └── settings/page.tsx         ← PAT management
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── v1/
│   │   │   ├── me/route.ts
│   │   │   ├── tasks/route.ts
│   │   │   ├── tasks/[id]/route.ts
│   │   │   ├── tasks/prioritize/route.ts
│   │   │   ├── tasks/summary/route.ts
│   │   │   └── pats/route.ts
│   │   ├── openapi.json/route.ts
│   │   ├── openapi.yaml/route.ts
│   │   └── docs/route.ts             ← Scalar UI
│   └── globals.css
├── lib/
│   ├── auth.ts                       ← NextAuth config (Google + Microsoft)
│   ├── auth-bearer.ts                ← PAT verification middleware helper
│   ├── storage.ts                    ← SQLite CRUD (user-scoped)
│   ├── models.ts                     ← Zod schemas (source of truth for OpenAPI)
│   ├── pii.ts                        ← PII detection
│   ├── pats.ts                       ← PAT issue / hash / verify
│   ├── ratelimit.ts                  ← Per-user 60 req/min
│   ├── openapi.ts                    ← Registry + spec generator
│   └── ai/
│       ├── client.ts                 ← Anthropic SDK wrapper, caching, cost ceiling
│       ├── prioritize.ts
│       └── summary.ts
├── prompts/
│   ├── prioritize_v1.md              ← Naive
│   ├── prioritize_v2.md              ← Improved
│   ├── summary_v1.md
│   ├── summary_v2.md
│   └── README.md                     ← What changed and why
├── tests/
│   ├── unit/
│   └── e2e/
├── .claude/
│   ├── skills/
│   │   └── task-clarity-review/SKILL.md
│   ├── agents/
│   │   └── api-doc-writer.md
│   └── settings.json
├── .mcp.json
├── .devcontainer/
│   └── devcontainer.json
└── .github/
    ├── CODEOWNERS
    ├── PULL_REQUEST_TEMPLATE.md
    ├── ISSUE_TEMPLATE/
    │   ├── bug.yml
    │   └── feature.yml
    ├── dependabot.yml
    └── workflows/
        ├── ci.yml
        ├── codeql.yml
        ├── e2e.yml
        └── deploy.yml                ← OIDC → Azure App Service
```

---

## 4. Commands `[EDIT]`

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Type-check | `pnpm typecheck` |
| Lint | `pnpm lint` (`biome check .`) |
| Format | `pnpm format` |
| Unit/integration | `pnpm test` |
| Coverage | `pnpm test:cov` |
| E2E | `pnpm test:e2e` |
| Generate OpenAPI | `pnpm openapi` (writes `app/api/openapi.json/route.ts` fixtures) |
| Build | `pnpm build` |
| Deploy | push to `main` → GH Actions deploys to Azure |

Always use `pnpm`, never `npm` or `yarn`.

---

## 5. AI Best Practices `[KEEP]`

Generic best practices for any AI-augmented app — not tied to any organization.

### 5.1 Default model
- **Default: `claude-haiku-4-5-20251001`** — cheapest, fastest, sufficient for most tasks.
- Upgrade to Sonnet 4.6 / Opus 4.7 only when Haiku output is demonstrably insufficient — justify in a code comment.
- Centralize model selection in `lib/ai/client.ts`.

### 5.2 Prompt caching
- Any system prompt > ~1024 tokens MUST use `cache_control: { type: "ephemeral" }`.
- Verify cache hit rate > 0 on the second call in any new feature — if it's still 0, the cache config is wrong.

### 5.3 Cost ceiling
- Hard cap per user per day: **USD 0.10** for this POC (cheap to enforce, prevents runaway costs from bad prompts or abuse).
- Track input, output, cached tokens and computed cost in `lib/ai/client.ts`. Log per call.

### 5.4 PII handling
- Reject task content matching: email, phone, NRIC (Singapore IC), credit card number — at the boundary, before any DB write or AI call.
- AI call logs must contain **metadata only** (timestamps, token counts, model), never the prompt body or user content.

### 5.5 Graceful degradation
- If `ANTHROPIC_API_KEY` is missing or Claude API is down → CRUD endpoints still work; AI endpoints return HTTP 503 with `{ "error": "ai_unavailable" }`.

### 5.6 Audit logging
- Every Claude API call appends one JSON line to `logs/ai_calls.jsonl`:
  `{ ts, model, feature, user_id, input_tokens, output_tokens, cached_tokens, cost_usd_est, latency_ms, request_id }`
- **Never** log request or response bodies.

### 5.7 Secret handling
- API keys via env vars only. `.env*` is in `.gitignore`. `.env.example` is the only checked-in template.
- In CI/CD: secrets stored as GitHub **Environment secrets**, scoped per env.
- For Azure deploy: use **OIDC federation** — no long-lived secret in repo.

---

## 6. API Design Principles `[KEEP]`

This project is API-first. Every endpoint follows these rules:

- **Versioned:** all public endpoints under `/api/v1/`.
- **Auth:** session cookie (web) OR `Authorization: Bearer <PAT>` (external). Middleware unifies to a `user` object.
- **JSON only** request/response (except `/api/docs` HTML and `openapi.yaml`).
- **Consistent error shape:** `{ "error": "<machine_code>", "message": "<human_readable>" }` + appropriate HTTP status.
- **Inputs validated with Zod** at the handler boundary. Validation errors return 400 with field details.
- **Outputs validated with Zod** before serialization (catches schema drift).
- **OpenAPI is generated from Zod**, not the other way around. Schemas are the source of truth.
- **Rate limit:** 60 requests / minute / user. Return 429 with `Retry-After`.
- **No N+1 queries.** Use SQL joins or pre-fetches.
- **No silent failures.** Throw on unexpected states; let the global handler return 500 with a request ID.

---

## 7. Responsive Design Rules `[KEEP]`

- **Mobile-first.** Default styles target 320px+. Use `sm:`, `md:`, `lg:` to layer up.
- **No horizontal scroll** at any viewport ≥ 320px wide.
- **Touch targets** ≥ 44×44px on mobile.
- **Visible focus state** on all interactive elements.
- **Test at 3 widths** before declaring UI done: 375px (phone), 768px (tablet), 1280px (desktop).
- **Lighthouse mobile** Accessibility ≥ 90.

---

## 8. GitHub Workflow `[KEEP]`

Rules for how Claude Code interacts with this public GitHub repo.

### 8.1 Branching & commits
- Default branch: `main`.
- Feature branches: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`.
- **Conventional Commits** required: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`.

### 8.2 Pull requests
- All work via PR — no direct push to `main`.
- PR uses `.github/PULL_REQUEST_TEMPLATE.md` (must include: what, why, test plan, screenshot if UI).
- All CI checks green required: lint, typecheck, unit tests, E2E tests, CodeQL.
- Linear history (squash merge).

### 8.3 Security (free for public repos)
- **CodeQL** on PR + nightly. High-severity findings block merge.
- **Secret scanning** + push protection enabled.
- **Dependabot** weekly; auto-merge minor/patch updates after CI green.

### 8.4 Releases
- Tag `v0.x.x` → GH Action publishes Release with notes auto-generated from Conventional Commits.

### 8.5 What Claude Code may do
- ✅ Create branches, commits, PRs.
- ✅ Run `gh` CLI commands (allowed in `.claude/settings.json`).
- ❌ **Never** force-push, never `git push --force` without explicit user authorization.
- ❌ **Never** commit with `--no-verify` or `--no-gpg-sign`.
- ❌ **Never** merge a PR on the user's behalf.
- ❌ **Never** delete branches without confirmation.

---

## 9. Coding Conventions `[KEEP]`

- **TypeScript strict mode.** No `any` without an inline `// allow-any: <reason>` comment.
- **Style:** Biome defaults; line length 100.
- **Type annotations** on all exported function signatures.
- **No comments that restate code.** Comments explain *why* or document an invariant.
- **Imports:** node → external → local, separated by blank lines.
- **Errors:** throw `Error` subclasses; never `catch { }`.
- **Functions ≤ 50 lines.**
- **No premature abstraction** — three concrete uses before extracting.
- **Zod schemas at every trust boundary** — Server Actions, Route Handlers, env vars, external API responses.
- **Tests next to features** — when a feature is built, its tests are built in the same PR.

---

## 10. Testing Rules `[KEEP]`

- **Test cases reviewed first.** No production code until `TEST_CASES.md` is signed off.
- Tests live in `tests/unit/` and `tests/e2e/`, mirror source structure.
- **Storage tests hit a real (temp) SQLite file**, not mocks.
- **AI handler tests mock the Anthropic client** — never real API calls in CI.
- **E2E tests run headless** in CI; can run headed locally.
- Coverage ≥80% on `lib/` modules.
- Run `pnpm test && pnpm test:e2e` locally before declaring any task done.
- If a test fails: **fix the code or the test, never disable it.**

---

## 11. Workflow Rules `[KEEP]`

- **Spec-first.** Before any non-trivial code change, confirm it aligns with `PRODUCT_SPEC.md`. If unclear, ask.
- **TUTORIAL.md is part of the work.** Any PR that introduces a new feature, command, or decision worth teaching MUST update `TUTORIAL.md` in the same PR.
- **One concern per PR.** No drive-by refactors.
- **Confirm before destructive ops** — deleting files, dropping tables, force pushes.
- **When stuck, ask.** Don't loop on errors. Don't disable tests/hooks/lint to make red turn green.
- **Don't add features the spec doesn't list.** If a tempting addition comes up, capture it in `PRODUCT_SPEC.md` "Stretch" first.
- **Token discipline** — for AI feature changes, smoke test with one example and log token counts before declaring done.

---

## 12. Tutorial Doc Update Rule `[KEEP]`

When a chapter of work is completed:

1. Append or update the relevant chapter in `TUTORIAL.md`.
2. Include: what we built, key Claude Code interactions (prompts that worked well, what surprised us), commands run, lessons.
3. Keep the tone friendly and conversational. The audience is a developer new to Claude Code.
4. Don't paste secrets, internal URLs, or noise — keep it teachable.

---

## 13. Memory Usage `[OPTIONAL]`

- User-level memory is configured globally at `~/.claude/projects/.../memory/`.
- Don't write project-specific code facts here that belong in git history.
- Worth remembering across sessions: live deployment URL, Azure quirks, decisions that surprised us, prompt iterations that worked.

---

## 14. Permissions & Hooks `[EDIT]`

See `.claude/settings.json`:
- **Allowed:** `pnpm *`, `npx playwright *`, `git *`, `gh *`, `node`, `tsc`, `biome *`, `sqlite3`, `az *` (for Azure CLI).
- **Denied:** `rm -rf`, `git push --force*`, `git commit --no-verify`.
- **`PostToolUse` hook:** auto-run `biome format --write` on `*.ts`/`*.tsx` after Edit/Write.

---

## 15. How to Fork This Template `[OPTIONAL]`

For your own app:
1. Replace **§1**, **§2**, **§3**, **§4** with your project's specifics.
2. Keep **§5 (AI Best Practices)**, **§6 (API Design)**, **§7 (Responsive)**, **§8 (GitHub Workflow)**, **§9 (Coding Conventions)**, **§10 (Testing)**, **§11 (Workflow)** mostly verbatim — they're general.
3. Edit **§14** for your tooling.
4. Update `LICENSE` (keep MIT or change to your preference — credit original optional).
5. Read `TUTORIAL.md` for the build narrative.

---

## 16. References `[OPTIONAL]`

- Claude Code docs — https://docs.claude.com/en/docs/claude-code
- Next.js App Router — https://nextjs.org/docs/app
- NextAuth.js — https://authjs.dev
- Scalar API docs — https://scalar.com
- OpenAPI 3.1 — https://spec.openapis.org/oas/v3.1.0
- `hesreallyhim/awesome-claude-code` — community CLAUDE.md examples
- `anthropics/skills` — official skill examples

---

*Last updated: 2026-05-14 (v0.3 — personal OSS, MIT, Azure POC, SSO + API-first)*
