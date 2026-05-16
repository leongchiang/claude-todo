import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/v1/me/route";
import { type ApiHarness, setupApiTest } from "../helpers/api";

let h: ApiHarness;

beforeEach(() => {
  h = setupApiTest();
});
afterEach(() => h.cleanup());

const req = (init: RequestInit = {}) =>
  new Request("http://localhost/api/v1/me", init) as unknown as Parameters<typeof GET>[0];

describe("GET /api/v1/me", () => {
  it("TC-API-01: returns the current user when authenticated via Bearer", async () => {
    const res = await GET(req({ headers: h.authHeaders }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: h.userId,
      email: "test@example.com",
      display_name: "Test User",
      provider: "google",
    });
  });

  it("TC-API-02: 401 unauthenticated when no auth provided", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("unauthenticated");
  });

  it("invalid Bearer returns 401 (does not fall through to session)", async () => {
    const res = await GET(req({ headers: { authorization: "Bearer ctd_INVALIDXXXXXXXXXXXXXX" } }));
    expect(res.status).toBe(401);
  });
});
