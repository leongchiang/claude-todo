import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DELETE as deleteTaskHandler,
  GET as getTaskHandler,
  PATCH as patchTaskHandler,
} from "@/app/api/v1/tasks/[id]/route";
import { POST as createTaskHandler, GET as listTasksHandler } from "@/app/api/v1/tasks/route";
import { addTask } from "@/lib/storage";

import { type ApiHarness, setupApiTest } from "../helpers/api";

let h: ApiHarness;

beforeEach(() => {
  h = setupApiTest();
});
afterEach(() => h.cleanup());

const tasksReq = (init: RequestInit = {}) =>
  new Request("http://localhost/api/v1/tasks", init) as unknown as Parameters<
    typeof listTasksHandler
  >[0];

const taskByIdReq = (id: string, init: RequestInit = {}) =>
  new Request(`http://localhost/api/v1/tasks/${id}`, init) as unknown as Parameters<
    typeof getTaskHandler
  >[0];

const paramsP = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/v1/tasks", () => {
  it("TC-API-03: 201, Location header, body is the new task", async () => {
    const res = await createTaskHandler(
      tasksReq({
        method: "POST",
        headers: { ...h.authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("Buy milk");
    expect(body.user_id).toBe(h.userId);
    expect(res.headers.get("location")).toBe(`/api/v1/tasks/${body.id}`);
  });

  it("TC-API-04: 400 with Zod issues when title missing", async () => {
    const res = await createTaskHandler(
      tasksReq({
        method: "POST",
        headers: { ...h.authHeaders, "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation_error");
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it("TC-API-05: 400 pii_rejected when title contains email", async () => {
    const res = await createTaskHandler(
      tasksReq({
        method: "POST",
        headers: { ...h.authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ title: "email me at bob@bob.com" }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("pii_rejected");
    expect(body.type).toBe("email");
  });
});

describe("GET /api/v1/tasks", () => {
  it("TC-API-06: returns paginated, user-scoped list", async () => {
    addTask(h.db, h.userId, { title: "mine" });

    const res = await listTasksHandler(tasksReq({ headers: h.authHeaders }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    expect(body.items[0].title).toBe("mine");
    expect(body.next_cursor).toBeNull();
  });

  it("does not return other users' tasks", async () => {
    // Add a task as the test user, then look up via a different user id —
    // here we just query a tasks list for a non-existent user via a fake
    // PAT scenario by using listTasks directly is overkill; instead seed
    // both and verify our caller sees only theirs.
    addTask(h.db, h.userId, { title: "mine" });
    addTask(h.db, "other-user", { title: "not mine" });

    const res = await listTasksHandler(tasksReq({ headers: h.authHeaders }));
    const body = await res.json();
    expect(body.items.map((t: { title: string }) => t.title)).toEqual(["mine"]);
  });
});

describe("PATCH /api/v1/tasks/[id]", () => {
  it("TC-API-07: owner can update status to done", async () => {
    const t = addTask(h.db, h.userId, { title: "x" });
    const res = await patchTaskHandler(
      taskByIdReq(t.id, {
        method: "PATCH",
        headers: { ...h.authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      }),
      paramsP(t.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("TC-API-08: non-owner gets 404 (never 403 — don't leak existence)", async () => {
    // Make a task owned by a different user.
    const t = addTask(h.db, "another-user", { title: "secret" });
    const res = await patchTaskHandler(
      taskByIdReq(t.id, {
        method: "PATCH",
        headers: { ...h.authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      }),
      paramsP(t.id),
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/tasks/[id]", () => {
  it("TC-API-09: owner soft-deletes, returns 204", async () => {
    const t = addTask(h.db, h.userId, { title: "x" });
    const res = await deleteTaskHandler(
      taskByIdReq(t.id, { method: "DELETE", headers: h.authHeaders }),
      paramsP(t.id),
    );
    expect(res.status).toBe(204);

    // Subsequent GET shows 404 (soft-deleted is invisible).
    const after = await getTaskHandler(
      taskByIdReq(t.id, { headers: h.authHeaders }),
      paramsP(t.id),
    );
    expect(after.status).toBe(404);
  });
});

describe("GET /api/v1/tasks/[id]", () => {
  it("returns the task when owned", async () => {
    const t = addTask(h.db, h.userId, { title: "fetch me" });
    const res = await getTaskHandler(taskByIdReq(t.id, { headers: h.authHeaders }), paramsP(t.id));
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("fetch me");
  });

  it("404 for non-owner", async () => {
    const t = addTask(h.db, "another-user", { title: "secret" });
    const res = await getTaskHandler(taskByIdReq(t.id, { headers: h.authHeaders }), paramsP(t.id));
    expect(res.status).toBe(404);
  });
});
