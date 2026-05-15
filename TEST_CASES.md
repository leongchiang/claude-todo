# ClaudeTodo — Test Cases / Test Suite

**Status:** Draft v0.2 — for review
**Date:** 2026-05-14
**Gate:** This file must be **reviewed and signed off** before any production code is written. (Test setup code may be scaffolded earlier.)

## Changelog
- **v0.2 (2026-05-14)** — Reworked for personal OSS tutorial. Added auth (Google + Microsoft SSO), PAT, public API, OpenAPI docs, responsive UI, and external-developer test cases.
- v0.1 — Initial single-user, no-auth version.

---

## 1. Why a reviewed test suite first

Reviewing test cases before code forces both of us to agree on **observable behavior**, catches missing requirements, and gives anyone forking the repo a copy-paste pattern: "this is how a Claude-Code-built app proves it works." See `CLAUDE.md` §11 "Workflow Rules".

---

## 2. Test Pyramid & Tooling

| Layer | Tool | When it runs |
|-------|------|--------------|
| Unit | Vitest | On every save (watch) + CI |
| Integration (real SQLite, mocked Claude) | Vitest | CI |
| Contract (AI prompt regression with recorded fixtures) | Vitest | CI nightly |
| API contract (OpenAPI spec validation) | Vitest + Spectral | CI |
| E2E (browser + responsive) | Playwright | PR + nightly |
| Security (PII, auth bypass attempts) | Vitest | CI |
| Static (CodeQL, typecheck, lint) | GH Actions | PR |

**Coverage target:** ≥80% on `lib/` modules.

---

## 3. Conventions

- ID format: `TC-<AREA>-<NUM>`.
- Priority: **P0** = ship-blocker, **P1** = should-have, **P2** = nice-to-have.
- Each case: **Given / When / Then** in plain English.
- "Synthetic data only" — never real names, emails, NRICs in fixtures.

---

## 4. Storage (`lib/storage.ts`) — user-scoped CRUD

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-S-01 | P0 | Empty DB, user `u1` | Add task "Buy milk" | Task persisted with `user_id=u1`, `status='open'`, `created_at` set |
| TC-S-02 | P0 | u1 has tasks | u2 calls `listTasks(u2)` | u1's tasks NOT returned (strict isolation) |
| TC-S-03 | P0 | u1 task exists | u2 attempts `getTask(taskId, u2)` | Returns null (or throws `NotFoundError`) — never returns u1's data |
| TC-S-04 | P0 | u1 task exists | u2 attempts `markDone(taskId, u2)` | Throws `NotFoundError`; row unchanged |
| TC-S-05 | P0 | Task exists | Mark done | `status='done'`, `completed_at` set (UTC ISO) |
| TC-S-06 | P0 | Task done | List `status=open` | Not returned |
| TC-S-07 | P0 | Task exists | Soft-delete | `deleted_at` set; not returned in normal lists |
| TC-S-08 | P0 | 100 tasks for u1 | List with `cursor=null, limit=50` | Returns 50 + `next_cursor`; second page returns rest |
| TC-S-09 | P1 | Title 201 chars | Add task | Throws `ValidationError`; nothing persisted |
| TC-S-10 | P1 | Title empty | Add task | Throws `ValidationError` |
| TC-S-11 | P1 | Notes 2001 chars | Add task | Throws `ValidationError` |
| TC-S-12 | P2 | DB file missing | First `getDb()` call | Schema created; subsequent calls reuse |

---

## 5. PII detection (`lib/pii.ts`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-P-01 | P0 | "S1234567D" | `detectPii` | `{ found: true, type: 'nric' }` |
| TC-P-02 | P0 | "alice@example.com" | `detectPii` | `{ found: true, type: 'email' }` |
| TC-P-03 | P0 | "+65 9123 4567" | `detectPii` | `{ found: true, type: 'phone' }` |
| TC-P-04 | P0 | "4111 1111 1111 1111" | `detectPii` | `{ found: true, type: 'credit_card' }` |
| TC-P-05 | P0 | "Buy milk" | `detectPii` | `{ found: false }` |
| TC-P-06 | P1 | "S12" | `detectPii` | `{ found: false }` (no false-positive) |
| TC-P-07 | P1 | `addTask` w/ email in notes | Call | Throws `PiiRejectedError`; nothing persisted |
| TC-P-08 | P2 | "Alice@EXAMPLE.com" | `detectPii` | `{ found: true }` (case-insensitive) |

