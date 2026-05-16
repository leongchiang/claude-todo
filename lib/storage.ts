import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

import { NotFoundError, PiiRejectedError, ValidationError } from "./errors";
import {
  ListTasksOptsSchema,
  type ListTasksResult,
  type NewTaskInput,
  NewTaskInputSchema,
  type Task,
  type UpsertUserInput,
  UpsertUserInputSchema,
  type User,
} from "./models";
import { detectPii } from "./pii";

export type Db = Database.Database;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
    provider_user_id TEXT NOT NULL,
    email TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (provider, provider_user_id)
  );

  CREATE TABLE IF NOT EXISTS ai_daily_costs (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    cost_micros INTEGER NOT NULL DEFAULT 0,
    call_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
  );

  CREATE TABLE IF NOT EXISTS pats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    last_used_at TEXT,
    created_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_pats_user_active ON pats(user_id, deleted_at);

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    created_at TEXT NOT NULL,
    completed_at TEXT,
    deleted_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_user_status_deleted
    ON tasks(user_id, status, deleted_at);
`;

/**
 * Open a database connection at `path`. Creates the schema if missing.
 * No caching — caller is responsible for connection lifecycle. For the
 * production singleton, use {@link getDb} instead.
 */
export function openDb(path: string): Db {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

let defaultDb: Db | undefined;

/**
 * Cached production database connection, keyed off `DATABASE_PATH`.
 * First call opens and bootstraps the schema; subsequent calls reuse.
 */
export function getDb(): Db {
  if (defaultDb) return defaultDb;
  const path = process.env.DATABASE_PATH;
  if (!path) throw new Error("DATABASE_PATH env var is required");
  defaultDb = openDb(path);
  return defaultDb;
}

/** Test-only: drop the cached singleton so the next `getDb()` re-resolves. */
export function _resetDefaultDbForTesting(): void {
  defaultDb = undefined;
}

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  status: "open" | "done";
  created_at: string;
  completed_at: string | null;
  deleted_at: string | null;
}

const rowToTask = (r: TaskRow): Task => ({
  id: r.id,
  user_id: r.user_id,
  title: r.title,
  notes: r.notes,
  status: r.status,
  created_at: r.created_at,
  completed_at: r.completed_at,
  deleted_at: r.deleted_at,
});

function validateNewTask(input: NewTaskInput): NewTaskInput {
  const parsed = NewTaskInputSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
    throw new ValidationError(issues[0]?.message ?? "invalid task input", issues);
  }
  return parsed.data;
}

export function addTask(db: Db, userId: string, input: NewTaskInput): Task {
  const validated = validateNewTask(input);

  // PII rejection at the storage boundary (defense in depth; the API layer
  // also rejects earlier so we can return a clean 400).
  const titlePii = detectPii(validated.title);
  if (titlePii.found) throw new PiiRejectedError(titlePii.type);
  const notesPii = detectPii(validated.notes ?? null);
  if (notesPii.found) throw new PiiRejectedError(notesPii.type);

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO tasks (id, user_id, title, notes, status, created_at)
     VALUES (?, ?, ?, ?, 'open', ?)`,
  ).run(id, userId, validated.title, validated.notes ?? null, createdAt);

  return {
    id,
    user_id: userId,
    title: validated.title,
    notes: validated.notes ?? null,
    status: "open",
    created_at: createdAt,
    completed_at: null,
    deleted_at: null,
  };
}

