import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { issuePat } from "@/lib/pats";
import { _resetRateLimitForTesting } from "@/lib/ratelimit";
import { _resetDefaultDbForTesting, type Db, getDb, upsertUser } from "@/lib/storage";

export interface ApiHarness {
  tmpDir: string;
  dbPath: string;
  db: Db;
  userId: string;
  token: string;
  authHeaders: Record<string, string>;
  cleanup: () => void;
}

/**
 * Spin up a temp SQLite, seed a user + PAT, and produce a Bearer header
 * ready to drop into a NextRequest. Cleans up the temp dir on `cleanup()`.
 */
export function setupApiTest(opts: { userId?: string; userEmail?: string } = {}): ApiHarness {
  const tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-api-"));
  const dbPath = join(tmpDir, "test.db");
  process.env.DATABASE_PATH = dbPath;
  _resetDefaultDbForTesting();
  _resetRateLimitForTesting();

  const db = getDb();

  const user = upsertUser(db, {
    provider: "google",
    provider_user_id: opts.userId ?? "test-user-1",
    email: opts.userEmail ?? "test@example.com",
    display_name: "Test User",
  });

  const pat = issuePat(db, user.id, "test-harness");

  return {
    tmpDir,
    dbPath,
    db,
    userId: user.id,
    token: pat.token,
    authHeaders: { authorization: `Bearer ${pat.token}` },
    cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
  };
}