---

## 6. Authentication — Google + Microsoft SSO (`lib/auth.ts`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-AUTH-01 | P0 | Anonymous visitor | GET `/api/auth/signin` | Shows both "Continue with Google" and "Continue with Microsoft" |
| TC-AUTH-02 | P0 | Google OAuth callback w/ valid code | NextAuth processes | New user row created (or existing returned); session cookie set |
| TC-AUTH-03 | P0 | Microsoft OAuth callback w/ valid code | NextAuth processes | New user row created (or existing returned); session cookie set |
| TC-AUTH-04 | P0 | Two sign-ins same provider+email | Second sign-in | Same `user.id` returned (no duplicate user) |
| TC-AUTH-05 | P0 | Google user `google:abc123` and Microsoft user `microsoft:abc123` w/ same email | Both sign in | Treated as **different** users (provider+provider_user_id is the unique key) |
| TC-AUTH-06 | P0 | Signed-in user | POST `/api/auth/signout` | Session cookie cleared; subsequent requests return 401 |
| TC-AUTH-07 | P0 | Anonymous request to `/api/v1/tasks` | GET | 401 `{ "error": "unauthenticated" }` |
| TC-AUTH-08 | P1 | Tampered session cookie | GET `/api/v1/tasks` | 401; no user resolved |
| TC-AUTH-09 | P1 | Expired session | GET protected page | Redirected to sign-in |
| TC-AUTH-10 | P2 | OAuth callback w/ `error=access_denied` | Callback | Friendly error page; no user created |

---

## 7. Personal Access Tokens (`lib/pats.ts`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-PAT-01 | P0 | Signed-in user | POST `/api/v1/pats` w/ `name="cli"` | Returns plaintext token once, format `ctd_[A-Z2-7]{22}`; DB stores SHA-256 hash only |
| TC-PAT-02 | P0 | Existing PAT | GET `/api/v1/pats` | Returns `[{ id, name, last_used_at, created_at }]` — never plaintext |
| TC-PAT-03 | P0 | Valid Bearer PAT | GET `/api/v1/tasks` | Authenticates as owner; tasks returned |
| TC-PAT-04 | P0 | Invalid Bearer | GET `/api/v1/tasks` | 401 `{ "error": "invalid_token" }` |
| TC-PAT-05 | P0 | Revoked PAT (`deleted_at` set) | GET `/api/v1/tasks` w/ that Bearer | 401 |
| TC-PAT-06 | P0 | PAT used | After call | `last_used_at` updated |
| TC-PAT-07 | P1 | User has 10 PATs | POST new | Allowed up to 20; over 20 returns 400 `{ "error": "too_many_pats" }` |
| TC-PAT-08 | P1 | DELETE `/api/v1/pats/{id}` for own PAT | Call | Soft-delete; subsequent uses 401 |
| TC-PAT-09 | P1 | DELETE `/api/v1/pats/{id}` for someone else's PAT | Call | 404 (never 403 — don't leak existence) |

---

## 8. AI client (`lib/ai/client.ts`)

Wrapper centralizes model, caching, cost tracking, per-user daily ceiling. Tests mock `@anthropic-ai/sdk`.

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-AI-01 | P0 | Mocked SDK | `complete({ system, user })` | SDK called w/ `model='claude-haiku-4-5-20251001'`, `cache_control: { type: 'ephemeral' }` on system block |
| TC-AI-02 | P0 | Mock returns 100/50/800 tokens | Call | One JSON line appended to `logs/ai_calls.jsonl` w/ counts, model, feature, latency, request_id, user_id |
| TC-AI-03 | P0 | Log line written | Inspect | Body fields (prompt, response) NOT present |
| TC-AI-04 | P0 | User u1 today's cost = USD 0.099 | Call (est cost 0.002) for u1 | Throws `CostCeilingExceededError`; no SDK call |
| TC-AI-05 | P0 | User u1 today's cost = USD 0.05 | Call (est cost 0.01) for u1 | SDK called normally |
| TC-AI-06 | P0 | u1 over ceiling, u2 not | Call for u2 | Succeeds (ceiling is per-user) |
| TC-AI-07 | P0 | `ANTHROPIC_API_KEY` missing | Call | Throws `MissingApiKeyError` w/ clear message |
| TC-AI-08 | P1 | SDK throws `RateLimitError` | Call | Retries once with backoff, then surfaces |
| TC-AI-09 | P1 | Caller passes `model='claude-sonnet-4-6'` | Call | SDK called w/ that model; log records it |
| TC-AI-10 | P2 | Two parallel calls for u1 | Both | Cost ledger increments atomically |

