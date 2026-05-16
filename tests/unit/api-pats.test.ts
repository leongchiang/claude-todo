import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as revokeHandler } from "@/app/api/v1/pats/[id]/route";
import { POST as issueHandler, GET as listHandler } from "@/app/api/v1/pats/route";
import { TOKEN_REGEX } from "@/lib/pats";

import { type ApiHarness, setupApiTest } from "../helpers/api";

let h: ApiHarness;

// PAT management requires a session, not a Bearer. Stub the session resolver
// via a custom auth resolver on the request — simplest path: monkey-patch
// resolveUser? Cleaner: use vi.mock to replace it.

vi.mock("@/lib/api-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-auth")>();
  return {
    ...actual,
    resolveUser: vi.fn(),
  };
});

import { resolveUser } from "@/lib/api-auth";

const asMock = (fn: typeof resolveUser) => fn as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  h = setupApiTest();
  asMock(resolveUser).mockReset();
});
afterEach(() => h.cleanup());

const patsReq = (init: RequestInit = {}) =>
  new Request("http://localhost/api/v1/pats", init) as unknown as Parameters<typeof listHandler>[0];

const patIdReq = (id: string, init: RequestInit = {}) =>
  new Request(`http://localhost/api/v1/pats/${id}`, init) as unknown as Parameters<
    typeof revokeHandler
  >[0];

const paramsP = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/v1/pats (session-only)", () => {
  it("TC-PAT-01: returns plaintext token once, format ctd_[A-Z2-7]{22}", async () => {
    asMock(resolveUser).mockResolvedValue({ user_id: h.userId });

    const res = await issueHandler(
      patsReq({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "cli" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toMatch(TOKEN_REGEX);
  });

  it("403 session_required when authenticated via Bearer (no privilege escalation)", async () => {
    asMock(resolveUser).mockResolvedValue({ user_id: h.userId, pat_id: "pat-123" });

    const res = await issueHandler(
      patsReq({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "cli" }),
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("session_required");
  });
});

describe("GET /api/v1/pats", () => {
  it("TC-PAT-02: lists pats without ever exposing plaintext / hash", async () => {
    asMock(resolveUser).mockResolvedValue({ user_id: h.userId });

    // The harness already seeded one PAT for h.userId.
    const res = await listHandler(patsReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pats.length).toBeGreaterThanOrEqual(1);
    for (const p of body.pats) {
      expect(Object.keys(p).sort()).toEqual(["created_at", "id", "last_used_at", "name"]);
    }
  });
});

describe("DELETE /api/v1/pats/[id]", () => {
  it("TC-PAT-08: owner revoke returns 204", async () => {
    asMock(resolveUser).mockResolvedValue({ user_id: h.userId });

    // Find the PAT id from the harness's seeded token.
    const list = await listHandler(patsReq());
    const { pats } = await list.json();
    const id = pats[0].id;

    const res = await revokeHandler(patIdReq(id, { method: "DELETE" }), paramsP(id));
    expect(res.status).toBe(204);
  });

  it("TC-PAT-09: revoking someone else's PAT returns 404", async () => {
    asMock(resolveUser).mockResolvedValue({ user_id: "other-user" });

    const list = await (async () => {
      asMock(resolveUser).mockResolvedValueOnce({ user_id: h.userId });
      return listHandler(patsReq());
    })();
    const { pats } = await list.json();
    const id = pats[0].id;

    asMock(resolveUser).mockResolvedValue({ user_id: "other-user" });
    const res = await revokeHandler(patIdReq(id, { method: "DELETE" }), paramsP(id));
    expect(res.status).toBe(404);
  });
});
