# ClaudeTodo — Product Specification

**Status:** Draft v0.3 — for review
**License:** MIT (open source)
**Repository:** Personal GitHub (public)
**Date:** 2026-05-14

## Changelog


---

## 1. Project Purpose

**ClaudeTodo** is an open-source tutorial project. Its goal is to **teach developers how to use Claude Code to build a real, deployed, API-driven web application from scratch.**

The todo-list domain is deliberately trivial. The real artifact is the **build process**, captured in `TUTORIAL.md`, which walks readers through every Claude Code interaction, decision, and lesson learned.

**Primary success criterion:** a developer who has never used Claude Code can read `TUTORIAL.md`, follow along, and ship a similar app to Azure in under a day.

---

## 2. Target Audience

| Reader | What they get |
|--------|---------------|
| Developer new to Claude Code | A full walk-through showing how Claude Code is used in a real build |
| Developer experienced with Claude Code | A reference for layering skills, subagents, MCP, hooks, memory |
| Developer building their first AI-enhanced app | A copyable pattern: API + SSO + AI features + responsive UI + cloud deploy |
| End user of the demo | A live, public, AI-assisted todo list they can sign in to and use |

---

## 3. Headline Features

1. **Multi-user todo list** with Google SSO and Microsoft SSO sign-in.
2. **AI features powered by Claude:**
   - Prioritize my open tasks (returns ranked list with one-line reason per task)
   - Generate today's summary (3-sentence recap of completed work)
3. **Public REST API** — outside applications can authenticate via Bearer token and CRUD todos.
4. **OpenAPI 3.1 documentation** auto-published at `/api/docs`, browsable by anyone.
5. **Responsive web UI** — works on mobile, tablet, desktop (mobile-first design).
6. **Deployed to Azure** as a working POC at a public URL.
7. **Tutorial documentation** — every step recorded in `TUTORIAL.md` as the build progresses.

---

## 4. User Stories — MVP

1. **As a visitor**, I can sign in with my Google account or Microsoft account, so I have an authenticated session.
2. **As a signed-in user**, I can add a task with a title and optional notes.
3. **As a signed-in user**, I can list my open tasks and mark them done.
4. **As a signed-in user**, I can ask Claude to prioritize my open tasks.
5. **As a signed-in user**, I can ask Claude for a 3-sentence summary of today's done tasks.
6. **As a signed-in user**, I can issue myself a Personal Access Token (PAT) and use it to call the API from outside the web app.
7. **As an external developer**, I can read the public OpenAPI docs at `/api/docs` and call the API using a Bearer token.
8. **As a user on mobile**, I can use all features without horizontal scrolling.

## 5. User Stories — Stretch

9. As a user, I can revoke a PAT.
10. As a user, I can export my tasks as JSON.
11. As an external developer, I can authenticate via OAuth2 (client credentials) instead of PAT.
12. As an external developer, I can subscribe to webhook events when my tasks change.

---

## 6. In Scope (MVP)

- Multi-user data isolation (every row scoped by `user_id`)
- Google OAuth2 + Microsoft (Entra ID / Azure AD) OAuth2 sign-in via NextAuth (Auth.js)
- Personal Access Tokens (created from web UI, used as `Authorization: Bearer <token>`)
- REST API: `/api/v1/tasks`, `/api/v1/tasks/{id}`, `/api/v1/tasks/prioritize`, `/api/v1/tasks/summary`, `/api/v1/me`
- OpenAPI 3.1 spec generated from Zod schemas; served at `/api/openapi.json`
- API docs UI at `/api/docs` (Scalar — modern, lightweight)
- Responsive UI (Tailwind, mobile-first breakpoints)
- Two AI features (prioritize, daily summary) using Claude API
- SQLite via `better-sqlite3` (persistent disk on App Service)
- Unit + integration + E2E tests (Vitest + Playwright)
- CI on GitHub Actions (free for public repos)
- Deploy to Azure App Service (Linux, Node 20)
- `TUTORIAL.md` updated continuously through the build

## 7. Out of Scope

- Real-time multi-device sync
- Native mobile apps
- Webhooks (stretch only)
- Calendar/email/Slack integrations
- Postgres migration (documented as next-step, not built)
- Rate limiting per IP (basic per-user limit only)
- Internationalization (English only)

---

## 8. Functional Requirements