---

## 9. Prioritize (`lib/ai/prioritize.ts`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-PR-01 | P0 | u1 has 3 open tasks | `prioritize(u1)` | Returns array len 3, `{id, rank, reason}`, ranks 1..3 unique |
| TC-PR-02 | P0 | u1 has 0 open tasks | `prioritize(u1)` | Returns `[]`; no SDK call |
| TC-PR-03 | P0 | u1 has 51 open tasks | `prioritize(u1)` | Only top 50 by `created_at` sent; result length ≤ 50 |
| TC-PR-04 | P0 | Mock returns malformed JSON | Call | Throws `AiResponseParseError`; logged |
| TC-PR-05 | P1 | Mock returns duplicate ranks | Call | Throws `AiResponseInvalidError` |
| TC-PR-06 | P1 | Mock returns task IDs not in input | Call | Throws `AiResponseInvalidError` |
| TC-PR-07 | P2 | Recorded fixture re-run | Compare | Structurally matches (prompt regression) |

---

## 10. Daily summary (`lib/ai/summary.ts`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-DS-01 | P0 | u1 has 2 completed today | `summary(u1)` | String w/ exactly 3 sentences |
| TC-DS-02 | P0 | u1 has 0 completed today | `summary(u1)` | Returns literal "No tasks completed yet today."; no SDK call |
| TC-DS-03 | P1 | Mock returns 5-sentence response | Call | Wrapper truncates or retries; output ≤ 3 sentences |
| TC-DS-04 | P2 | Recorded fixture re-run | Compare | Structural match |

---

## 11. Public API Route Handlers

Cover wiring, auth, validation, error shape. Mock `lib/*`.

| ID | P | Endpoint | Given | When | Then |
|----|---|----------|-------|------|------|
| TC-API-01 | P0 | `GET /api/v1/me` | Authenticated session | Call | 200 `{ id, email, display_name, provider }` |
| TC-API-02 | P0 | `GET /api/v1/me` | Anonymous | Call | 401 `{ error: "unauthenticated" }` |
| TC-API-03 | P0 | `POST /api/v1/tasks` | Auth, valid body | Call | 201 returned task; `Location` header set |
| TC-API-04 | P0 | `POST /api/v1/tasks` | Auth, missing title | Call | 400 w/ Zod field errors |
| TC-API-05 | P0 | `POST /api/v1/tasks` | Auth, body has email | Call | 400 `{ error: "pii_rejected", type: "email" }` |
| TC-API-06 | P0 | `GET /api/v1/tasks?status=open` | Auth | Call | 200 paginated list; only own tasks |
| TC-API-07 | P0 | `PATCH /api/v1/tasks/{id}` | Auth, owner, `{ status: "done" }` | Call | 200 updated task |
| TC-API-08 | P0 | `PATCH /api/v1/tasks/{id}` | Auth, NOT owner | Call | 404 (never 403) |
| TC-API-09 | P0 | `DELETE /api/v1/tasks/{id}` | Auth, owner | Call | 204; row soft-deleted |
| TC-API-10 | P0 | `POST /api/v1/tasks/prioritize` | Auth | Call | 200 ranked list |
| TC-API-11 | P0 | `POST /api/v1/tasks/summary` | Auth | Call | 200 `{ summary: "<3 sentences>" }` |
| TC-API-12 | P0 | Any AI endpoint | No `ANTHROPIC_API_KEY` | Call | 503 `{ error: "ai_unavailable" }` |
| TC-API-13 | P0 | Any AI endpoint | Cost ceiling reached | Call | 429 `{ error: "cost_ceiling_exceeded" }` |
| TC-API-14 | P0 | Any `/api/v1/*` | Valid Bearer PAT | Call | Authenticates equivalently to session |
| TC-API-15 | P0 | Any `/api/v1/*` | 61 requests in 60s from same user | 61st | 429 w/ `Retry-After` header |
| TC-API-16 | P1 | Any `/api/v1/*` | Unexpected exception | Server error | 500 `{ error: "internal", request_id: "..." }`; same `request_id` in logs |