export function getTask(db: Db, taskId: string, userId: string): Task | null {
  const row = db
    .prepare(
      `SELECT id, user_id, title, notes, status, created_at, completed_at, deleted_at
       FROM tasks
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .get(taskId, userId) as TaskRow | undefined;
  return row ? rowToTask(row) : null;
}

interface ListInput {
  status?: "open" | "done" | "all";
  cursor?: string | null | undefined;
  limit?: number;
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const n = Number.parseInt(decoded, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError("invalid cursor");
  }
  return n;
}

function encodeCursor(rowid: number): string {
  return Buffer.from(String(rowid), "utf8").toString("base64url");
}

export function listTasks(db: Db, userId: string, opts: ListInput): ListTasksResult {
  const parsed = ListTasksOptsSchema.parse(opts);
  const cursorRowid = decodeCursor(parsed.cursor);

  const params: Array<string | number> = [userId, cursorRowid];
  let query =
    "SELECT rowid AS rowid, id, user_id, title, notes, status," +
    " created_at, completed_at, deleted_at" +
    " FROM tasks WHERE user_id = ? AND deleted_at IS NULL AND rowid > ?";

  if (parsed.status !== "all") {
    query += " AND status = ?";
    params.push(parsed.status);
  }

  query += " ORDER BY rowid ASC LIMIT ?";
  params.push(parsed.limit + 1);

  const rows = db.prepare(query).all(...params) as Array<TaskRow & { rowid: number }>;
  const hasMore = rows.length > parsed.limit;
  const page = hasMore ? rows.slice(0, parsed.limit) : rows;

  const items = page.map(rowToTask);
  const last = page.at(-1);
  const next_cursor = hasMore && last !== undefined ? encodeCursor(last.rowid) : null;

  return { items, next_cursor };
}

export function markDone(db: Db, taskId: string, userId: string): Task {
  return updateTaskStatus(db, taskId, userId, "done");
}

export function updateTaskStatus(
  db: Db,
  taskId: string,
  userId: string,
  status: "open" | "done",
): Task {
  const completedAt = status === "done" ? new Date().toISOString() : null;
  const result = db
    .prepare(
      `UPDATE tasks
       SET status = ?, completed_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .run(status, completedAt, taskId, userId);

  if (result.changes === 0) {
    throw new NotFoundError(`task ${taskId} not found`);
  }
  return getTask(db, taskId, userId) as Task;
}

export function buildUserId(provider: string, providerUserId: string): string {
  return `${provider}:${providerUserId}`;
}

interface UserRow {
  id: string;
  provider: "google" | "microsoft";
  provider_user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

const rowToUser = (r: UserRow): User => ({
  id: r.id,
  provider: r.provider,
  provider_user_id: r.provider_user_id,
  email: r.email,
  display_name: r.display_name,
  created_at: r.created_at,
});

/**
 * Insert a user on first sign-in; return the existing row on subsequent
 * sign-ins. The composite `(provider, provider_user_id)` is the natural key
 * — TC-AUTH-05: same email across providers maps to two distinct rows.
 */
export function upsertUser(db: Db, input: UpsertUserInput): User {
  const parsed = UpsertUserInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "invalid user input",
      parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  const { provider, provider_user_id, email, display_name } = parsed.data;
  const id = buildUserId(provider, provider_user_id);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, provider, provider_user_id, email, display_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, provider_user_id) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name`,
  ).run(id, provider, provider_user_id, email, display_name, createdAt);

  const row = db
    .prepare(
      `SELECT id, provider, provider_user_id, email, display_name, created_at
       FROM users WHERE id = ?`,
    )
    .get(id) as UserRow;
  return rowToUser(row);
}

/**
 * UTC `YYYY-MM-DD` string for the daily-cost ledger. Day boundaries are UTC
 * (not the user's local timezone) so the ledger matches the audit log
 * timestamps and stays consistent across regions.
 */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getDailyCostMicros(db: Db, userId: string, day: string): number {
  const row = db
    .prepare("SELECT cost_micros FROM ai_daily_costs WHERE user_id = ? AND day = ?")
    .get(userId, day) as { cost_micros: number } | undefined;
  return row?.cost_micros ?? 0;
}

/**
 * Atomic UPSERT so concurrent AI calls each contribute exactly once to the
 * day's ledger (TC-AI-10). SQLite serializes the INSERT...ON CONFLICT in a
 * single write transaction.
 */
export function recordAiCost(db: Db, userId: string, day: string, costMicros: number): void {
  db.prepare(
    `INSERT INTO ai_daily_costs (user_id, day, cost_micros, call_count)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET
       cost_micros = cost_micros + excluded.cost_micros,
       call_count = call_count + 1`,
  ).run(userId, day, costMicros);
}

export function getUserById(db: Db, userId: string): User | null {
  const row = db
    .prepare(
      `SELECT id, provider, provider_user_id, email, display_name, created_at
       FROM users WHERE id = ?`,
    )
    .get(userId) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function softDelete(db: Db, taskId: string, userId: string): void {
  const deletedAt = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE tasks
       SET deleted_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .run(deletedAt, taskId, userId);

  if (result.changes === 0) {
    throw new NotFoundError(`task ${taskId} not found`);
  }
}
