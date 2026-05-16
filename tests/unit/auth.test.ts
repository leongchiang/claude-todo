import { beforeEach, describe, expect, it } from "vitest";

// Stub the env vars required by lib/auth.ts at import time — they're only
// read once when authOptions builds the provider configs, and they don't
// need to be real for these pure-function tests.
beforeEach(() => {
  process.env.AUTH_GOOGLE_ID = "test";
  process.env.AUTH_GOOGLE_SECRET = "test";
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID = "test";
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET = "test";
});

describe("mapProviderName", () => {
  it("maps NextAuth's `google` to our internal `google`", async () => {
    const { mapProviderName } = await import("@/lib/auth");
    expect(mapProviderName("google")).toBe("google");
  });

  it("maps NextAuth's `azure-ad` (legacy name) to our `microsoft` (Entra ID branding)", async () => {
    const { mapProviderName } = await import("@/lib/auth");
    expect(mapProviderName("azure-ad")).toBe("microsoft");
  });

  it("returns null for unknown providers (fails closed)", async () => {
    const { mapProviderName } = await import("@/lib/auth");
    expect(mapProviderName("github")).toBeNull();
    expect(mapProviderName("")).toBeNull();
  });
});
