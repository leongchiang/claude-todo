import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/errors";
import { buildUserId, getUserById, openDb, upsertUser } from "@/lib/storage";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-users-"));
  dbPath = join(tmpDir, "test.db");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const db = () => openDb(dbPath);

describe("buildUserId", () => {
  it("composes provider:subject into a stable string id", () => {
    expect(buildUserId("google", "abc123")).toBe("google:abc123");
    expect(buildUserId("microsoft", "abc123")).toBe("microsoft:abc123");
  });
});

describe("upsertUser", () => {
  it("TC-AUTH-04: same provider + subject returns the same user.id on re-sign-in", () => {
    const first = upsertUser(db(), {
      provider: "google",
      provider_user_id: "abc123",
      email: "alice@example.com",
      display_name: "Alice",
    });
    const second = upsertUser(db(), {
      provider: "google",
      provider_user_id: "abc123",
      email: "alice@example.com",
      display_name: "Alice",
    });

    expect(first.id).toBe(second.id);
    expect(first.id).toBe("google:abc123");
    expect(first.created_at).toBe(second.created_at); // not re-stamped on conflict
  });

  it("TC-AUTH-05: same email across providers yields two distinct users", () => {
    const g = upsertUser(db(), {
      provider: "google",
      provider_user_id: "abc123",
      email: "shared@example.com",
      display_name: "Alice (Google)",
    });
    const m = upsertUser(db(), {
      provider: "microsoft",
      provider_user_id: "abc123",
      email: "shared@example.com",
      display_name: "Alice (Microsoft)",
    });

    expect(g.id).not.toBe(m.id);
    expect(g.id).toBe("google:abc123");
    expect(m.id).toBe("microsoft:abc123");
    // Both rows exist independently.
    expect(getUserById(db(), g.id)?.display_name).toBe("Alice (Google)");
    expect(getUserById(db(), m.id)?.display_name).toBe("Alice (Microsoft)");
  });

  it("updates email/display_name when the user re-signs-in with new profile data", () => {
    const initial = upsertUser(db(), {
      provider: "google",
      provider_user_id: "abc123",
      email: "alice@old.com",
      display_name: "Old Name",
    });
    const updated = upsertUser(db(), {
      provider: "google",
      provider_user_id: "abc123",
      email: "alice@new.com",
      display_name: "New Name",
    });

    expect(updated.id).toBe(initial.id);
    expect(updated.email).toBe("alice@new.com");
    expect(updated.display_name).toBe("New Name");
  });

  it("rejects unknown providers", () => {
    expect(() =>
      upsertUser(db(), {
        // biome-ignore lint/suspicious/noExplicitAny: testing the runtime validator's rejection path
        provider: "github" as any,
        provider_user_id: "abc",
        email: null,
        display_name: null,
      }),
    ).toThrow(ValidationError);
  });

  it("accepts null email and display_name (rare OAuth profiles omit them)", () => {
    const u = upsertUser(db(), {
      provider: "microsoft",
      provider_user_id: "noprofile",
      email: null,
      display_name: null,
    });
    expect(u.email).toBeNull();
    expect(u.display_name).toBeNull();
  });
});

describe("getUserById", () => {
  it("returns null for unknown id", () => {
    expect(getUserById(db(), "google:nobody")).toBeNull();
  });
});
