import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NotFoundError, ValidationError } from "@/lib/errors";
import { addTask, getTask, listTasks, markDone, openDb, softDelete } from "@/lib/storage";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "claude-todo-test-"));
  dbPath = join(tmpDir, "test.db");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const db = () => openDb(dbPath);

describe("addTask + listTasks", () => {
  it("TC-S-01: persists a task with user_id, status=open, created_at", () => {
    const task = addTask(db(), "u1", { title: "Buy milk" });

    expect(task.user_id).toBe("u1");
    expect(task.title).toBe("Buy milk");
    expect(task.status).toBe("open");
    expect(task.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(task.completed_at).toBeNull();
    expect(task.deleted_at).toBeNull();
  });

  it("TC-S-02: listTasks(u2) does not return u1's tasks", () => {
    addTask(db(), "u1", { title: "u1 task" });
    const result = listTasks(db(), "u2", {});
    expect(result.items).toEqual([]);
    expect(result.next_cursor).toBeNull();
  });
});

describe("getTask isolation", () => {
  it("TC-S-03: u2 cannot read u1's task — returns null", () => {
    const t = addTask(db(), "u1", { title: "secret" });
    expect(getTask(db(), t.id, "u2")).toBeNull();
    expect(getTask(db(), t.id, "u1")?.title).toBe("secret");
  });
});

describe("markDone", () => {
  it("TC-S-04: u2 cannot mark u1's task done — throws, row unchanged", () => {
    const t = addTask(db(), "u1", { title: "u1's" });
    expect(() => markDone(db(), t.id, "u2")).toThrow(NotFoundError);
    const after = getTask(db(), t.id, "u1");
    expect(after?.status).toBe("open");
    expect(after?.completed_at).toBeNull();
  });

  it("TC-S-05: marking done sets status + completed_at ISO UTC", () => {
    const t = addTask(db(), "u1", { title: "x" });
    const done = markDone(db(), t.id, "u1");
    expect(done.status).toBe("done");
    expect(done.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(done.completed_at?.endsWith("Z")).toBe(true);
  });
});

describe("status filter", () => {
  it("TC-S-06: done tasks are not returned when status=open", () => {
    const a = addTask(db(), "u1", { title: "a" });
    const b = addTask(db(), "u1", { title: "b" });
    markDone(db(), a.id, "u1");

    const open = listTasks(db(), "u1", { status: "open" });
    expect(open.items.map((t) => t.id)).toEqual([b.id]);

    const done = listTasks(db(), "u1", { status: "done" });
    expect(done.items.map((t) => t.id)).toEqual([a.id]);

    const all = listTasks(db(), "u1", { status: "all" });
    expect(all.items.length).toBe(2);
  });
});

describe("soft delete", () => {
  it("TC-S-07: soft-deleted tasks vanish from normal lists", () => {
    const t = addTask(db(), "u1", { title: "ephemeral" });
    softDelete(db(), t.id, "u1");

    const open = listTasks(db(), "u1", { status: "open" });
    expect(open.items).toEqual([]);

    const all = listTasks(db(), "u1", { status: "all" });
    expect(all.items).toEqual([]);

    // Row remains; getTask of own deleted task also hides it.
    expect(getTask(db(), t.id, "u1")).toBeNull();
  });

  it("soft-delete on someone else's task throws NotFoundError", () => {
    const t = addTask(db(), "u1", { title: "x" });
    expect(() => softDelete(db(), t.id, "u2")).toThrow(NotFoundError);
  });
});

describe("pagination", () => {
  it("TC-S-08: 100 tasks paginate with cursor; second page returns the rest", () => {
    for (let i = 0; i < 100; i++) {
      addTask(db(), "u1", { title: `task ${i}` });
    }

    const page1 = listTasks(db(), "u1", { limit: 50 });
    expect(page1.items.length).toBe(50);
    expect(page1.next_cursor).not.toBeNull();

    const page2 = listTasks(db(), "u1", { limit: 50, cursor: page1.next_cursor });
    expect(page2.items.length).toBe(50);
    expect(page2.next_cursor).toBeNull();

    const ids = new Set([...page1.items, ...page2.items].map((t) => t.id));
    expect(ids.size).toBe(100);
  });
});

describe("validation", () => {
  it("TC-S-09: title > 200 chars rejected, nothing persisted", () => {
    const long = "x".repeat(201);
    expect(() => addTask(db(), "u1", { title: long })).toThrow(ValidationError);
    expect(listTasks(db(), "u1", { status: "all" }).items).toEqual([]);
  });

  it("TC-S-10: empty title rejected", () => {
    expect(() => addTask(db(), "u1", { title: "" })).toThrow(ValidationError);
  });

  it("TC-S-11: notes > 2000 chars rejected", () => {
    const long = "x".repeat(2001);
    expect(() => addTask(db(), "u1", { title: "ok", notes: long })).toThrow(ValidationError);
  });
});

describe("getDb / schema bootstrap", () => {
  it("TC-S-12: schema is created on first open; second open reuses", () => {
    const t = addTask(db(), "u1", { title: "persists" });
    // New connection to the same path — schema should already be there,
    // and the row should still be readable.
    expect(getTask(openDb(dbPath), t.id, "u1")?.title).toBe("persists");
  });
});
