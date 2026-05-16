import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

import { NotFoundError, ValidationError } from "./errors";
import {
  ListTasksOptsSchema,
  type ListTasksResult,
  type NewTaskInput,
  NewTaskInputSchema,
  type Task,
} from "./models";

export type Db = Database.Database;

const SCHEMA = `
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
  const completedAt = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE tasks
       SET status = 'done', completed_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    )
    .run(completedAt, taskId, userId);

  if (result.changes === 0) {
    throw new NotFoundError(`task ${taskId} not found`);
  }

  // getTask cannot return null here because the row exists (we just updated it).
  return getTask(db, taskId, userId) as Task;
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