---

## 12. OpenAPI spec & docs UI

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-OAS-01 | P0 | Built app | GET `/api/openapi.json` | 200, valid OpenAPI 3.1 (validated w/ Spectral); all `/api/v1/*` paths documented |
| TC-OAS-02 | P0 | Spec | Inspect | Each endpoint lists auth (session/Bearer), request schema, all response codes used, examples |
| TC-OAS-03 | P0 | Built app | GET `/api/docs` | 200, HTML; loads Scalar UI; no auth required |
| TC-OAS-04 | P0 | Built app | GET `/api/openapi.yaml` | 200, valid YAML equivalent of JSON |
| TC-OAS-05 | P1 | New endpoint added in code | Run `pnpm openapi` | Generated spec includes the new endpoint |
| TC-OAS-06 | P1 | Spec | Inspect | Server URL points to deployed Azure URL in prod, `localhost:3000` in dev |
| TC-OAS-07 | P2 | Scalar UI | Click "Try it" w/ a PAT | Real request fires against current host |

---

## 13. E2E — Web UI (Playwright `tests/e2e/`)

Headless Chromium. Mock SSO providers in tests. Mocked Claude responses for AI features.

| ID | P | Viewport | Given | When | Then |
|----|---|----------|-------|------|------|
| TC-E2E-01 | P0 | 1280×800 | Landing page | Click "Continue with Google" | Lands authenticated on todo list |
| TC-E2E-02 | P0 | 1280×800 | Landing page | Click "Continue with Microsoft" | Lands authenticated on todo list |
| TC-E2E-03 | P0 | 1280×800 | Authed user | Type "Buy milk", submit | Task appears; persists across reload |
| TC-E2E-04 | P0 | 1280×800 | Task open | Click "Done" | Moves to done filter |
| TC-E2E-05 | P0 | 1280×800 | Input "alice@example.com" | Submit | Clear inline error "PII detected"; no task added |
| TC-E2E-06 | P0 | 1280×800 | 3 open tasks, mocked AI | Click "Prioritize" | Ranked list w/ reasons |
| TC-E2E-07 | P0 | 1280×800 | Settings page | Click "New token" w/ name | Token shown once, plaintext copyable; warning to save now |
| TC-E2E-08 | P0 | 375×667 (mobile) | Authed | All TC-E2E-03 through 06 | Work identically; no horizontal scroll |
| TC-E2E-09 | P0 | 768×1024 (tablet) | Authed | All TC-E2E-03 through 06 | Work identically; no horizontal scroll |
| TC-E2E-10 | P1 | 1280×800 | Tab from top of page | Walk through all interactive | Focus order logical; visible ring at each stop |
| TC-E2E-11 | P1 | 1280×800 | App loaded | Run axe-core | No serious/critical accessibility violations |
| TC-E2E-12 | P2 | 1280×800 | App loaded | Lighthouse mobile | Performance ≥80, Accessibility ≥90, Best Practices ≥90 |

---

## 14. External Developer Journey (API user, simulated)

These are integration tests that exercise the system the way an external developer would via `curl` / fetch.

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-EXT-01 | P0 | User has signed in (via test helper) and minted a PAT | `curl GET /api/openapi.json` | Spec retrievable without auth |
| TC-EXT-02 | P0 | PAT in hand | `curl POST /api/v1/tasks` w/ Bearer | 201 task created |
| TC-EXT-03 | P0 | PAT in hand | `curl GET /api/v1/tasks?status=open` | Created task listed |
| TC-EXT-04 | P0 | PAT in hand | `curl POST /api/v1/tasks/prioritize` | 200 ranked list |
| TC-EXT-05 | P0 | PAT in hand | `curl POST /api/v1/tasks/summary` | 200 3-sentence string |
| TC-EXT-06 | P0 | PAT revoked, same Bearer | `curl GET /api/v1/tasks` | 401 |
| TC-EXT-07 | P1 | No auth header | `curl GET /api/v1/tasks` | 401 `{ error: "unauthenticated" }` |

---

