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
- [Chapter 6 — Scaffolding the project](#chapter-6--scaffolding-the-project) ⏳
- [Chapter 7 — Storage layer with TDD](#chapter-7--storage-layer-with-tdd) ⏳
- [Chapter 8 — Google + Microsoft SSO](#chapter-8--google--microsoft-sso) ⏳
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

## Chapter 6 — Scaffolding the project ⏳

> **Status: scaffold executed 2026-05-16.** This chapter is still the pre-execution plan; a retrospective rewrite (Decisions / What we asked / Output / Lessons) is the next commit. Three plan-time assumptions were already invalidated during execution — see the new "Where the plan was wrong" subsection at the end.

### Goal
Turn five markdown files into a working Next.js codebase. No features yet — just the bones: directories, configs, dev server boots, lint and tests run green on an empty repo. Everything subsequent chapters need must be in place.

### Plan

**One bootstrap, then layer in.** We start from `pnpm create next-app`, then add the tools `CLAUDE.md` §2 commits us to.

1. **Bootstrap Next.js**
   - `pnpm create next-app@latest claude-todo-app --typescript --tailwind --app --no-src-dir --no-eslint --use-pnpm --import-alias "@/*"`
   - Move generated files up into the repo root (we already have `CLAUDE.md`, `PRODUCT_SPEC.md`, etc. checked in), reconciling any clashing `.gitignore`/`README.md`.
   - `--no-eslint` because we use Biome (§9). `--no-src-dir` because the repo layout in `CLAUDE.md` §3 has `app/` at the root.

2. **Tighten TypeScript**
   - Extend the generated `tsconfig.json` with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `forceConsistentCasingInFileNames`. `strict: true` is already set by Next.

3. **Add Biome**
   - `pnpm add -D @biomejs/biome` → `pnpm exec biome init`.
   - Set line width 100, two-space indent. Wire `pnpm lint` / `pnpm format` in `package.json`.

4. **Add Vitest**
   - `pnpm add -D vitest @vitest/coverage-v8 happy-dom`.
   - Minimal `vitest.config.ts`: node environment for `lib/`, happy-dom for any component tests later. Coverage thresholds 80% on `lib/` per §10.
   - One trivial smoke test under `tests/unit/` so `pnpm test` returns green from day one.

5. **Add Playwright**
   - `pnpm add -D @playwright/test` → `pnpm exec playwright install --with-deps chromium`.
   - `playwright.config.ts` configured for `http://localhost:3000`, headless in CI, headed locally.
   - One placeholder spec under `tests/e2e/` that loads `/` so `pnpm test:e2e` is wired.

6. **Add runtime deps** (install only — no usage yet)
   - `pnpm add zod @asteasolutions/zod-to-openapi @scalar/nextjs-api-reference better-sqlite3 next-auth@beta @anthropic-ai/sdk`
   - `pnpm add -D @types/better-sqlite3`

7. **Environment template**
   - Write `.env.example` with placeholders only: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `ANTHROPIC_API_KEY`, `DATABASE_PATH=./data/todo.db`.
   - Confirm `.env*` is gitignored (already is).

8. **Repo skeleton directories** — empty `.gitkeep`s for now
   - `lib/`, `lib/ai/`, `prompts/`, `tests/unit/`, `tests/e2e/`, `data/` (gitignored), `logs/` (gitignored).

9. **`.claude/settings.json`**
   - Encode §14: allow `pnpm *`, `npx playwright *`, `git *` (except force/no-verify), `gh *`, `node`, `tsc`, `biome *`, `sqlite3`, `az *`; deny `rm -rf *`, `git push --force*`, `git commit --no-verify*`.
   - `PostToolUse` hook: run `biome format --write` on `*.ts`/`*.tsx` after Edit/Write.
   - Skills + subagents directories created empty; they're built out in Chapter 13.

10. **`.github/` skeletons** (workflow content stays empty; Chapter 14 fills them in)
    - `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/bug.yml`, `ISSUE_TEMPLATE/feature.yml`, `CODEOWNERS` (owner: `@<my-handle>`), `dependabot.yml` (weekly, auto-merge minor/patch).
    - `workflows/` directory exists but empty — keeps Chapter 14's diff focused on CI.

11. **`README.md`**
    - Short: one paragraph what it is, badges placeholder, "see `TUTORIAL.md` to follow along," license. Detail deferred until there's something to demo.

12. **Smoke check**
    - `pnpm dev` boots; `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all green on the empty scaffold. **If any are red, fix the scaffold, not the rule.** (§11.)

13. **First commit & push**
    - Conventional commit: `chore: scaffold Next.js, TypeScript strict, Biome, Vitest, Playwright`.
    - Feature branch `chore/scaffold` → PR → CI (none yet, so green by default) → squash merge → tag nothing yet.

### What we'll ask Claude Code

The plan above is what I'll hand Claude as the brief. Two interaction patterns I expect to lean on:

- **Tight, parallel tool use.** Steps 2–6 are independent file edits + installs; I want Claude to batch them. If Claude serializes them, I'll redirect: "run those in parallel."
- **Smoke-check discipline.** Step 12 is the moment to confirm reality matches the plan. I'll ask Claude to run all four commands and paste the output, not to claim success after the installs finish.

One thing I won't hand to Claude: the actual `pnpm create next-app` invocation in step 1. Interactive scaffolders + agent shells are a bad combo. I'll run that one by hand, then hand the populated directory back.

### Expected output

Roughly 25–30 new/modified files. The PR diff should be almost entirely additive: configs, empty directories with `.gitkeep`, the `.env.example`, the skeleton workflows folder, two placeholder tests. Zero application code in `app/` beyond what `create-next-app` ships (we'll delete the default landing page in Chapter 12, not now — leaving it lets us prove `pnpm dev` boots).

### Watch-outs (lessons-to-be)

Things I expect to bite us, recorded now so we notice if they do:

- **`create-next-app` defaults drift.** The flags above match Next 14/15 at time of writing; if Next 16 reorders prompts, the brief becomes stale.
- **Biome vs. Next's ESLint baggage.** `--no-eslint` should keep this clean, but stray `eslint-config-next` references sometimes appear; grep for them.
- **Playwright in CI.** Browser install is slow; Chapter 14 will need a cache step. Note it but don't solve it yet.
- **Auth.js v5 beta.** Pinning to a specific beta avoids surprise breakage mid-tutorial. Record the exact version in the commit.
- **`better-sqlite3` native build.** Needs Python + a C++ toolchain. Fine on macOS/Linux dev boxes; flag in `README.md` for Windows readers.

### Open question for review

Should the scaffold commit include the empty `.github/workflows/*.yml` files (with just a `name:` field) or skip the directory entirely until Chapter 14? Including them avoids a noisy "first CI" diff later; skipping them keeps this chapter honest about what's actually wired. Leaning toward **skip** — write the directory in Chapter 14 when we know what's in it.

**Resolved at execution time:** skipped. No `workflows/` directory in this commit.

### Where the plan was wrong

Three things the plan got wrong, caught during execution:

1. **`create-next-app` produced Next 16, not Next 14.** The plan said "Next 14+" generically; the scaffolder picked the latest (16.2.6) plus React 19.2 and Tailwind v4. Pinning a major version in `CLAUDE.md` §2 would have spared us the surprise. Action: update `CLAUDE.md` §2 to "Next 16 / React 19 / Tailwind v4."

2. **pnpm's new `allowBuilds` gate is now mandatory.** pnpm 11 rewrote our `pnpm-workspace.yaml` with `allowBuilds: <pkg>: set this to true or false` placeholders and then *failed every subsequent command* until we resolved them to literal `true`/`false`. The plan didn't anticipate this — it's new behavior. Sharp, better-sqlite3, esbuild, biome, and unrs-resolver all needed explicit allow.

3. **`exactOptionalPropertyTypes: true` is sharper than I expected.** Playwright's `defineConfig` rejects `workers: undefined` under this flag — the type is `string | number`, not `string | number | undefined`. Had to spread the property conditionally. Worth knowing for future configs: this flag is fine for *our* code but makes some library type-definitions awkward.

### Smoke check (actual output, all green)

```
$ pnpm typecheck   → tsc --noEmit (0 errors)
$ pnpm lint        → biome check . (13 files, no issues)
$ pnpm test        → vitest: 1 passed
$ pnpm build       → next build (4 static pages, 836ms compile)
$ pnpm test:e2e    → playwright: 1 passed (chromium, 3.4s incl. webServer boot)
```

### Output (this commit)

- 22 new files: configs, skeleton dirs with `.gitkeep`s, `.env.example`, `.claude/settings.json`, `.github/` skeletons, `README.md`, two placeholder tests, the create-next-app boilerplate (`app/`, `public/`, `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts`).
- 1 modified file: `TUTORIAL.md` (this chapter).
- 1 lockfile: `pnpm-lock.yaml`.

### Lessons (preliminary — fuller pass in the retrospective commit)

- **Use a non-empty target dir trick.** Scaffolding into `/tmp/cn-scaffold` and rsync-merging back beat fighting `create-next-app .` over the existing markdown.
- **Verify the smoke check actually runs the command, not just installs.** `pnpm install`'s success says nothing about whether `tsc` returns 0. Run all four commands.
- **Don't trust "Aborting installation" alone.** `create-next-app` printed a scary abort while having successfully installed everything. Read the line above the error before reacting.

---

## Chapter 7 — Storage layer with TDD ⏳

*Will cover: writing the storage tests from `TEST_CASES.md` §4 first, then implementing `lib/storage.ts` to pass them. Demo of how Claude Code uses tests to drive implementation.*

---

## Chapter 8 — Google + Microsoft SSO ⏳

*Will cover: setting up NextAuth (Auth.js v5), creating OAuth apps in Google Cloud Console and Microsoft Entra ID, wiring providers, redirect URIs, session storage, the first end-to-end sign-in flow.*

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

*Last updated: 2026-05-16 — through Chapter 5; Chapter 6 drafted as pre-execution plan, pending scaffold.*