### 8.1 Authentication & users
| ID | Requirement |
|----|-------------|
| F-1 | "Sign in with Google" button initiates Google OAuth2 / OIDC flow. |
| F-2 | "Sign in with Microsoft" button initiates Microsoft (Entra ID common endpoint) OAuth2 / OIDC flow. |
| F-3 | On first successful sign-in, a `users` row is created with `provider`, `provider_user_id`, `email`, `display_name`, `created_at`. |
| F-4 | Session cookies are HTTP-only, Secure, SameSite=Lax. |
| F-5 | Users can sign out; session invalidated server-side. |
| F-6 | Signed-in user can create a PAT (display once, store hashed). Token format: `ctd_<base32-22chars>`. |
| F-7 | Signed-in user can list and revoke their PATs. |

### 8.2 Tasks (web + API)
| ID | Requirement |
|----|-------------|
| F-8 | Add task with `title` (1–200 chars, required) and `notes` (≤2000 chars, optional). |
| F-9 | List tasks filtered by `status` (`open` / `done` / `all`). Pagination: page size 50, cursor-based. |
| F-10 | Mark a task done; sets `status='done'` and `completed_at`. |
| F-11 | Soft-delete a task; row remains with `deleted_at`. No hard delete in MVP. |
| F-12 | All task operations strictly scoped to the authenticated user. No cross-user access possible. |
| F-13 | Reject task content matching email, phone, NRIC, credit card patterns. Show clear error. |

### 8.3 AI features (web + API)
| ID | Requirement |
|----|-------------|
| F-14 | `prioritize` returns up to 50 of the user's open tasks ranked, with `rank` and `reason` per task. |
| F-15 | `summary` returns a 3-sentence string summarizing tasks completed by the user today. |
| F-16 | Both features use Claude Haiku 4.5 by default with prompt caching on the system prompt. |
| F-17 | If `ANTHROPIC_API_KEY` is missing, AI endpoints return HTTP 503 with body `{ "error": "ai_unavailable" }`. |
| F-18 | Daily AI cost ceiling **per user**: USD 0.10. Past ceiling returns HTTP 429 `{ "error": "cost_ceiling_exceeded" }`. |

### 8.4 Public API
| ID | Requirement |
|----|-------------|
| F-19 | All `/api/v1/*` endpoints accept `Authorization: Bearer <pat>` for authentication. |
| F-20 | Web UI uses session cookies; same handlers work for both auth modes (middleware unifies the user resolution). |
| F-21 | OpenAPI 3.1 spec served at `/api/openapi.json` (JSON), `/api/openapi.yaml` (YAML). |
| F-22 | API docs UI served at `/api/docs` — Scalar UI, no auth required, publicly browsable. |
| F-23 | API returns JSON with consistent error shape: `{ "error": "<machine_code>", "message": "<human>" }`. |
| F-24 | Per-user API rate limit: 60 requests / minute (HTTP 429 with `Retry-After` on breach). |

### 8.5 Responsive UI
| ID | Requirement |
|----|-------------|
| F-25 | UI is mobile-first; no horizontal scroll at any viewport ≥ 320px wide. |
| F-26 | Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px. Layout adapts cleanly. |
| F-27 | All interactive elements have visible focus state and minimum 44×44px touch target on mobile. |

---

## 9. Non-Functional Requirements

### 9.1 Performance
- API p95 latency for non-AI endpoints: <200ms locally, <500ms on Azure App Service B1.
- AI endpoint latency depends on Claude — show a loading state ≥300ms.

### 9.2 Security
- HTTPS only in production (App Service enforces).
- PATs stored as SHA-256 hashes; plaintext shown to user exactly once.
- All inputs validated with Zod at the handler boundary.
- CodeQL on every PR (free for public repos).
- Dependabot weekly (free for public repos).
- Secret scanning + push protection enabled (free for public repos).
- No PII in tasks (F-13 rejection).
- AI call logs contain metadata only — never prompt body or task content.

### 9.3 Cost
- Default Claude model: **`claude-haiku-4-5-20251001`**.
- Per-user daily ceiling: USD 0.10 (F-18).
- Prompt caching mandatory on system prompts >1024 tokens.
- Azure resources sized for free / lowest paid tier (App Service F1 free or B1 ~USD 13/mo).

### 9.4 Reliability
- AI outage → CRUD continues to work; AI endpoints return 503.
- SQLite on App Service persistent disk; nightly backup to Azure Blob (stretch).

### 9.5 Accessibility
- Keyboard navigable.
- Lighthouse Accessibility score ≥90.
- Sufficient color contrast (WCAG AA).

### 9.6 Maintainability
- TypeScript strict mode.
- ≤1200 LOC for MVP (excluding tests, generated OpenAPI artifacts, scaffolding).
- Tests with Vitest + Playwright; ≥80% coverage on `lib/` modules.

