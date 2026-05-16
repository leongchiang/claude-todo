import { createHash, randomBytes, randomUUID } from "node:crypto";

import { NotFoundError, ValidationError } from "./errors";
import type { Db } from "./storage";

export const PAT_LIMIT_PER_USER = 20;

const TOKEN_PREFIX = "ctd_";
const TOKEN_LENGTH = 22; // chars after the prefix
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOKEN_REGEX = /^ctd_[A-Z2-7]{22}$/;

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function generateToken(): string {
  // 14 random bytes → 23 base32 chars (lossless). Truncate to 22 for a
  // round-numbered token; that leaves ~110 bits of entropy, well above
  // brute-force range.
  const encoded = base32Encode(randomBytes(14)).slice(0, TOKEN_LENGTH);
  return `${TOKEN_PREFIX}${encoded}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface IssuedPat {
  id: string;
  name: string;
  token: string;
  created_at: string;
}

export interface PatRecord {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

interface PatRow {
  id: string;
  user_id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export function issuePat(db: Db, userId: string, name: string): IssuedPat {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new ValidationError("PAT name must be 1–100 characters");
  }

  const active = db
    .prepare("SELECT COUNT(*) as n FROM pats WHERE user_id = ? AND deleted_at IS NULL")
    .get(userId) as { n: number };
  if (active.n >= PAT_LIMIT_PER_USER) {
    throw new ValidationError("too_many_pats");
  }

  const id = randomUUID();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO pats (id, user_id, name, token_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, userId, trimmed, tokenHash, createdAt);

  return { id, name: trimmed, token, created_at: createdAt };
}

export function listPats(db: Db, userId: string): PatRecord[] {
  const rows = db
    .prepare(
      `SELECT id, name, last_used_at, created_at
       FROM pats
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
    )
    .all(userId) as Array<Omit<PatRow, "user_id">>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    last_used_at: r.last_used_at,
    created_at: r.created_at,
  }));
}

export interface VerifiedPat {
  user_id: string;
  pat_id: string;
}

/**
 * Verify a bearer token. Returns `null` on any mismatch — invalid format,
 * unknown hash, revoked PAT. On success: bumps `last_used_at` (TC-PAT-06).
 */
export function verifyPat(db: Db, token: string): VerifiedPat | null {
  if (!TOKEN_REGEX.test(token)) return null;

  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT id, user_id FROM pats
       WHERE token_hash = ? AND deleted_at IS NULL`,
    )
    .get(tokenHash) as { id: string; user_id: string } | undefined;

  if (!row) return null;

  db.prepare("UPDATE pats SET last_used_at = ? WHERE id = ?").run(new Date().toISOString(), row.id);

  return { user_id: row.user_id, pat_id: row.id };
}

/**
 * Soft-delete a PAT owned by `userId`. Throws `NotFoundError` if the PAT
 * doesn't exist or belongs to someone else — TC-PAT-09 says never leak
 * existence with a 403.
 */
export function revokePat(db: Db, patId: string, userId: string): void {
  const result = db
    .prepare(
      `UPDATE pats SET deleted_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .run(new Date().toISOString(), patId, userId);

  if (result.changes === 0) {
    throw new NotFoundError(`PAT ${patId} not found`);
  }
}