## 15. Security (`tests/security/`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-SEC-01 | P0 | u1 task | u2 PAT trying `GET /api/v1/tasks/{u1-task-id}` | 404 (no info leak) |
| TC-SEC-02 | P0 | API endpoints | Inspect response headers | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` present in prod |
| TC-SEC-03 | P0 | Session cookie | Inspect | `HttpOnly`, `Secure` (prod), `SameSite=Lax` |
| TC-SEC-04 | P0 | PAT plaintext "ctd_…" | Search code | Plaintext never logged or returned after creation |
| TC-SEC-05 | P0 | Logs | Inspect any `ai_calls.jsonl` entry | No prompt / response body present |
| TC-SEC-06 | P1 | API logs | Inspect | API key value never logged |
| TC-SEC-07 | P1 | Form input | XSS payload `<script>alert(1)</script>` in title | Stored as plain text; rendered escaped on web UI |
| TC-SEC-08 | P1 | Excessive payload | `POST /api/v1/tasks` w/ 1MB body | Rejected w/ 413 |

---

## 16. CI / Static (`.github/workflows/`)

| ID | P | Given | When | Then |
|----|---|-------|------|------|
| TC-CI-01 | P0 | Open PR | CI runs | lint, typecheck, unit, E2E, CodeQL all green required for merge |
| TC-CI-02 | P0 | Open PR | CodeQL | Completes; high-severity blocks merge |
| TC-CI-03 | P0 | Merge to `main` | Deploy workflow | Builds + deploys to Azure App Service via OIDC; URL in step summary |
| TC-CI-04 | P0 | Tag `v*` pushed | Release workflow | Creates GH Release w/ auto-generated notes |
| TC-CI-05 | P1 | Dependabot patch PR | CI green | Auto-merge label honored |
| TC-CI-06 | P1 | Attempt push to `main` | Push | Rejected by branch protection |
| TC-CI-07 | P2 | OpenAPI spec changes | CI | Spectral lint of `/api/openapi.json` blocks merge if invalid |

---

## 17. Out of scope (explicitly NOT tested)

- Real Claude API calls in CI (mocked only)
- Real Google/Microsoft OAuth in CI (mocked NextAuth providers)
- Postgres path (POC is SQLite)
- Real PII patterns from production data (synthetic only)
- Load / stress testing
- Native mobile browser
- Internationalization
- Webhooks (stretch)

---

## 18. Coverage Summary

| Area | Cases | P0 | P1 | P2 |
|------|------:|---:|---:|---:|
| Storage | 12 | 8 | 3 | 1 |
| PII | 8 | 5 | 2 | 1 |
| Auth (SSO) | 10 | 7 | 2 | 1 |
| PATs | 9 | 6 | 3 | 0 |
| AI client | 10 | 7 | 2 | 1 |
| Prioritize | 7 | 4 | 2 | 1 |
| Daily summary | 4 | 2 | 1 | 1 |
| Public API handlers | 16 | 15 | 1 | 0 |
| OpenAPI spec & docs | 7 | 4 | 2 | 1 |
| E2E web UI (responsive) | 12 | 9 | 2 | 1 |
| External developer | 7 | 6 | 1 | 0 |
| Security | 8 | 5 | 3 | 0 |
| CI / Static | 7 | 4 | 2 | 1 |
| **Total** | **117** | **82** | **26** | **9** |

P0 (ship-blocker): 82 cases.

---

## 19. Review Checklist

Please mark each:

- [ ] Coverage of `PRODUCT_SPEC.md` functional requirements F-1 to F-27 is complete
- [ ] Non-functional reqs (cost ceiling, PII, audit, responsive) covered
- [ ] Each P0 case truly is ship-blocker (not over-scoped)
- [ ] Auth tests cover both Google and Microsoft paths
- [ ] PAT tests cover issue / list / revoke / use / leak prevention
- [ ] API tests check both session and Bearer auth modes
- [ ] Responsive tests cover phone, tablet, desktop widths
- [ ] Security tests cover cross-user isolation explicitly (no info leaks via 403 vs 404)
- [ ] OpenAPI spec validation included
- [ ] Out-of-scope §17 is the right line
- [ ] **Sign-off:** ready to scaffold code? (yes / no — comments?)

---

*Last updated: 2026-05-14*
