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
- [Chapter 9 — The public REST API](#chapter-9--the-public-rest-api) ⏳
- [Chapter 10 — OpenAPI docs](#chapter-10--openapi-docs) ⏳
- [Chapter 11 — AI features with prompt engineering](#chapter-11--ai-features-with-prompt-engineering) ⏳
- [Chapter 12 — Responsive web UI](#chapter-12--responsive-web-ui) ⏳
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

## Chapter 9 — The public REST API ⏳

*Will cover: Route Handlers, unifying session + Bearer auth, Zod input validation, the consistent error shape, rate limiting, PATs (issue/verify/revoke), and how to test API contracts.*

---

## Chapter 10 — OpenAPI docs ⏳

*Will cover: registering Zod schemas with `zod-to-openapi`, generating the OpenAPI 3.1 spec at build time, serving it at `/api/openapi.json` and `/api/openapi.yaml`, mounting Scalar UI at `/api/docs`, validating the spec with Spectral in CI.*

---

## Chapter 11 — AI features with prompt engineering ⏳

*Will cover: writing the v1 (naive) prompt, identifying its problems, iterating to v2 (XML-structured, role, examples, output schema), implementing prompt caching, testing with mocked SDK responses, and the per-user cost ceiling enforcement.*

---

## Chapter 12 — Responsive web UI ⏳

*Will cover: Tailwind mobile-first patterns, breakpoints, touch target sizes, focus states, testing at 375 / 768 / 1280 widths, and running Lighthouse for accessibility.*

---

## Chapter 13 — Claude Code superpowers: skills, subagents, MCP, hooks ⏳

*Will cover:*
- *Installing one community skill from `anthropics/skills` and using it*
- *Writing a custom skill (`task-clarity-review`) and invoking it*
- *Writing a custom subagent (`api-doc-writer`) and delegating to it*
- *Connecting an MCP server (filesystem) and using it during the build*
- *Adding a `PostToolUse` hook to auto-format with Biome*
- *Using auto-memory to remember project quirks across sessions*

---

## Chapter 14 — CI/CD with GitHub Actions ⏳

*Will cover: `ci.yml` (lint + typecheck + test), `e2e.yml` (Playwright), `codeql.yml` (security scan), `dependabot.yml`, branch protection on `main`, signed commits, the deploy workflow.*

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

*Last updated: 2026-05-16 — through Chapter 8 (SSO wired, 24 tests; OAuth flow requires manual provider setup).*