---

## 10. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript (strict) | Single language for full stack; great DX |
| Runtime | Node.js 20 LTS | Azure App Service support; mature |
| Framework | Next.js 14+ (App Router) | Server Components, Server Actions, Route Handlers — one repo, one deploy |
| UI | React + Tailwind CSS | Responsive utilities; mobile-first |
| Auth | NextAuth (Auth.js v5) | Google + Microsoft providers built-in; session + JWT support |
| Storage | SQLite via `better-sqlite3` | Zero ops; persistent disk on App Service; clear upgrade path to Postgres |
| Schema | Zod | Runtime validation + source for OpenAPI |
| OpenAPI | `@asteasolutions/zod-to-openapi` | Generates OpenAPI 3.1 from Zod |
| API docs UI | Scalar | Modern, fast, themeable (Swagger UI as fallback) |
| AI SDK | `@anthropic-ai/sdk` | Native Claude integration |
| Unit/Integration tests | Vitest | Fast, modern, native ESM |
| E2E tests | Playwright | Cross-browser, CI-friendly |
| Lint/format | Biome | Single tool, fast |
| Package manager | pnpm | Disk-efficient, deterministic |
| CI/CD | GitHub Actions | Free for public repos |
| Deploy | Azure App Service (Linux, Node 20) | Simple, free F1 tier exists; Azure POC requirement |
| Auth between GH & Azure | OIDC federated identity credentials | No long-lived secrets in repo |

---

## 11. AI Features — Detail

