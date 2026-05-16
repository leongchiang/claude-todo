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

*Last updated: 2026-05-16 — through Chapter 6 (scaffold landed, retrospective written).*
