import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as meHandler } from "@/app/api/v1/me/route";
import { _resetRateLimitForTesting } from "@/lib/ratelimit";

import { type ApiHarness, setupApiTest } from "../helpers/api";

let h: ApiHarness;

beforeEach(() => {
  h = setupApiTest();
});
afterEach(() => h.cleanup());

const meReq = (headers: HeadersInit = {}) =>
  new Request("http://localhost/api/v1/me", { headers }) as unknown as Parameters<
    typeof meHandler
  >[0];

describe("TC-API-14: bearer auth is equivalent to session for resource endpoints", () => {
  it("a Bearer-authenticated /me returns 200 with the same user", async () => {
    const res = await meHandler(meReq(h.authHeaders));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(h.userId);
  });
});

describe("TC-API-15: rate limit", () => {
  it("61st request inside the same window returns 429 with Retry-After", async () => {
    _resetRateLimitForTesting();
    let last: Response = await meHandler(meReq(h.authHeaders));
    for (let i = 1; i < 61; i++) {
      last = await meHandler(meReq(h.authHeaders));
    }
    expect(last.status).toBe(429);
    expect((await last.json()).error).toBe("rate_limited");
    expect(last.headers.get("retry-after")).toMatch(/^\d+$/);
  });

  it("under the limit, requests succeed", async () => {
    _resetRateLimitForTesting();
    for (let i = 0; i < 5; i++) {
      const r = await meHandler(meReq(h.authHeaders));
      expect(r.status).toBe(200);
    }
  });
});

describe("error envelope", () => {
  it("401 has the canonical { error: 'unauthenticated', message } shape", async () => {
    const res = await meHandler(meReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthenticated");
    expect(typeof body.message).toBe("string");
  });
});