### 11.1 Prioritize
- Endpoint: `POST /api/v1/tasks/prioritize`
- Auth: session cookie or Bearer PAT
- Input: none (server pulls user's open tasks, max 50)
- System prompt (cached): persona, output schema (JSON `[{id, rank, reason}]`), guardrails
- Model: `claude-haiku-4-5-20251001`
- Output: ranked array with one-line reason per task

### 11.2 Daily Summary
- Endpoint: `POST /api/v1/tasks/summary`
- Auth: session cookie or Bearer PAT
- Input: none (server pulls today's completed tasks)
- System prompt (cached): 3-sentence rule, encouraging tone
- Same model, same caching

---

## 12. Public API Surface (planned)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET    | `/api/v1/me` | session/PAT | Returns current user `{id, email, display_name, provider}` |
| GET    | `/api/v1/tasks?status=open&cursor=…` | session/PAT | List tasks |
| POST   | `/api/v1/tasks` | session/PAT | Create task |
| GET    | `/api/v1/tasks/{id}` | session/PAT | Get one task |
| PATCH  | `/api/v1/tasks/{id}` | session/PAT | Update status / fields |
| DELETE | `/api/v1/tasks/{id}` | session/PAT | Soft-delete |
| POST   | `/api/v1/tasks/prioritize` | session/PAT | AI prioritize |
| POST   | `/api/v1/tasks/summary` | session/PAT | AI daily summary |
| GET    | `/api/v1/pats` | session only | List user's PATs |
| POST   | `/api/v1/pats` | session only | Issue new PAT (returns plaintext once) |
| DELETE | `/api/v1/pats/{id}` | session only | Revoke PAT |
| GET    | `/api/openapi.json` | none | Machine-readable OpenAPI 3.1 spec |
| GET    | `/api/openapi.yaml` | none | Same, YAML |
| GET    | `/api/docs` | none | Public Scalar UI |

---

## 13. Claude Code Feature Demonstrations

The repo will include working examples of:

| # | Feature | Demonstration |
|---|---------|---------------|
| 1 | Prompt engineering | `prompts/` directory with v1 (naive) vs v2 (XML-structured, role, examples) for each AI feature, plus a README explaining changes |
| 2 | Claude API + caching | `lib/ai/client.ts` with `cache_control` on system prompt |
| 3 | Memory | User-level memory configured globally; this project's `CLAUDE.md` linked |
| 4 | Custom skill | `.claude/skills/task-clarity-review/SKILL.md` — review a task title for clarity before saving |
| 5 | Community skill | Install one skill from `anthropics/skills`; document the choice in TUTORIAL.md |
| 6 | Custom subagent | `.claude/agents/api-doc-writer.md` — drafts OpenAPI examples |
| 7 | MCP server | Connect filesystem MCP (read project docs); config in `.mcp.json` |
| 8 | Hook | `PostToolUse` hook auto-formats with Biome after Edit/Write |
| 9 | Deploy | One-command deploy via GH Actions to Azure App Service |

---

## 14. GitHub (Personal) Feature Demonstrations

Personal/free GitHub still offers a strong feature set for public repos:

| # | Feature | Demonstration |
|---|---------|---------------|
| G-1 | GitHub Actions | CI: lint, typecheck, unit, E2E, build. Deploy: OIDC → Azure App Service |
| G-2 | CodeQL | Free for public repos; on PR + nightly |
| G-3 | Dependabot | npm + GH Actions; weekly |
| G-4 | Secret scanning + push protection | Free for public repos |
| G-5 | Branch protection | `main` requires PR + green checks (best-effort on free; some rules need paid) |
| G-6 | CODEOWNERS | `.github/CODEOWNERS` |
| G-7 | PR & issue templates | `.github/PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/*.yml` |
| G-8 | Environments | `staging` + `production` with OIDC federation |
| G-9 | Codespaces | `.devcontainer/devcontainer.json` (60 hrs/month free for personal) |
| G-10 | Releases | Conventional commits → release notes on tag push |
| G-11 | Public OpenAPI link | README badge linking to `/api/docs` on the live URL |

---

## 15. Azure Resources (planned)

| Resource | Tier | Purpose |
|----------|------|---------|
| Resource Group | n/a | Container for everything |
| App Service Plan (Linux) | F1 (free) or B1 (~USD 13/mo) | Hosts the Next.js app |
| App Service (Web App) | n/a | The app itself |
| Application Insights | basic | Logs + metrics |
| Storage Account | LRS standard | Optional backup of SQLite |
| Microsoft Entra ID App Registration | n/a | Microsoft SSO provider config |

(Google SSO is configured in Google Cloud Console — not an Azure resource.)

---

## 16. Success Metrics

- ✅ Public URL on `*.azurewebsites.net` reachable from anywhere
- ✅ Sign in with Google works
- ✅ Sign in with Microsoft works
- ✅ External `curl` with a Bearer PAT can create, list, update, prioritize, summarize tasks
- ✅ `/api/docs` is publicly browsable and accurately reflects the API
- ✅ Lighthouse mobile: Performance ≥80, Accessibility ≥90, Best Practices ≥90
- ✅ All 9 Claude Code feature demonstrations work and are explained in TUTORIAL.md
- ✅ TUTORIAL.md is complete enough that a new developer can replicate the build
- ✅ Total Claude API cost for the build session: <USD 3

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP gate; stretch items documented but not built |
| Free-tier App Service cold starts | Acceptable for POC; documented in README |
| OIDC GitHub → Azure setup is fiddly | TUTORIAL.md walks through it step by step |
| SQLite file gets wiped on App Service redeploy | Use App Service persistent disk (`/home`); document backup path |
| SSO provider config drift | Both providers' setup steps recorded in TUTORIAL.md with screenshots |
| Claude API cost spikes | Default Haiku + per-user ceiling + caching |
| Tutorial doc rots as code evolves | Update TUTORIAL.md in same PR as the code change (workflow rule in CLAUDE.md) |

---

## 18. Open Questions

1. **Project name confirmed?** Going with `claude-todo`. OK or do you prefer something else (`claudetodo`, `todo-with-claude`, etc.)?
2. **Azure region?** Default to **Southeast Asia (Singapore)** for low latency from your side. Confirm.
3. **MCP demo target** — filesystem (simple), GitHub (read your own issues), or both?
4. **Tutorial style** — narrative ("then we asked Claude…") or structured chapters with code snippets? I've defaulted to chapters with embedded narrative.
5. **API versioning** — `/api/v1/*` baked in. Confirm acceptable.
6. **PATs only, or also OAuth2 client credentials for service-to-service?** Default is PAT-only for MVP.
7. **Conventional commits + auto-changelog** — adopt?

---

## 19. Next Steps

1. **You review `PRODUCT_SPEC.md` (this doc)** → comments / changes / approval.
2. **You review `CLAUDE.md`** → governance + workflow feedback.
3. **You review `TEST_CASES.md`** → test scope sign-off. *No production code until this is signed off.*
4. **You skim `TUTORIAL.md`** → confirm tone and structure, then I keep it updated as we build.
5. Provide GitHub username + Azure tenant when ready.
6. I scaffold the repo on the agreed name and push the initial commit.
7. Build in order: storage → auth/SSO → API → OpenAPI docs → AI features → responsive UI → CI → Azure deploy.
8. Each chapter shipped → TUTORIAL.md updated → reviewed → moved on.
