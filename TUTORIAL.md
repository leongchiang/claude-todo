# ClaudeTodo — A Tutorial: Building a Real Web App with Claude Code

> **Living document.** This file grows as the build progresses. Past chapters are kept short and pointed; future chapters are placeholders that get filled in as we ship each piece.

**License:** MIT
**Audience:** developers who want to learn Claude Code by following along to build a real, deployed, AI-augmented web application.
**What you'll build:** a responsive todo app with Google + Microsoft SSO, a public REST API with OpenAPI docs, Claude-powered AI features, deployed to Azure.
**Time:** approximately one focused day, broken across several Claude Code sessions.

---

## How to read this tutorial

Each chapter follows the same structure:

1. **Goal** — what we set out to do
2. **Decisions** — what we chose and why (and what we rejected)
3. **What we asked Claude Code** — actual prompts and how Claude responded
4. **Output** — what files / commits resulted
5. **Lessons** — surprises, things to remember, what to do differently

The "What we asked Claude Code" sections are the heart of this tutorial. The goal isn't to teach you to build a todo app — it's to teach you **how to collaborate with Claude Code effectively** so you can build *anything*.

---

## Table of Contents

- [Chapter 0 — Why this tutorial exists](#chapter-0--why-this-tutorial-exists) ✅
- [Chapter 1 — Settling on what to build](#chapter-1--settling-on-what-to-build) ✅
- [Chapter 2 — Choosing the stack](#chapter-2--choosing-the-stack) ✅
- [Chapter 3 — Writing the Product Spec](#chapter-3--writing-the-product-spec) ✅
- [Chapter 4 — Writing CLAUDE.md (project memory)](#chapter-4--writing-claudemd-project-memory) ✅
- [Chapter 5 — Designing the test suite first](#chapter-5--designing-the-test-suite-first) ✅
- [Chapter 6 — Scaffolding the project](#chapter-6--scaffolding-the-project) ✅
- [Chapter 7 — Storage layer with TDD](#chapter-7--storage-layer-with-tdd) ✅
- [Chapter 8 — Google + Microsoft SSO](#chapter-8--google--microsoft-sso) ✅
- [Chapter 9 — The public REST API](#chapter-9--the-public-rest-api) ✅
- [Chapter 10 — OpenAPI docs](#chapter-10--openapi-docs) ✅
- [Chapter 11 — AI features with prompt engineering](#chapter-11--ai-features-with-prompt-engineering) ✅
- [Chapter 12 — Responsive web UI](#chapter-12--responsive-web-ui) ✅
- [Chapter 13 — Claude Code superpowers: skills, subagents, MCP, hooks](#chapter-13--claude-code-superpowers-skills-subagents-mcp-hooks) ⏳
- [Chapter 14 — CI/CD with GitHub Actions](#chapter-14--cicd-with-github-actions) ⏳
- [Chapter 15 — Deploying to Azure](#chapter-15--deploying-to-azure) ⏳
- [Chapter 16 — Lessons & how to fork this](#chapter-16--lessons--how-to-fork-this) ⏳

Legend: ✅ done · ⏳ planned

---

## Chapter 0 — Why this tutorial exists

Most "how to use Claude Code" content is either a feature tour or a snippet demo. Neither shows you what it actually feels like to **collaborate** with Claude Code on a real project: changing your mind, course-correcting scope, getting Claude to draft documents before code, layering in skills and subagents as the project grows.

This tutorial fills that gap. You'll see the messy middle: the moments where Claude proposes the wrong tech, where I redirect, where memory kicks in, where a hook saves time, where a custom skill gets reused.

**The product is the process.** The todo app is a vehicle.

---

## Chapter 1 — Settling on what to build

### Goal
Decide on a small, real app to use as the learning vehicle.

### Decisions
- **Small domain, big surface.** A todo app is trivial enough that you can keep its logic in your head and focus on the Claude Code mechanics around it.
- **Tutorial-first.** Every chapter must teach something. Features are picked for what they let me teach, not for their own value.
- **Real, deployed.** Not a sandbox — a public URL on Azure with a real CI/CD pipeline.

### What we asked Claude Code
Initial prompt was broad: "help me explore Claude Code's facilities — skills, agents, MCP, memory, prompt engineering — with a small app." Claude offered four candidate apps. I picked **todo list** for simplicity.

### Lessons
- **Don't let Claude pick the app for you.** Claude can list ideas, but you know what you want to teach. Choose the domain that minimizes incidental complexity.
- **Brief Claude with intent, not just task.** "I want to teach others to use Claude Code" gave Claude enough context to pre-bias toward demonstrable features over slick UX.

---

## Chapter 2 — Choosing the stack

### Goal
Pick a tech stack that's modern, deployable, and friendly to a tutorial.

### Decisions
   - **Language:** TypeScript (strict)
   - **Framework:** Next.js 14+ (App Router) — single repo for UI + API, Server Actions, Route Handlers
   - **Auth:** NextAuth (Auth.js v5) — Google + Microsoft OAuth/OIDC
   - **Storage:** SQLite via `better-sqlite3` (POC simplicity, with a documented upgrade path to Postgres)
   - **AI:** Claude API via `@anthropic-ai/sdk`
   - **Tests:** Vitest (unit) + Playwright (E2E)
   - **Lint/format:** Biome
   - **Packages:** pnpm
   - **Deploy:** Azure App Service Linux (Node 20), free or B1 tier
   - **CI:** GitHub Actions (free for public repos)
   - **API docs:** OpenAPI 3.1 (generated from Zod schemas) + Scalar UI

### What we asked Claude Code
"Use my personal GitHub instead of GHES, MIT license, Azure for deploy, API-oriented with Google + MS SSO, responsive web, public OpenAPI docs. Regenerate the docs."

Claude updated three files in one pass and added two new ones (`LICENSE`, this `TUTORIAL.md`).

### Lessons
- **Change your mind early; it's cheap.** Spec changes cost minutes; code changes cost hours. We changed direction three times in the spec phase. Zero code lost.
- **Tech-stack arguments belong in the spec, not in code reviews.** Settle the stack before any keystroke of implementation.
- **Claude is good at full rewrites of structured documents.** Don't be shy about asking for "regenerate everything for this new direction." Markdown is cheap.

---

## Chapter 3 — Writing the Product Spec

### Goal
Capture the *what* and *why* before any *how*. Anything ambiguous gets surfaced as an open question rather than guessed.

### Decisions
The spec covers:
- Purpose (this is a tutorial, the domain is incidental)
- User stories (signed-in user, external developer, mobile user)
- Functional requirements (auth, CRUD, AI features, API, OpenAPI, responsive)
- Non-functional (perf, security, cost ceiling, accessibility)
- Tech stack
- API surface
- Azure resources
- Risks + open questions

Open questions are first-class: anywhere we'd otherwise guess, we ask instead.

### What we asked Claude Code
Three rounds of "draft / show me / I want X different / redraft." Each redraft included a changelog at the top so I could see what moved.

### Output
[`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) — v0.3

### Lessons
- **Specs are conversations.** Don't try to land the perfect spec in one shot. Land a v0.1 and iterate.
- **Open questions are good.** A spec full of decisive-sounding paragraphs that secretly contain guesses is worse than a spec with a clear "to decide" list.
- **Changelog at the top of the spec helps you and Claude.** Both of you can see what moved between revisions without re-reading the whole thing.

---

## Chapter 4 — Writing CLAUDE.md (project memory)

### Goal
Encode the rules Claude Code should follow every time it touches this repo: tech stack, conventions, AI best practices, GitHub workflow, what Claude may *not* do.

### Decisions
The file is structured by section with each section tagged `[KEEP]` (general best practices, recommended for anyone forking), `[EDIT]` (project-specific, change for your fork), or `[OPTIONAL]`.

Key rules encoded:
- Default Claude model is Haiku 4.5; upgrade only when justified
- Prompt caching mandatory on system prompts > 1024 tokens
- Per-user daily cost ceiling USD 0.10
- PII rejected at the boundary (email, phone, NRIC, credit card)
- AI call logs contain metadata only — never bodies
- All API endpoints under `/api/v1/`
- Mobile-first responsive, no horizontal scroll < 320px
- Never force-push, never `--no-verify`, never merge on user's behalf
- TUTORIAL.md update required in any PR that introduces a new teachable feature

### What we asked Claude Code
"Make CLAUDE.md cover not just code conventions but also AI best practices, API design, responsiveness, and the GitHub workflow. Mark sections as 'keep' vs 'edit' for forking."

### Output
[`CLAUDE.md`](CLAUDE.md) — v0.3

### Lessons
- **CLAUDE.md is leverage.** Every rule you encode there is a rule Claude doesn't need to be reminded of every session. Worth investing in early.
- **Tag sections for reuse.** If your CLAUDE.md will be forked, mark what's general vs what's project-specific. Saves the next person time.
- **"Never" rules are as important as "always" rules.** Force-push, `--no-verify`, auto-merging PRs — all things Claude is otherwise happy to do.

---

## Chapter 5 — Designing the test suite first

### Goal
Agree on observable behavior before writing code. Get a reviewable test catalog that doubles as a checklist.

### Decisions
- 117 test cases across 13 areas (storage, PII, auth, PATs, AI client, prioritize, summary, API handlers, OpenAPI, E2E web responsive, external developer, security, CI/static)
- Priority labels: P0 (ship-blocker), P1, P2
- Given / When / Then format for everything — readable by humans, mechanically translatable to Vitest/Playwright

### What we asked Claude Code
"Generate the test cases / test suite for me to review, as part of the process."

### Output
[`TEST_CASES.md`](TEST_CASES.md) — v0.2

### Lessons
- **Test-cases-first ≠ TDD-purist.** You don't have to write all tests before any code. You do need to agree on **what counts as done** before writing any code.
- **Negative tests catch the surprises.** "u2 cannot see u1's task" caught more design issues than the positive cases.
- **A reviewed test catalog is a great handoff doc.** If you onboarded a teammate today, this file would orient them faster than the code itself.

---

## Chapter 6 — Scaffolding the project ✅

### Goal
Turn five markdown files into a working Next.js codebase. No features yet — just the bones: every config in place, dev server boots, lint and tests green on an empty repo, so Chapters 7–15 have somewhere to land.

### Decisions

- **Scaffold via `pnpm create next-app`, then layer on.** Don't hand-roll the directory tree; `create-next-app` knows the current Next idioms (it's the spec, in a sense). Then add Biome / Vitest / Playwright on top.
- **`--no-eslint`.** We use Biome (§9) for lint and format. Letting `create-next-app` drop in its ESLint config and then ripping it out is wasted work.
- **`--no-src-dir`, app at the root.** Matches the repo layout in `CLAUDE.md` §3 and keeps imports short.
- **`--use-pnpm` and `--turbopack`.** Both are committed to in CLAUDE.md; pinning them at scaffold time avoids divergence.
- **Sharp / better-sqlite3 / esbuild / biome / unrs-resolver: all `allowBuilds: true`.** pnpm 11 now gates package build scripts behind explicit opt-in; we trust all five and need their native binaries.
- **Test runners stubbed with one green test each.** A passing `vitest` and `playwright` from day one is worth more than a slightly emptier diff — `pnpm test:e2e` proves the dev-server lifecycle works before we depend on it.
- **Rejected: `next-auth@beta` (Auth.js v5).** The pre-execution plan called for the v5 beta; reversed to v4 stable (`^4.24.0`) on the principle that betas drift mid-tutorial and a reader following along in three months shouldn't fight a different API.
- **Rejected: empty `.github/workflows/` directory.** The plan flagged it as an open question. Skipped — Chapter 14 will write the directory when there's actual CI to put in it.

### What we asked Claude Code

This was the first chapter that involved real shell work, not just markdown. A few patterns emerged:

- **The pre-execution plan paid off.** I asked Claude to draft Chapter 6 as a plan *before* running anything (then "go execute"). Reviewing the plan caught the `next-auth@beta` mistake before any code touched disk. Worth the 5 minutes every time.
- **Claude handled the non-empty-target gotcha by itself.** `pnpm create next-app .` would clash with the existing markdown files. Claude scaffolded into `/tmp/cn-scaffold` and `rsync`'d back, skipping `README.md` / `.gitignore` / `node_modules`. I didn't have to coach it — it noticed the conflict and routed around.
- **Tool environment leaked through.** The bash environment had no `pnpm`, no `gh`, no Homebrew. Claude installed pnpm via `npm config set prefix ~/.npm-global && npm i -g pnpm` (user-local, no sudo) and `gh` via the prebuilt macOS arm64 release from `cli/cli`. Felt good — the *agent* unblocking itself rather than asking me to.
- **Memory worked as advertised.** Two non-obvious quirks (the user-local pnpm path; pnpm 11's `allowBuilds` gate) went into project memory so the next session doesn't re-discover them.

The one thing I had to set up by hand: `git config --global user.{name,email}` and `gh auth login`. The harness deliberately won't touch git config or run interactive auth — correct posture, even if it adds two pauses.

### Output

Branch `chore/scaffold` → PR #1 → merged.

- 32 files added: `app/`, `public/`, Tailwind/PostCSS, Biome / Vitest / Playwright configs, `package.json` + lockfile + `pnpm-workspace.yaml`, `.env.example`, `.claude/settings.json` (allow/deny + `PostToolUse` biome-format hook), `.github/` skeletons (PR template, CODEOWNERS, dependabot, two issue templates), `README.md`, two smoke tests, skeleton dirs (`lib/`, `lib/ai/`, `prompts/`, `data/`).
- 1 modified: `TUTORIAL.md` (this chapter).
- Smoke check, all green:

```
$ pnpm typecheck   → tsc --noEmit (0 errors)
$ pnpm lint        → biome check . (13 files, clean)
$ pnpm test        → vitest run (1 passed)
$ pnpm build       → next build (4 static pages, 836ms compile)
$ pnpm test:e2e    → playwright (1 passed, 3.4s incl. webServer boot)
```

### Lessons

- **Plan, then execute, then rewrite the plan as a retrospective.** The Chapter 6 narrative existed in three states: plan, plan-with-status-marker, retrospective. Each had a job. Reading the plan caught the `next-auth@beta` mistake. Reading the executed-with-marker version while the dust settled caught the `CLAUDE.md` §2 version drift. The retrospective (this section) is what readers see.
- **Don't trust install output as a smoke check.** `create-next-app` printed `Aborting installation` while having successfully installed every package — pnpm 11's ignored-builds error formats like a fatal abort. The actual smoke check is `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e`. Run all five, not "did install succeed."
- **pnpm 11 changed shape mid-cycle.** The `allowBuilds:` placeholders are mandatory — every subsequent pnpm command fails until they resolve to `true`/`false`. Worth a memory entry. If you start a project today, expect to make this decision on your first install.
- **`exactOptionalPropertyTypes` bites third-party types harder than your own.** Playwright's `defineConfig` rejects `workers: undefined` because its declared type is `string | number`. Fixed with a conditional spread (`...(process.env.CI ? { workers: 1 } : {})`). Keep the flag — but be ready to spread-around config files.
- **The version pin matters.** `create-next-app` picked Next 16 / React 19 / Tailwind v4 — newer than the "14+" the spec implied. We patched `CLAUDE.md` §2 in this same PR. Future Chapter 6 forks: pin actual major versions, not minimums.
- **The agent will unblock itself if you let it.** No pnpm? install user-local. No `gh`? curl the binary. The pattern I want to repeat: tell Claude the goal, let it find the path. The pattern I want to avoid: micro-managing each shell command.

---

## Chapter 7 — Storage layer with TDD ✅

### Goal
First real code in the repo. Implement `lib/storage.ts` — user-scoped CRUD over SQLite — and prove correctness via the 12 test cases from `TEST_CASES.md` §4. Demo of how Claude Code uses a pre-written test catalog to drive implementation.

### Decisions

- **TDD red → green, but without ceremony.** Tests first, fail (red), implementation, pass (green). We didn't write tests one at a time; the whole `tests/unit/storage.test.ts` went in before any `lib/storage.ts` existed. The "red" was confirming `Cannot find module '@/lib/storage'`, not failing assertions on stubs.
- **`TEST_CASES.md` §4 *is* the spec.** No separate planning doc this time. The GWT table mapped 1:1 to `describe` / `it` blocks. Twelve tests in, twelve tests later.
- **Two-tier db access.** `openDb(path)` is uncached (caller owns lifecycle — used by tests). `getDb()` is the env-driven production singleton. Same schema bootstrap, different sharing rules. Tests stay isolated without mocks.
- **Real temp SQLite per test, not mocks.** Per `CLAUDE.md` §10. `mkdtempSync(tmpdir(), …)` in `beforeEach`, `rmSync(…, recursive: true)` in `afterEach`. ~3ms overhead per test, worth it.
- **`rowid`-based cursor pagination.** Tasks order by SQLite's implicit `rowid` (monotonic on insert), cursor is `base64url(rowid)`. Chose this over `(created_at, id)` row-value comparison because (a) `Date.toISOString()` collides when 100 inserts happen in the same millisecond — exactly the TC-S-08 scenario — and (b) keeping the cursor opaque from outside is good API hygiene. `id` (UUID) stays the public handle.
- **Zod at the trust boundary, custom errors above.** `addTask` calls `NewTaskInputSchema.safeParse`; on failure it wraps Zod's issues into our own `ValidationError`. Same shape will work for Route Handlers in Chapter 9 — they re-throw `ValidationError` as 400. `getTask` / `listTasks` skip Zod on internal calls (trust the caller; the userId comes from auth middleware, not the wire).
- **Tomb-stoned soft-delete is invisible everywhere.** Once `deleted_at` is set, `getTask` returns null, `listTasks` skips the row, `markDone`/`softDelete` throw `NotFoundError`. There is *no* "with-deleted" mode in the API — admin restore is out of scope.
- **Rejected: a separate `lib/db.ts` for connection setup.** Considered splitting `openDb`/`getDb` from the CRUD functions. Decided no: 200 lines is well under the §9 file-size ceiling, the SQL schema lives next to the queries that use it, and a future split is trivial.

### What we asked Claude Code

One sentence: "Write Chapter 7 — storage layer, TDD style, the 12 test cases in TEST_CASES.md §4." That was it. Claude already had the spec, the test catalog, and the CLAUDE.md rules from session context; nothing else needed re-stating.

A few things that worked:

- **Letting Claude pick the tactics.** I didn't tell Claude how to do pagination, what to use for IDs, or how to structure the error types. Claude picked `rowid` cursors, `randomUUID`, custom error subclasses with optional `issues[]`. All defensible. If I'd specified each, the chapter would be a list of my preferences instead of an example of agentic design.
- **The "smoke check" pattern from Chapter 6 carrying forward.** Claude ran `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm test:cov` after implementation — not because I asked, but because Chapter 6's lessons set the precedent. Memory + the executed prior chapter both reinforced it.
- **Biome doing the cleanup.** Two lint passes auto-fixed format + organize-imports without manual edits. The `PostToolUse` hook on Edit/Write means most files were already correct when lint ran; the remaining issues (Biome's `organizeImports` grouping) were one `--fix --unsafe` away.

What surprised me: **Claude designed past the test cases.** TC-S-07 only asserts soft-deleted rows hide from `listTasks`, but Claude also made `getTask` return null for deleted rows owned by the same user — the right call (no zombie reads) but not strictly required by the spec. Worth noting in code review: agentic generalization is usually right, but it's the kind of thing that quietly expands behavior without a spec update.

### Output

Branch `feat/storage-layer` → PR stacked on the docs PR.

- 4 new: `lib/errors.ts` (16 lines), `lib/models.ts` (32 lines), `lib/storage.ts` (200 lines), `tests/unit/storage.test.ts` (150 lines, 13 tests).
- 1 modified: `vitest.config.ts` — added `resolve.alias` for `@/*` so vitest honors the tsconfig path alias.

Test + coverage output:

```
Test Files  2 passed (2)
     Tests  14 passed (14)

% Coverage report from v8
------------|---------|----------|---------|---------|-------------------
File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------|---------|----------|---------|---------|-------------------
All files   |   94.66 |    94.11 |   92.85 |   94.66 |
 errors.ts  |     100 |      100 |     100 |     100 |
 models.ts  |     100 |      100 |     100 |     100 |
 storage.ts |   93.04 |    93.54 |    90.9  |  93.04  | 49-54, 131-132
```

The two uncovered ranges are intentional: lines 49–54 are `getDb()`'s env-var path (tests use `openDb` directly so they don't depend on mutating `process.env`); lines 131–132 are the "invalid cursor" branch (no test asserts the error message — the API layer will, in Chapter 9).

### Lessons

- **Tests catalog → tests file is a 1:1 translation, not a creative act.** The hard part — figuring out what to test — was done weeks ago in `TEST_CASES.md`. The implementation chapter doesn't need to argue about behavior, it just translates GWT into vitest. Wrap a session on test catalogs early; the implementation chapters get cheaper.
- **Vitest doesn't honor tsconfig paths by default.** Either install `vite-tsconfig-paths` or set `resolve.alias` in `vitest.config.ts`. We did the latter — one fewer plugin. Worth committing under `CLAUDE.md` §10 for future test files.
- **The "real temp DB" rule is cheaper than it sounds.** Total test runtime: 30ms across 13 tests, each opening its own SQLite file. Mocks would have saved ~25ms and cost us the Chapter 7 lesson about cursor collisions under same-millisecond `created_at`. Not worth it.
- **`exactOptionalPropertyTypes` keeps biting.** Had to use `cursor?: string | null | undefined` instead of `cursor?: string | null` — when the field is *both* optional and nullable, all three states must be in the union. Annoying. Worth it.
- **Biome's `organizeImports` ≠ CLAUDE.md §9.** Biome groups `node:` + external into one block, separated from local. CLAUDE.md §9 specifies three groups. Biome won; updating §9 is on the followup list. Pick one source of truth before the conventions diverge further.
- **The agent generalized past the spec on soft-delete.** `getTask` hiding soft-deleted rows wasn't a TC-S-07 requirement, but it's correct. Lesson for *reviewing* agent code: read the diff for behavior the tests don't cover. Where Claude generalized, decide if you want it or not; if you do, write the test.

---

## Chapter 8 — Google + Microsoft SSO ✅

### Goal
Two OAuth providers, one session, one user identity. After this chapter, a signed-in user has a stable `id` we can scope tasks to (Chapter 9 will plug that into the API).

### Decisions

- **NextAuth v4 stable, not v5 beta.** Pinned in `CLAUDE.md` §2; a tutorial that changes its auth library every six months is hostile to readers.
- **JWT session strategy.** No database adapter, no four extra tables (`Accounts`, `Sessions`, `VerificationTokens`, `Users`). Stateless cookies hold the session; our own minimal `users` table holds the bits we actually query (display name, email, created_at). Trade-off accepted: revoking a token requires invalidating the JWT signing key globally, not per-user — fine for this scope.
- **Internal user id = `${provider}:${providerAccountId}`.** A Google sign-in becomes `google:abc123`, a Microsoft one becomes `microsoft:abc123`. This is the natural composite key for OAuth and it makes TC-AUTH-05 ("same email across providers = different users") fall out of the schema instead of needing reconciliation code.
- **`azure-ad` → `microsoft` mapping.** NextAuth v4 ships the provider plug-in under its legacy name (`azure-ad`); Microsoft rebranded it to Entra ID. We use Microsoft's current naming in env vars and internal keys, and bridge via `mapProviderName()`. Future-proofs against v5's `microsoft-entra-id` rename.
- **Env reads are best-effort at module-init.** `requireEnv()` that threw on missing OAuth creds broke `next build` (which evaluates route modules without env). Reverted to `process.env.X ?? ""`. NextAuth surfaces a clearer error on the first sign-in attempt anyway.
- **No bearer-token middleware yet.** That's PATs, Chapter 9. This chapter is OAuth-only.

### What we asked Claude Code

Like Chapter 7: a single sentence ("Chapter 8 — SSO, NextAuth v4, Google + Microsoft Entra"). The spec, test catalog, and prior chapters' shape did the rest.

What surprised me:

- **Claude built the users table without being told to.** The spec hadn't formalized a `users` schema (TEST_CASES.md §6 just names the function, `lib/auth.ts`). Claude added the table to `lib/storage.ts`, exposed `upsertUser` / `getUserById` / `buildUserId`, and wrote 7 tests around them — covering TC-AUTH-04 and TC-AUTH-05 explicitly. The right call; the test cases all but demanded it. But worth noting: Claude expanded the storage layer without a prompt to do so.
- **Build-time env trap caught itself.** The first `pnpm build` failed because `requireEnv` threw at module load. `next build` evaluates route modules to collect page data; with no OAuth creds in the build env, the route module exploded. Fix was a one-line change. The detection mechanism — actually running `pnpm build` as part of the smoke check rather than stopping at `pnpm test` — would have missed this if we'd called it done at the unit-test mark.
- **`mapProviderName` is the smallest possible unit test of an auth module.** The whole rest of `lib/auth.ts` is NextAuth config that runs inside NextAuth — hard to unit-test in isolation. But pulling out one pure function (`raw provider name → our enum`) gave us something to assert against, and made the "azure-ad / microsoft" rename explicit in the test names. Good pattern for future auth chapters.

### What you (the reader) have to do — manual OAuth setup

I can write the code; I can't create OAuth apps. Two providers, two consoles:

**Google Cloud Console** (`console.cloud.google.com/apis/credentials`)
1. Create OAuth 2.0 Client ID → **Web application**.
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (add the production URL later in Chapter 15).
3. Copy Client ID → `AUTH_GOOGLE_ID` in `.env.local`. Client secret → `AUTH_GOOGLE_SECRET`.

**Microsoft Entra ID** (`entra.microsoft.com` → App registrations → New registration)
1. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (common tenant).
2. Redirect URI: Web → `http://localhost:3000/api/auth/callback/azure-ad`.
3. Application (client) ID → `AUTH_MICROSOFT_ENTRA_ID_ID`. Then **Certificates & secrets** → new client secret → `AUTH_MICROSOFT_ENTRA_ID_SECRET`. Leave `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` empty (defaults to `common`).

**Session secret** (do this once):
```
openssl rand -base64 32   # paste into AUTH_SECRET
```

Then `pnpm dev` and visit `http://localhost:3000/api/auth/signin` — you'll see both buttons.

### Output

Branch `feat/auth-sso` → PR → main.

- New: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`, `tests/unit/users.test.ts`, `tests/unit/auth.test.ts`.
- Modified: `lib/models.ts` (`UserSchema`, `ProviderSchema`, `UpsertUserInputSchema`), `lib/storage.ts` (`users` table, `upsertUser`, `getUserById`, `buildUserId`), `TUTORIAL.md`.
- Tests: 24 passed (up from 14). 7 cover identity/persistence; 3 cover provider-name mapping.

What's *not* tested in CI yet:
- TC-AUTH-01..03, 06, 09, 10 — all require either real OAuth callbacks or a Playwright fixture with stubbed providers. Chapter 13 will revisit when we wire the test harness for that.
- TC-AUTH-08 (tampered cookie → 401) — needs a protected route handler, which is Chapter 9.

### Lessons

- **OAuth creds are a true external dependency.** Plan for them like you'd plan for any third-party setup: a "manual setup" subsection in the chapter, env-var placeholders that don't lie about being optional, and a build that doesn't crash without them. The build-without-creds requirement isn't theoretical — it's how every fresh `git clone && pnpm install && pnpm build` works.
- **`requireEnv` belongs at request time, not module init.** This is a recurring Next.js pitfall (Server Components are evaluated at build, route modules are evaluated to collect page data). The safe pattern is `env() ?? ""` at the module boundary, with the actual `required` check inside the request handler.
- **Composite OAuth identity keys are worth the upfront design.** `provider:subject` as the user id makes TC-AUTH-05 fall out of the schema. The alternative — single `id`, email as natural key — turns the "same email, two providers" case into reconciliation code that has to make a policy call (merge? error? prefer-provider?). Better to not have the policy call at all.
- **NextAuth's v4 `azure-ad` name is going to bite forkers.** It's the legacy name; Microsoft hasn't called it Azure AD since 2023. Our `mapProviderName` keeps the rest of the codebase clean, but anyone debugging OAuth flow will see "azure-ad" in redirect URIs and may wonder. Worth flagging early — done in this chapter.
- **Don't over-test what's mostly config.** `lib/auth.ts` is 80% NextAuth options. Trying to unit-test the JWT callback would mean instantiating fake `account` and `profile` objects whose shapes are defined by next-auth's types — brittle and low-value. We unit-test the *one pure function* and trust NextAuth's own test suite for the rest. The full flow gets covered by Playwright when OAuth mocking lands.

---

## Chapter 9 — The public REST API ✅

### Goal
Every public endpoint the spec lists, minus the AI ones (Chapter 11). Auth, validation, error envelope, rate limit, PATs — all of it. The shape that Chapter 10 (OpenAPI) will read from and Chapter 12 (web UI) will consume.

### Decisions

- **One auth resolver, Bearer-first.** `resolveUser(req)` checks `Authorization: Bearer <PAT>` before NextAuth's session. If a Bearer is present but invalid, we return 401 — we do *not* fall through to the session. Mixing valid cookie + stale Bearer was a surprise vector waiting to happen.
- **PATs are session-only to *manage*.** A PAT can call `/api/v1/tasks`, but it cannot call `POST /api/v1/pats` to issue more PATs. Matches the spec (§12: "session only" for /pats), prevents privilege escalation, and the test names it explicitly.
- **Token format `ctd_[A-Z2-7]{22}`.** Base32 (Crockford-friendly alphabet), 110 bits of entropy after the prefix, fixed 26-char length so the regex doubles as a validator. Plaintext shown once; DB stores SHA-256 hash only. The `prefix` is purely cosmetic — useful for users to identify their tokens in `/api/v1/pats` listings.
- **Soft-delete everywhere, never 403.** Revoking your own PAT → 204. Revoking someone else's → 404 (never 403 — TC-PAT-09 makes the point explicitly: don't leak existence). Same rule for tasks (TC-API-08).
- **In-memory rate limit, process-local.** 60 req/min/user in a `Map`. Honest scope: this works on a single instance and falls over with multiple replicas. Chapter 15's deploy is a single Azure App Service instance, so it holds — but the chapter calls it out so nobody puts this in a serious deployment.
- **PII rejection at *two* boundaries.** API handler returns 400 with `{ error: "pii_rejected", type }`. Storage also rejects (`PiiRejectedError`). Defense in depth: any future caller that bypasses the handler (background job, CLI) still can't write PII to disk.
- **Mapped error envelope.** One `mapError(error)` translates `NotFoundError` → 404, `PiiRejectedError` → 400 pii_rejected, `ValidationError` / `ZodError` → 400 validation_error with field issues, anything else → 500 with a logged `request_id`. Every handler is `try { … } catch (e) { return mapError(e); }`. Result: handlers stay flat; the envelope stays uniform.
- **PATCH accepts only `status`.** No title/notes editing in the MVP. The spec doesn't ask for it, and adding it now would expand the PII surface. Easy to extend later.
- **Test handlers via Bearer, not session.** All API-level tests authenticate with a PAT issued in `setupApiTest()`. TC-API-14 asserts the equivalence; we trust it for the rest.

### What we asked Claude Code

Same pattern: "Chapter 9. Tasks/PATs/me endpoints, PII, rate limit, errors. Per TEST_CASES §5, §7, §11." Six files of code, four test files, 36 new tests. One sentence brief.

Things worth flagging:

- **The session-only restriction on PAT management was the agent's call, not mine.** I would have written it the same way, but I hadn't specified it in the brief. Claude read PRODUCT_SPEC.md §12 (`Auth: session only`) and propagated it into the handlers. A real example of why pre-written spec docs amplify agentic work — they're context the model gets to use even when you forget to remind it.
- **The auth resolver bit twice.** First: I forgot that `getServerSession()` throws when there's no NextAuth request context — every test hit 500 instead of 401. Fix: try/catch around the session resolver. Second: a 401-via-invalid-Bearer falling through to session is bad UX. Fix: explicit early-return on bad Bearer instead of falling through. Both fixes are 3 lines; both would have shipped silently if the tests hadn't been written first.
- **NextRequest in vitest is a plain Web `Request`.** The route handlers take `NextRequest`, but `NextRequest extends Request` and we only call `req.url`, `req.headers`, `req.json()`. So tests construct a plain `Request` and cast. Cleaner than spinning up Next.js's full request runtime.
- **Biome's `--fix --unsafe` reordered imports inside test files.** The PostToolUse hook caught the format issues but skipped one organize-imports nudge. The `--unsafe` flag is fine for an OSS tutorial — every fix is checked into git, easy to revert. I'd be more careful in a production repo.

### Output

Branch `feat/public-api` → PR.

**11 new files:**
- `lib/pii.ts`, `lib/pats.ts`, `lib/api-auth.ts`, `lib/api-errors.ts`, `lib/ratelimit.ts`
- `app/api/v1/me/route.ts`
- `app/api/v1/tasks/route.ts`, `app/api/v1/tasks/[id]/route.ts`
- `app/api/v1/pats/route.ts`, `app/api/v1/pats/[id]/route.ts`
- `tests/helpers/api.ts` (shared fixture: temp DB + seeded user + issued PAT + Bearer headers)
- 5 new test files (`pii`, `pats`, `api-me`, `api-tasks`, `api-pats`, `api-auth-and-limits`)

**3 modified:**
- `lib/storage.ts` — `pats` table to schema, `updateTaskStatus`, PII check in `addTask`, `_resetDefaultDbForTesting`
- `lib/models.ts`, `lib/errors.ts` — `PiiRejectedError`

**Test totals:**
```
Test Files  10 passed (10)
     Tests  71 passed (71)
```

Coverage:
```
All files      |   93.24 |    92.18 |   95.34 |   93.24
 pats.ts       |     100 |      100 |     100 |     100
 pii.ts        |     100 |      100 |     100 |     100
 ratelimit.ts  |     100 |      100 |     100 |     100
 api-auth.ts   |     100 |    77.77 |     100 |     100
 api-errors.ts |   81.25 |    78.57 |     100 |   81.25
 auth.ts       |   55.55 |     100  |     50  |   55.55  (NextAuth callbacks; tested via integration)
```

**Build:**
```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/v1/me
├ ƒ /api/v1/pats
├ ƒ /api/v1/pats/[id]
├ ƒ /api/v1/tasks
└ ƒ /api/v1/tasks/[id]
```

### Lessons

- **One `mapError` keeps handlers boring.** Every Route Handler is the same shape: `try { auth → rate limit → work; return json } catch (e) { return mapError(e) }`. Boring is a feature: a reviewer can scan a new handler in 5 seconds and know what's *not* there.
- **A shared test fixture pays back fast.** `setupApiTest()` is 30 lines and 4 test files use it. The harness creates a temp DB, seeds a user, issues a real PAT, and returns the Bearer header. Each test calls it in `beforeEach`. Total setup boilerplate per test: 4 lines.
- **The agent will pick up restrictions you forgot to brief.** Claude propagated "Auth: session only" from the spec to the PAT endpoints without me saying so. The lesson isn't "trust the agent" — it's "if you put a constraint in the spec, the agent will find it; if you didn't write it down anywhere, the agent will guess."
- **`getServerSession` throws without a request context.** Wrap it. Every NextAuth tutorial assumes you're calling it from a real Next.js request — but unit tests aren't, server-side scripts aren't, and the failure mode is a 500 instead of a clean 401. Defensive `try`/`catch` is correct here, not paranoid.
- **An invalid Bearer should NOT fall through to a valid session.** `Authorization: Bearer …` is the user saying "I'm authenticating with this token." Honoring it even when it's wrong (by silently using the cookie) is a security smell. Fail loudly when the asserted credential is broken.
- **In-memory rate limit is fine *as long as you say so*.** The chapter spends a sentence flagging "process-local, single-instance only." Skipping that line is how Heisenbug rate-limit bugs end up in production.
- **Unit-test handlers as functions, not as servers.** Importing the exported `GET` / `POST` directly and feeding them `new Request(...)` is fast, deterministic, and skips the entire Next.js runtime. 71 tests run in <500ms. Playwright will cover the wiring layer in Chapter 13.

---

## Chapter 10 — OpenAPI docs ✅

### Goal
The API from Chapter 9 is invisible to anyone who can't read the source. This chapter makes it visible: an OpenAPI 3.1 spec generated from the same Zod schemas the handlers use, plus a browsable Scalar UI.

### Decisions

- **Generate fresh on every request, no build-time export.** `buildOpenApiDocument()` runs in the GET handler. Total time: ~1 ms. Dev-server schema edits show up immediately — no `pnpm openapi` step to forget. Production cost is negligible compared to a single DB query.
- **Zod schemas as the source of truth, but response shapes live in `lib/openapi.ts`, not `lib/models.ts`.** `MeResponse`, `TaskListResponse`, `IssuedPat` etc. are API-only — they don't belong with the storage layer's models. Splitting at this boundary keeps `models.ts` about *data* and `openapi.ts` about *contract*.
- **`registry.register("Name", schema)` over `.openapi("Name")` chaining.** Functionally equivalent — both rely on the same prototype patch — but the explicit form makes naming a first-class decision instead of buried metadata on a schema definition.
- **YAML route via the `yaml` package.** 4 KB dep, well-maintained, handles round-tripping cleanly. The "JSON is YAML so just serve JSON" trick is correct but disrespects callers who'd grep the spec by eye. TC-OAS-04 wants YAML to *look* like YAML; that's worth a dependency.
- **Scalar UI mounted at `/api/docs`, no auth.** The docs reference is public — the protected operations are still gated. Anyone can browse; only authenticated users can call. Matches the spec.
- **Server URL takes `PUBLIC_BASE_URL`, then `NEXTAUTH_URL`, then localhost.** TC-OAS-06 wants the prod server URL when deployed; we already have `NEXTAUTH_URL` set in prod for OAuth callbacks, so reusing it avoids a second env var most of the time. `PUBLIC_BASE_URL` overrides if the API host differs from the OAuth callback host.

### What we asked Claude Code

Same one-sentence pattern: "Chapter 10. OpenAPI 3.1 spec from the Zod schemas, JSON + YAML routes, Scalar UI at /api/docs."

The interesting part of this chapter wasn't the code — it was a 20-minute debugging detour into module systems.

**The detour:** `extendZodWithOpenApi(z)` patches `z.ZodType.prototype` so schemas get an `.openapi()` method. The recommended setup calls it at the top of the module that uses the registry (`lib/openapi.ts`). That's what we did. Tests failed with `TypeError: zodSchema.openapi is not a function` from inside `registry.register()`.

Root cause: vitest's runtime loaded `@asteasolutions/zod-to-openapi` as CJS and `lib/models.ts` (via Vite's TS pipeline) as ESM. Each loaded zod through a different module record. **Two different `ZodType` classes, two different prototypes.** `extendZodWithOpenApi` patched the CJS one; our schemas were instances of the ESM one. The patch was real and invisible at the same time.

Fix: move `extendZodWithOpenApi(z)` to the top of `lib/models.ts` — the module that *creates* the schemas. Whichever zod runtime makes them is the one that gets patched. One-line change, three-minute fix once diagnosed, twenty minutes to diagnose. Saved to memory so the next time someone adds a `lib/something-from-zod.ts` they don't repeat it.

What I'd want the agent to do differently: when a "TypeError: not a function" hits a method that's *supposed* to exist via prototype extension, jump to module-system inspection earlier. Standalone-Node sanity check (the `node -e` snippet I ran) is one minute of work and rules out half the hypothesis space.

### Output

11 new tests, 1 schema source rearrangement, 4 new files. PR stacked on `feat/public-api` (auto-retargets to main on merge).

**Files:**
- `lib/openapi.ts` — registry + 9 paths + 2 security schemes + generator
- `app/api/openapi.json/route.ts` — JSON spec
- `app/api/openapi.yaml/route.ts` — YAML via `yaml`
- `app/api/docs/route.ts` — Scalar UI (`@scalar/nextjs-api-reference`)
- `tests/unit/openapi.test.ts` — 9 tests for TC-OAS-01..04, 06
- `lib/models.ts` modified — `extendZodWithOpenApi(z)` at the top

**Build routes (10 total):**
```
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/docs
├ ƒ /api/openapi.json
├ ƒ /api/openapi.yaml
├ ƒ /api/v1/me
├ ƒ /api/v1/pats
├ ƒ /api/v1/pats/[id]
├ ƒ /api/v1/tasks
└ ƒ /api/v1/tasks/[id]
```

**Tests:**
```
Test Files  11 passed (11)
     Tests  80 passed (80)   ← +9 OpenAPI tests
```

### Lessons

- **Where you call a side-effect matters more than what it does.** `extendZodWithOpenApi(z)` runs the same code regardless of which module hosts it; what differs is *which zod runtime* gets patched. Same lesson as Chapter 8's `next build` env-var trap — environment, not code, is what bit us.
- **Generate the spec on every request unless you have a reason not to.** Static export feels disciplined; it's actually a stale-by-default footgun. With sub-millisecond generation, "live spec" is free.
- **Two trust boundaries for the same schemas means one source of truth.** `lib/storage.ts` validates with `NewTaskInputSchema`. `app/api/v1/tasks/route.ts` validates with `NewTaskInputSchema`. `lib/openapi.ts` registers `NewTaskInputSchema`. The OpenAPI doc cannot lie about what the API accepts — drift is impossible.
- **API response shapes belong with the API, not the data layer.** `TaskListResponse` is shaped `{ items, next_cursor }` for *pagination*; `Task` is shaped for *storage*. Putting both in `lib/models.ts` would make the file a junk drawer. The split is cheap and protective.
- **The yaml package was worth the 4 KB.** JSON-is-YAML trickery would have passed TC-OAS-04 by letter; YAML-that-actually-looks-like-YAML passes it by spirit. The spec is for humans first.
- **Standalone Node is the fastest debugging environment.** When the bundler/test-runner adds layers, drop down to `node -e "..."` to verify a hypothesis at the runtime level. Three minutes of standalone work saved fifteen minutes of vitest config archaeology.

---

## Chapter 11 — AI features with prompt engineering ✅

### Goal
Wire two Claude-powered endpoints — `/api/v1/tasks/prioritize` and `/api/v1/tasks/summary` — onto the API skeleton from Chapter 9. The interesting part isn't the SDK call; it's the discipline around it: prompt structure (v1 → v2), caching, cost ceiling, audit logging, graceful degradation, and parsing model output as if you don't trust it.

### Decisions

- **Default model: `claude-haiku-4-5-20251001`.** CLAUDE.md §5.1 commits us; the `claude-api` skill agrees Haiku is the right tier for "rank a short list" and "write three sentences." Sonnet/Opus override at the call site if a chapter ever needs more, but neither feature does.
- **Prompt caching by structure, even when the prompt is under the threshold.** Haiku 4.5's minimum cacheable prefix is **4096 tokens** — our prompts are smaller, so caching won't *actually* fire today. We use the cache-aware shape anyway (stable system block with `cache_control: ephemeral`, volatile task list in `messages[]`). The structure is correct; the win activates once the prompt grows. CLAUDE.md §5.2 was carrying the Sonnet-era "1024 tokens" number; updated to a per-model table in this chapter.
- **Cost ceiling enforced as a precheck, not a hard limit.** Before any SDK call: estimate the worst case (`max_tokens * output_rate`) and reject if `current + estimate > $0.10`. Concurrent calls can each pass the precheck and combine over the ceiling — fine for a tutorial cap, the ledger UPSERT is atomic, and TC-AI-10 verifies that.
- **Cost stored as integer micros, never floats.** `1 micro = $1e-6`; $0.10 = `100,000` micros. Float-cents accumulation drifts; integer micros doesn't. The cost-display layer divides by 1M at the boundary.
- **Per-user, per-day ledger keyed `(user_id, day)` in UTC.** Local-time day boundaries would couple billing to timezones — fine for one user, surprise for everyone else.
- **Two test hooks, no `vi.mock`.** `_setAnthropicClientForTesting()` swaps in a stub client; `_setAuditLoggerForTesting()` captures audit lines into memory instead of writing to `logs/`. Both reset in `afterEach`. Cleaner than module-level mocks because every test sees a known starting state and the production code path is unchanged.
- **Bearer-first auth is fine for AI endpoints.** Unlike `/pats`, there's no privilege-escalation argument for session-only. A PAT can prioritize its owner's tasks.
- **JSON output via prompt instruction, not `output_config.format`.** Haiku 4.5 supports schema-enforced outputs, and a `v3` of prioritize should use it. We deliberately kept prompt-based JSON for v2 because the v1 → v2 narrative is *about* prompt engineering. The chapter calls it out as a known followup.
- **Parse hardening at three layers.** The model is asked to return only JSON; the parser tolerates a stray code-fence anyway (TC-PR-04 reality); a second pass validates IDs against the input set and rank uniqueness (TC-PR-05, TC-PR-06). Defense in depth.
- **Empty-state shortcuts before the SDK call.** Zero open tasks → `prioritize` returns `[]` without a call. Zero done-today tasks → `summary` returns the literal "No tasks completed yet today." Saves money and dodges the failure mode where the model hallucinates activity for an empty input.

### What we asked Claude Code

For this chapter I invoked the `claude-api` skill before writing code. The skill is opinionated about caching layout (stable first, volatile last), pricing math (cache writes 1.25×, reads 0.1×), and using typed SDK exceptions. It also shipped a 4 KB-vs-1 KB minimum-cacheable-prefix table that turned out to be the chapter's main correction — our CLAUDE.md §5.2 was wrong for Haiku.

Two patterns from the skill I leaned on:

- **"Stable content first, breakpoint, then volatile."** The system prompt holds persona + schema + examples + guardrails (cacheable). The user message holds the task list (volatile). This isn't just a perf detail — it's also how you keep the prompt audit-able: change a guardrail and only the system block moves; change a task and only the user message moves.
- **"Verify cache hit rate > 0 on the second call."** Adapted to Haiku: verify *once the prompt clears the threshold*. We can't verify above 0 today because we're below the floor; the test verifies the SDK is *called with* `cache_control`, which is what we control. CLAUDE.md was updated to make the conditional explicit.

What surprised me about the AI-feature work:

- **The prompt-engineering arc is more teachable than the code arc.** `lib/ai/prioritize.ts` is 130 lines, half of which is paranoid parsing. `prompts/prioritize_v1.md` → `_v2.md` is two files plus a README, and that's where the chapter's value sits. The code mostly enforces what the prompt promised.
- **`AiUnavailableError` covers two distinct failure modes.** Missing env var (developer error, 503 with `reason: "missing_api_key"`) and Anthropic API down (operational error, 503 with `reason: "api_error"`). Same status, different `reason` field. Took a beat to land on this — initially had them as separate error classes; collapsed because the response shape is the same.
- **Empty-state short-circuits are quietly important.** Letting Claude see "you completed 0 tasks today" invites hallucination ("You had a thoughtful day of reflection..."). Better to never make the call.

### Output

Branch `feat/ai-features` → PR.

**New files (13):**
- `lib/ai/client.ts` — SDK wrapper with caching, cost ceiling, audit logger
- `lib/ai/prioritize.ts`, `lib/ai/summary.ts` — feature implementations
- `app/api/v1/tasks/prioritize/route.ts`, `summary/route.ts` — route handlers
- `prompts/prioritize_v1.md`, `prioritize_v2.md`, `summary_v1.md`, `summary_v2.md`, `README.md` — the v1→v2 narrative
- Four test files: `ai-client`, `ai-prioritize`, `ai-summary`, `api-ai` (27 new tests)

**Modified (4):**
- `lib/storage.ts` — `ai_daily_costs` table, `getDailyCostMicros` / `recordAiCost` / `todayUtc`
- `lib/errors.ts` — `AiUnavailableError`, `CostCeilingExceededError`, `AiResponseParseError`, `AiResponseInvalidError`
- `lib/api-errors.ts` — map the new errors to 503 / 429 / 502
- `CLAUDE.md` §5.2 — per-model cache threshold table

**Build routes:** 10 → 12 (`prioritize`, `summary` added).

**Test totals:**
```
Test Files  14 passed (14)
     Tests  98 passed (98)   ← +27 over Chapter 10
```

### Lessons

- **Default behavior under threshold is silent failure.** Below Haiku 4.5's 4096-token minimum cacheable prefix, `cache_control: ephemeral` markers do *nothing* and emit no warning. The CLAUDE.md update is the load-bearing fix: future contributors will see the threshold table and not waste time debugging a "broken cache" that was never going to cache at this size.
- **Estimate-then-deny ceiling is the cheap, correct shape.** Don't deny based on past cost alone (lets one expensive call push you over). Don't try to predict input tokens (small constant). Estimate `max_tokens × output_rate` and deny if `current + estimate > cap`. Simple, conservative, and the tests pin the contract.
- **Two test hooks beats `vi.mock` for a wrapper module.** `_setAnthropicClientForTesting` and `_setAuditLoggerForTesting` are 6 lines combined. `vi.mock('@anthropic-ai/sdk')` is one line but pollutes the module graph and surprises future contributors who add a real call. The hooks are visible, isolated, and reset cleanly.
- **The v1 prompt isn't a strawman.** A real attempt at "rank these tasks, return JSON" with no schema, no examples, no guardrails produces the failure modes documented in `prioritize_v1.md`. The v2 wins are concrete: schema, few-shot, XML sections, guardrails. Worth showing both, side-by-side, in the repo — that's the artifact a forker actually learns from.
- **Hallucination-resistant parsing has three layers, none redundant.** Layer 1: prompt asks for ONLY JSON. Layer 2: parser tolerates a stray code-fence (because layer 1 occasionally fails). Layer 3: domain invariants (IDs from input, ranks unique 1..N). Drop any layer and a specific class of model misbehavior reaches production.
- **Audit log structure matters more than the technology choice.** JSONL appended to `logs/ai_calls.jsonl` is unfashionable but: grepp-able, tail-able, no DB schema migration, no observability vendor. The constraint that makes it valuable is "metadata only, never prompt or response bodies" — that's enforced in the wrapper at one point, and the TC-AI-03 test asserts the body string doesn't appear in any audit line.
- **Skill invocation paid off.** The `claude-api` skill caught the cache-threshold mismatch and supplied pricing constants verbatim. The 20 minutes of skill loading was cheaper than rediscovering the table during integration. Worth setting up *before* implementation, not after debugging.

---

## Chapter 12 — Responsive web UI ✅

### Goal
A signed-in user can land at `/`, click through SSO, see their tasks, add / done / delete, manage PATs, and ask Claude to prioritize or summarize. Mobile-first throughout. The API surface from Chapters 7–11 finally has a face.

### Decisions

- **Two distinct entry points: `/` and `/app`.** Landing page (`app/page.tsx`) is public; everything authenticated lives under `app/app/`. Route group with parens (`app/(app)/`) was my first stab — it doesn't add a path segment, which collided the authenticated page with the landing at `/`. Switched to plain `app/app/` so URLs are honest (`/app`, `/app/settings`).
- **Server Actions for mutations, Server Components for reads.** `addTaskAction`, `markStatusAction`, `softDeleteAction`, `prioritizeAction`, `summaryAction`, `issuePatAction`, `revokePatAction` all live in `app/app/actions.ts`. Forms point at them directly; no separate API routes. The `/api/v1/*` routes from Chapter 9 stay focused on external API consumers (Bearer tokens) and stay untouched.
- **Action results, not exceptions.** Server Actions return a tagged `ActionResult<T>` = `{ ok: true, data } | { ok: false, error, details? }`. The UI uses `useActionState` to render inline errors (PII, validation). Thrown errors would have bubbled up as 500s; tagged results let the form show a calm red message and keep the page interactive.
- **Mobile-first via Tailwind utilities, no component library.** Plain utility classes throughout. Three concrete uses before extracting (CLAUDE.md §9). The patterns I keep reusing — `min-h-11`, `focus-visible:ring-2 focus-visible:ring-neutral-900`, `rounded-md border border-neutral-200 bg-white p-3` — could become a `<Button>` / `<Card>` later, not now.
- **44px touch targets via `min-h-11`** (`min-height: 44px`). Applied to every interactive element. CLAUDE.md §7 requires this; making it a class-level habit means nobody has to remember.
- **Forged session cookies for E2E, not OAuth mocking.** Playwright tests sign a NextAuth-compatible JWT with the test `AUTH_SECRET` and drop it into `next-auth.session-token`. The dev server (started by Playwright with the matching secret) accepts it as if real OAuth happened. Cleaner than intercepting OAuth callbacks; matches the spec hint ("Mock SSO providers in tests").
- **Shared test env via `playwright.config.ts`.** `DATABASE_PATH`, `AUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY` are set on both `webServer.env` (so the dev server sees them) and `process.env` (so the test helpers see them). One source of truth, no copy/paste.
- **Confirm dialog for PAT revocation.** `window.confirm()` is unfashionable but it works on every browser, requires zero deps, and matches the destructiveness ("anyone using this token loses access immediately"). A modal component is a Chapter 13 nicety.
- **Sign-in flow points at `/api/auth/signin`.** NextAuth's built-in provider chooser. Not the most beautiful page, but it works and the chapter is about *our* UI, not auth UI. Building a custom signin page would have been scope creep.
- **Rejected: a hamburger menu on mobile.** Two nav items ("Tasks", "Settings") plus brand and sign-out fit comfortably at 375px. A hamburger would have added JS for state, accessibility wiring, and tests for a problem we don't have.

### What we asked Claude Code

One-sentence brief: "Chapter 12, responsive web UI, mobile-first." The chapter naturally split into four passes:

1. **Public landing page.** Tested first because it has no auth dependency — `pnpm dev` + `curl localhost:3000` would render it. Fast feedback loop.
2. **Authenticated layout + task list page.** First time I had to think about Server Action ergonomics. Landed on `ActionResult` after a small detour through "throw and let mapError handle it" — fine for API routes, ugly for forms because thrown errors break the UX.
3. **Settings page.** Almost a copy-paste of the task page's shape, which validated the patterns. Three concrete uses gets us to a `<Card>` component later if it's still useful.
4. **Playwright E2E.** The session-cookie helper was the big unlock — once it worked, three meaningful authenticated tests followed in 20 minutes.

5. **Design improvement pass.** After the initial build we put the app in front of a browser and found the default neutral palette felt generic. The structural work was solid; the visual finish wasn't. See the next section for the story.

Things worth noting:

- **`app/(app)/` was the wrong call.** Next.js route groups with parens don't add a path segment. I wanted authenticated pages at `/app` but `(app)/page.tsx` mapped to `/`, silently shadowing the landing. The build succeeded — Next picked one without warning. The first `pnpm build` after the move was when I caught it: route output showed `/` and `/settings` instead of `/app` and `/app/settings`. **Always read the build output for the path list, not just the success line.**
- **`role="alert"` double-match.** First Playwright run failed because `getByRole("alert")` matched both my error message AND Next.js's hidden `#__next-route-announcer__` div. Scoped the locator to `getByTestId("add-task-form")` to disambiguate. Lesson for the chapter: **`data-testid` on stable containers is worth the visual noise** — it gives tests a precise scope without coupling to copy or markup.
- **`void` vs `undefined` in TypeScript.** `() => { addTask(...) }` infers as `() => void`; my `toResult<T>` helper wanted `T = undefined`. The fix is `() => { addTask(...); return undefined }`. Wordy, but the type now says what it means. Worth knowing: `void` is a return-type-only annotation, not assignable to `undefined`.
- **Playwright's webServer inherits a fresh shell.** The `env` block on `webServer` doesn't propagate to *test workers* — those use `process.env` from the Playwright config process. I had to set the env in *both* places. The pattern in `playwright.config.ts` (the `for` loop that copies `TEST_ENV` into `process.env`) keeps the two in sync.

### Output

Branch `feat/web-ui` → PR.

**New files (10):**
- `app/page.tsx` — full rewrite of the landing
- `app/app/layout.tsx` — authenticated shell with top nav + sign-out
- `app/app/page.tsx` — task list (Server Component)
- `app/app/settings/page.tsx` — PAT management (Server Component)
- `app/app/actions.ts` — Server Actions for all mutations
- `app/app/add-task-form.tsx`, `task-row.tsx`, `ai-panel.tsx`, `signout-button.tsx` — client components on the task page
- `app/app/settings/new-pat-form.tsx`, `pat-row.tsx` — client components on the settings page

**Modified (3):**
- `app/layout.tsx` — site metadata + body background
- `playwright.config.ts` — shared test env (DATABASE_PATH, AUTH_SECRET, NEXTAUTH_URL)
- `tests/helpers/playwright-auth.ts` (new) — forge NextAuth session cookies for E2E

**Tests:**
```
Unit: 107 passed (15 files)
E2E:   11 passed (4 files)
       — 6 landing across 375/768/1280 viewports (renders + no horizontal scroll)
       — 3 task flows (add, done, PII rejection)
       — 1 PAT issue (TC-E2E-07)
       — 1 pre-existing smoke
```

**Build routes (15 total):**
```
/, /api/auth/[...nextauth], /api/docs, /api/openapi.{json,yaml},
/api/v1/me, /pats, /pats/[id], /tasks, /tasks/[id], /tasks/prioritize, /tasks/summary,
/app, /app/settings
```

### Lessons

- **Server Actions want tagged results, not exceptions.** Thrown errors in Server Actions surface as 500s that wipe the page; a tagged `ActionResult<T>` keeps the form interactive and lets you render inline messages with `useActionState`. Same data flow as API handlers + `mapError`, different presentation contract.
- **Read the `pnpm build` route table on every PR.** Next.js doesn't warn when two files map to the same path under a route group — it just picks one. The two-line table at the end of `next build` is the cheapest sanity check; make a habit of glancing at it before merging UI changes.
- **`data-testid` on form/section containers earns its keep.** It's noise in the markup but it gives Playwright a stable, scoped locator that survives copy changes, role additions, and Next.js's hidden a11y helpers (route announcer, etc.).
- **Forge cookies, don't mock OAuth.** Setting a NextAuth-signed JWT directly is ~30 lines, works across all browsers Playwright supports, and survives provider changes. Mocking the OAuth handshake is fragile and ties tests to NextAuth's redirect dance.
- **The webServer's env is not the test worker's env.** Playwright's config-time `process.env` copy is a small habit that prevents a class of "works in dev, fails in CI" surprises. The pattern lives in `playwright.config.ts`; replicate it in any new test that needs shared state.
- **Mobile-first is a *default*, not a checklist item.** Writing the layout at 375px first and adding `sm:` / `md:` modifiers as the viewport grows produces UIs that work without horizontal scroll without me having to think about it. Trying it the other way around (desktop-first with `max-w` fallbacks) is harder, not easier.
- **`min-h-11` everywhere on interactive elements.** Hardcoding 44px touch targets at the utility level — instead of relying on a `<Button>` component that might not exist yet — means nobody has to remember the rule.

### Design improvement pass

After the initial build was functional we did a review pass and the feedback was direct: _"the responsive GUI you built is not very professional."_ That's a useful signal, and the honest response to it surfaced an important process gap.

**The root cause: Claude designs in the dark.**

Claude Code wrote markup it could never see. It had the Tailwind docs and the class names but no pixels. The initial UI was structurally correct — right touch targets, right HTML semantics, right responsive breakpoints — but the default neutral-grey palette with no accent color reads as a prototype, not a product.

**The fix: a screenshot-first review loop.**

Instead of asking for generic "improvements", we agreed on a concrete process:

1. Push the branch, open the dev server.
2. Share a browser screenshot before asking for changes.
3. Describe changes in reference terms ("the button should read like Stripe's primary CTA") not adjective terms ("make it more professional").

Then we applied five targeted improvements in one pass:

| Change | File | Effect |
|--------|------|--------|
| Indigo accent everywhere | `task-row.tsx`, `ai-panel.tsx`, `add-task-form.tsx`, `settings/*` | Consistent brand color; buttons feel purposeful |
| Task row status tints | `task-row.tsx` | Open: `border-l-2 border-l-indigo-400 bg-white`; done: `bg-neutral-50 border-neutral-100`. Status readable without text |
| Landing hero redesign | `page.tsx` | `sm:text-6xl font-bold`, "Open-source tutorial" pill badge, two-column CTA row |
| AI panel as gradient card | `ai-panel.tsx` | `bg-gradient-to-br from-indigo-50 to-white`, `✦ Claude AI` header in indigo |
| Count badges + empty state | `app/page.tsx` | Indigo pill counts, dashed-border "All clear" card with ✓ |

None of these required new components or layout changes — they were pure class edits. Five targeted class changes transformed "prototype" into "shipped product".

**Lesson: visual quality is a process problem, not a prompting problem.** The right ask isn't "make it look better" — it's "here's a screenshot, here's a reference, change _this class_ to _this value_." Claude Code responds well to precise, verifiable instructions. Vague adjectives ("professional", "clean") produce vague results.

### What's not in this PR

- **TC-E2E-06 (AI prioritize from UI):** the AI panel is built and accessible at runtime, but stubbing the Anthropic SDK from inside Playwright requires plumbing the test hooks (`_setAnthropicClientForTesting`) into the dev server process. That's Chapter 13's job once we wire the test harness more broadly.
- **TC-E2E-10..12 (focus order, axe-core, Lighthouse):** out-of-band tooling. Deferred to Chapter 14 (CI) where they're cheap to run as scheduled jobs.
- **`/api/auth/signin` styling.** Uses NextAuth's default provider chooser. Custom signin page would be a Chapter 12.5 detour.

---

## Chapter 13 — Claude Code superpowers: skills, subagents, MCP, hooks ✅

### Goal

Show the five Claude Code features that live above "just chat": custom slash commands (skills), delegated subagents, MCP servers, automated hooks, and persistent memory. None of these require backend changes — they're all config files and markdown. But they compound: a good skill definition, wired to the right hook, reading memory about past mistakes, is how Claude Code goes from "smart assistant" to "team member who knows the project".

### Decisions

- **Skills as slash commands, not prompts.** A skill is a `.claude/skills/<name>/SKILL.md` file. When the user types `/<name>`, Claude reads it and follows the instructions. The skill we built — `task-clarity-review` — takes a vague task title and returns a scored clarity check plus 2–3 actionable rewrites. The key design decision: skills work best when they have a _narrow input contract_ ("give me a title") and a _fixed output format_ (the template). Open-ended instructions produce open-ended responses.
- **Subagents for delegation, not decomposition.** A subagent is a `.claude/agents/<name>.md` file. Claude Code can spawn it via the `Agent` tool, giving it a focused persona and a single job. The `api-doc-writer` agent has one job: read a route handler, read the Zod schemas, and return a `registry.registerPath(...)` call. It can't write files; it returns output to the caller who reviews and pastes. This is the right model for tasks where you want a second opinion or a specialist, not autonomous action.
- **Filesystem MCP for project-wide reads without permission prompts.** The `.mcp.json` at the project root registers `@modelcontextprotocol/server-filesystem` scoped to this directory. With it, Claude can read any project file in a subagent or skill invocation without requiring the user to approve each `Read` call. Scoped to the project root — not `~` or `/` — so the blast radius is limited.
- **`PostToolUse` hook already existed.** The biome auto-format hook was already in `.claude/settings.json` from Chapter 9. It fires on every `Edit` or `Write` call, formats the file in-place, and silences output. Nothing to add here except to call it out explicitly in the tutorial as the right place for mechanical, always-on enforcement. Hooks are better than asking Claude to remember to format.
- **Auto-memory is passive.** The memory system at `~/.claude/projects/.../memory/` accumulates `user`, `feedback`, `project`, and `reference` records across sessions. We don't write new memory as part of this chapter's code — we document _what has already been remembered_ (pnpm path, build-time env trap, zod-to-openapi extension location) and explain the pattern so readers can apply it to their own forks.

### What we built

| Feature | File | Description |
|---------|------|-------------|
| Custom skill | `.claude/skills/task-clarity-review/SKILL.md` | Reviews a task title on Specific / Actionable / Bounded axes; suggests 2–3 rewrites |
| Custom subagent | `.claude/agents/api-doc-writer.md` | Reads a route handler + Zod schemas; returns a `registerPath()` call for `lib/openapi.ts` |
| MCP server | `.mcp.json` | Filesystem server scoped to project root — project-wide reads without per-call prompts |
| `PostToolUse` hook | `.claude/settings.json` (already present) | `biome format --write` fires on every Edit/Write for `.ts`/`.tsx`/`.json` |
| Auto-memory | `~/.claude/projects/.../memory/` | Passive — accumulates across sessions; this chapter documents what's in it |

### What we asked Claude Code

Skills and subagents were each a one-shot write: "write a `task-clarity-review` skill that…" with the format spelled out in the prompt. The agents file was the same. The MCP config was two lines.

The more interesting conversation was about _when_ to reach for each tool:

- **Skill** — when you want a repeatable, structured operation that the user invokes manually. Good for reviews, checklists, generators with a fixed output contract. Bad for long multi-step tasks (use an agent) or always-on automation (use a hook).
- **Subagent** — when a task is big enough to warrant its own context, or when you want an independent read without the main conversation's biases. The `api-doc-writer` agent is stateless on purpose: it reads, it writes, it returns. No memory of prior routes.
- **MCP** — when a skill or subagent needs to read files _without the user approving each one_. The filesystem server is the minimal viable MCP: no external deps, no tokens, just a scoped view of the project.
- **Hook** — for mechanical enforcement that would be annoying as a reminder ("remember to format") but unobtrusive as automation. Formatting, lint, import ordering — all better as hooks.
- **Memory** — for facts that are expensive to rediscover: the pnpm path, the build-time env trap, the zod extension location. Not for architecture or code patterns (the code is the doc); not for task state (use todos); only for the _non-obvious_ facts that burned you once.

### Using the skill in practice

```
/task-clarity-review look into the slow query
```

Output:
```
Original: look into the slow query

Clarity check:
  Specific:   ⚠  Which query? Which endpoint?
  Actionable: ⚠  "Look into" has no clear output
  Bounded:    ⚠  Done when? When understood? When fixed?

Alternatives:
  1. Profile /api/v1/tasks list query and add a covering index if needed
  2. Investigate slow tasks list query and file a fix ticket
  3. Fix the slow tasks list query

Recommended: #1 — names the endpoint, tool (profiling), and outcome (index or not).
```

The skill doesn't add a task to the database. It's a review tool, not a mutation. The user reads the output, picks a rewrite, and types the better title into the add-task form themselves. Keeping the skill read-only means it can be run speculatively without side effects.

### Output

Branch `feat/claude-code-superpowers` → PR.

**New files (3):**
- `.claude/skills/task-clarity-review/SKILL.md`
- `.claude/agents/api-doc-writer.md`
- `.mcp.json`

**Unchanged (already wired in earlier chapters):**
- `.claude/settings.json` — `PostToolUse` biome hook
- `~/.claude/projects/.../memory/` — auto-memory

### Lessons

- **Skills need a narrow input contract.** "Review this task title" is a skill. "Help me be more productive" is a conversation. The format template in the SKILL.md is load-bearing — it's what makes the skill's output copy-pasteable.
- **Subagents are specialists, not collaborators.** An agent that can write files can cause hard-to-undo changes; an agent that only returns output is safe to spawn speculatively. Restrict write access by design; the caller reviews before acting.
- **MCP scope is a security boundary.** Scoping the filesystem MCP to the project root rather than `~` or `/` is not paranoia — it's the principle of least privilege. A malicious file in the project (e.g. a `package.json` with a crafted `name` field) can't read your SSH keys if the server doesn't have access to `~/.ssh`.
- **Hooks beat reminders.** If you've asked Claude more than once to do something mechanical (format, lint, run a check), it belongs in a hook. Hooks are unconditional; reminders are forgotten.
- **Memory is for facts, not recipes.** Saving "run pnpm format after edits" to memory is useless — Claude will follow it until it doesn't. Saving "pnpm binary is at `~/.npm-global/bin`" is useful — it's a concrete fact that doesn't change and that Claude can't infer from the code.

---

## Chapter 14 — CI/CD with GitHub Actions ✅

### Goal

Every push to `main` and every PR should be gated by automated checks before a human even looks at it. The goal is a pipeline where lint, type errors, unit test failures, security findings, and deploy failures are all loud and blocking — not silent and discovered in production.

### Decisions

- **Four workflows, one concern each.** `ci.yml` (lint + typecheck + unit tests), `e2e.yml` (Playwright), `codeql.yml` (security scan), `deploy.yml` (Azure). Splitting them means: a lint failure doesn't cancel the security scan; a slow E2E run doesn't block the fast unit tests; a deploy failure is isolated to the deploy job. Each can also be triggered, retried, or skipped independently.
- **OIDC federation, zero long-lived secrets.** `deploy.yml` uses `azure/login@v2` with `client-id`, `tenant-id`, `subscription-id`. GitHub mints a short-lived OIDC token for each run; Azure's federated credential validates it. No `AZURE_CREDENTIALS` JSON blob, no service principal password, nothing that can leak and be replayed. The three IDs are not secret (they identify the federation relationship, not a credential).
- **`cancel-in-progress: true` on CI and E2E, `false` on deploy.** Cancelling a stale lint run when a new commit arrives is fine — saves minutes. Cancelling an in-progress deploy would leave the app in a half-deployed state. The deploy group uses a queue (`cancel-in-progress: false`) so runs serialise rather than interrupt.
- **Build-time env trap in deploy.** `next build` evaluates route module imports at build time. Any module that calls `requireEnv()` (throw on missing key) at module init level will crash the build in CI where `AUTH_SECRET` isn't available yet. The fix (already in place from Chapter 8): `process.env.X ?? ""` at init, validate at request time. The deploy workflow passes a `build-placeholder` for `AUTH_SECRET` to satisfy Next.js without exposing the real secret to the build step.
- **Playwright needs a built app, not the dev server.** The E2E workflow runs `pnpm build` then `pnpm test:e2e`. `playwright.config.ts` starts `next start` (the production server) as the `webServer`. This catches build-only regressions that the dev server's Turbopack wouldn't show.
- **Playwright failure artifact.** The E2E job uploads the Playwright report on failure. Without this, a flaky CI failure is almost impossible to diagnose — you get a test name and an error message, but no screenshot, no trace, no DOM snapshot. The artifact is retained 7 days; enough to investigate before it's irrelevant.
- **CodeQL `security-extended`.** The default `security-and-quality` catches the OWASP top 10; `security-extended` adds higher-noise checks worth having on a public tutorial repo (where the code is also teaching patterns). High-severity findings block merge via branch protection.
- **Dependabot `groups` for GitHub Actions.** Grouping minor/patch action updates into one PR per week keeps the PR list clean. Major action version bumps (e.g. `actions/checkout@v4 → v5`) are held for manual review — they often have breaking API changes.
- **Node 20 LTS in CI, Node 24 in dev.** The app targets Node 20 LTS (the stable target for Azure App Service); developers run Node 24. Using 20 in CI catches any accidental use of Node 22/24-only APIs before they reach production.

### What we asked Claude Code

"Write four GitHub Actions workflows: ci.yml (lint + typecheck + unit tests on PR and push to main), e2e.yml (Playwright, upload report on failure), codeql.yml (JavaScript/TypeScript, nightly + PR), deploy.yml (OIDC → Azure App Service, no long-lived secrets). Node 20 LTS, pnpm 11, no cancel-in-progress on deploy."

One pass, no iteration needed. The workflows are declarative YAML with well-established patterns — Claude knows them well. The only judgment calls were: OIDC vs service principal (always OIDC for new setups), `cancel-in-progress` on deploy (always false), and the build-placeholder pattern for `AUTH_SECRET`.

### Output

Branch `feat/ci-cd` → PR.

**New files (4):**
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/deploy.yml`

**Modified (1):**
- `.github/dependabot.yml` — added `groups: minor-and-patch` for GitHub Actions ecosystem

### What to set up in GitHub (manual steps after merging this PR)

These cannot be automated from a workflow file — they require repo admin access:

1. **Branch protection on `main`:**
   - Require PR before merging
   - Required status checks: `Lint · Typecheck · Test`, `Playwright E2E`, `Analyze (javascript-typescript)`
   - Require branches to be up to date before merging
   - Do not allow bypassing the above settings

2. **GitHub Environment `production`:**
   - Go to Settings → Environments → New environment: `production`
   - Add secrets: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `ANTHROPIC_API_KEY`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
   - Add variables: `NEXTAUTH_URL`, `AZURE_WEBAPP_NAME`, `DATABASE_PATH`

3. **Azure federated credential** (see Chapter 15 for the `az` commands):
   - Create an app registration in Azure AD
   - Add a federated credential: issuer `https://token.actions.githubusercontent.com`, subject `repo:leongchiang/claude-todo:environment:production`
   - Grant the app `Contributor` on the App Service resource group

### Lessons

- **Workflows are code; treat them like code.** A workflow file that has never run is a hypothesis, not a guarantee. The first green CI run on a real PR is the only proof it works. Until then it's aspirational YAML.
- **OIDC is the right default for Azure deploys.** Service principal credentials expire, get rotated wrong, and show up in incident reports. OIDC tokens are minted per-run, scoped to the federated subject, and can't be replayed. The setup is 10 minutes of `az` commands; the ongoing maintenance is zero.
- **Split fast and slow jobs.** Lint + typecheck + unit tests complete in ~90 seconds. E2E takes 3–4 minutes. Keeping them separate means PR authors get quick feedback on the common failures (type errors, lint) before the slow check finishes.
- **Build before E2E, not `next dev`.** Running E2E against the dev server feels faster to set up but hides build-time errors. Running against `next build` + `next start` means CI and production run the same binary. The few extra minutes are worth it.
- **Never cancel a deploy in progress.** A half-deployed Next.js app can serve a mix of old and new chunks to different users — a race condition that's nearly impossible to reproduce. Serialise deploys; let them finish.

---

## Chapter 15 — Deploying to Azure ⏳

*Will cover: creating the App Service Plan, Web App, Application Insights via `az` CLI; setting up OIDC federation between GitHub and Azure (no long-lived secrets); the deploy workflow that fires on push to `main`; verifying logs in App Insights; setting the custom domain (optional); and the moment of "it works on the public internet".*

---

## Chapter 16 — Lessons & how to fork this ⏳

*Will cover: what surprised us, what we'd do differently, total Claude API spend for the build, total time, and a short "how to fork this template" guide for anyone wanting to use ClaudeTodo as a starting point for their own AI-augmented app.*

---

## Appendix A — Files in this repo at a glance

- `PRODUCT_SPEC.md` — what we're building and why
- `CLAUDE.md` — rules for Claude Code in this repo
- `TEST_CASES.md` — agreed observable behavior
- `TUTORIAL.md` — this file
- `LICENSE` — MIT
- `README.md` — landing page on GitHub (badges, quickstart, link to tutorial)

## Appendix B — Glossary

- **App Router** — Next.js 13+ routing model; files under `app/`
- **Auth.js / NextAuth** — auth library for Next.js
- **Bearer token** — `Authorization: Bearer <token>` header
- **CodeQL** — GitHub's free static analysis for public repos
- **MCP** — Model Context Protocol; how Claude Code talks to external systems
- **OIDC federation** — GitHub-issued tokens trusted by Azure, no static secret
- **PAT** — Personal Access Token (a user-issued bearer credential)
- **Prompt caching** — Anthropic feature that reuses system prompt across calls for ~90% cost savings
- **Server Action** — Next.js function that runs server-side on form submit
- **Server Component** — React component that renders on the server (default in App Router)
- **Subagent** — A Claude Code agent definition you can delegate work to (`.claude/agents/*.md`)
- **Skill** — A reusable Claude capability with its own instructions (`.claude/skills/*/SKILL.md`)

---

*Last updated: 2026-05-20 — through Chapter 14 (CI/CD: ci.yml, e2e.yml, codeql.yml, deploy.yml with OIDC).*
