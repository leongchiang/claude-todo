import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  issuePat,
  listPats,
  PAT_LIMIT_PER_USER,
  revokePat,
  TOKEN_REGEX,
  verifyPat,
} from "@/lib/pats";
import { openDb } from "@/lib/storage";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-pats-"));
  dbPath = join(tmpDir, "test.db");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const db = () => openDb(dbPath);

describe("issuePat", () => {
  it("TC-PAT-01: returns plaintext token matching ctd_[A-Z2-7]{22}", () => {
    const pat = issuePat(db(), "u1", "cli");
    expect(pat.token).toMatch(TOKEN_REGEX);
    expect(pat.name).toBe("cli");
    expect(pat.id).toMatch(/^[0-9a-f-]{36}$/); // UUID
  });

  it("never stores the plaintext token — only the SHA-256 hash", () => {
    issuePat(db(), "u1", "cli");
    // Direct DB inspection — the column is `token_hash`, not `token`.
    const row = db().prepare("SELECT * FROM pats").get() as Record<string, unknown>;
    expect(row.token_hash).toBeDefined();
    expect(row.token_hash).not.toContain("ctd_");
    expect(Object.keys(row)).not.toContain("token");
  });

  it("rejects empty / overlong names", () => {
    expect(() => issuePat(db(), "u1", "")).toThrow(ValidationError);
    expect(() => issuePat(db(), "u1", "   ")).toThrow(ValidationError);
    expect(() => issuePat(db(), "u1", "x".repeat(101))).toThrow(ValidationError);
  });

  it(`TC-PAT-07: enforces ${PAT_LIMIT_PER_USER}-PAT cap per user`, () => {
    for (let i = 0; i < PAT_LIMIT_PER_USER; i++) {
      issuePat(db(), "u1", `pat-${i}`);
    }
    expect(() => issuePat(db(), "u1", "one-too-many")).toThrow(/too_many_pats/);
    // Other users are unaffected.
    expect(() => issuePat(db(), "u2", "fresh")).not.toThrow();
  });
});

describe("listPats", () => {
  it("TC-PAT-02: returns id/name/last_used_at/created_at — never plaintext or hash", () => {
    issuePat(db(), "u1", "cli");
    issuePat(db(), "u1", "ci");
    const pats = listPats(db(), "u1");
    expect(pats.length).toBe(2);
    for (const p of pats) {
      expect(Object.keys(p).sort()).toEqual(["created_at", "id", "last_used_at", "name"]);
    }
  });

  it("does not return other users' PATs", () => {
    issuePat(db(), "u1", "u1-cli");
    issuePat(db(), "u2", "u2-cli");
    expect(listPats(db(), "u1").map((p) => p.name)).toEqual(["u1-cli"]);
  });

  it("does not return revoked PATs", () => {
    const a = issuePat(db(), "u1", "live");
    const b = issuePat(db(), "u1", "dead");
    revokePat(db(), b.id, "u1");
    expect(listPats(db(), "u1").map((p) => p.id)).toEqual([a.id]);
  });
});

describe("verifyPat", () => {
  it("TC-PAT-03: a valid Bearer token resolves to the issuing user", () => {
    const pat = issuePat(db(), "u1", "cli");
    expect(verifyPat(db(), pat.token)).toEqual({ user_id: "u1", pat_id: pat.id });
  });

  it("TC-PAT-04: invalid Bearer returns null", () => {
    expect(verifyPat(db(), "ctd_XXXXXXXXXXXXXXXXXXXXXX")).toBeNull();
    expect(verifyPat(db(), "obviously-not-a-token")).toBeNull();
    expect(verifyPat(db(), "")).toBeNull();
  });

  it("TC-PAT-05: revoked PATs return null", () => {
    const pat = issuePat(db(), "u1", "cli");
    revokePat(db(), pat.id, "u1");
    expect(verifyPat(db(), pat.token)).toBeNull();
  });

  it("TC-PAT-06: successful verify bumps last_used_at", () => {
    const pat = issuePat(db(), "u1", "cli");
    expect(listPats(db(), "u1")[0]?.last_used_at).toBeNull();
    verifyPat(db(), pat.token);
    expect(listPats(db(), "u1")[0]?.last_used_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("revokePat", () => {
  it("TC-PAT-08: revoking own PAT soft-deletes it", () => {
    const pat = issuePat(db(), "u1", "cli");
    revokePat(db(), pat.id, "u1");
    expect(verifyPat(db(), pat.token)).toBeNull();
  });

  it("TC-PAT-09: revoking someone else's PAT throws NotFoundError (never 403)", () => {
    const pat = issuePat(db(), "u1", "cli");
    expect(() => revokePat(db(), pat.id, "u2")).toThrow(NotFoundError);
    // Original PAT still works.
    expect(verifyPat(db(), pat.token)?.user_id).toBe("u1");
  });

  it("double-revoke also throws NotFoundError", () => {
    const pat = issuePat(db(), "u1", "cli");
    revokePat(db(), pat.id, "u1");
    expect(() => revokePat(db(), pat.id, "u1")).toThrow(NotFoundError);
  });
});
