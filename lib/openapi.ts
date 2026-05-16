import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { NewTaskInputSchema, ProviderSchema, TaskSchema, TaskStatusSchema } from "./models";

// ---------- response shapes (API-only, not in models.ts) ----------

const MeResponseSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  display_name: z.string().nullable(),
  provider: ProviderSchema,
});

const TaskListResponseSchema = z.object({
  items: z.array(TaskSchema),
  next_cursor: z.string().nullable(),
});

const TaskPatchSchema = z.object({ status: TaskStatusSchema });

const PatRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  last_used_at: z.string().nullable(),
  created_at: z.string(),
});

const PatListResponseSchema = z.object({ pats: z.array(PatRecordSchema) });

const IssuedPatSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  token: z.string().regex(/^ctd_[A-Z2-7]{22}$/),
  created_at: z.string(),
});

const NewPatInputSchema = z.object({ name: z.string().min(1).max(100) });

const RankedTaskSchema = z.object({
  id: z.string().uuid(),
  rank: z.number().int().min(1),
  reason: z.string(),
});
const PrioritizeResponseSchema = z.object({ tasks: z.array(RankedTaskSchema) });

const SummaryResponseSchema = z.object({ summary: z.string() });

const ErrorSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .catchall(z.unknown());

const TasksQuerySchema = z.object({
  status: z.enum(["open", "done", "all"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const IdParamsSchema = z.object({ id: z.string().uuid() });

// ---------- registry ----------

function buildRegistry(): OpenAPIRegistry {
  const r = new OpenAPIRegistry();

  // Reusable named components — zod-to-openapi emits $ref to these in paths.
  r.register("Task", TaskSchema);
  r.register("NewTaskInput", NewTaskInputSchema);
  r.register("TaskPatchInput", TaskPatchSchema);
  r.register("TaskListResponse", TaskListResponseSchema);
  r.register("MeResponse", MeResponseSchema);
  r.register("Pat", PatRecordSchema);
  r.register("PatListResponse", PatListResponseSchema);
  r.register("IssuedPat", IssuedPatSchema);
  r.register("NewPatInput", NewPatInputSchema);
  r.register("Error", ErrorSchema);
  r.register("RankedTask", RankedTaskSchema);
  r.register("PrioritizeResponse", PrioritizeResponseSchema);
  r.register("SummaryResponse", SummaryResponseSchema);

  r.registerComponent("securitySchemes", "Session", {
    type: "apiKey",
    in: "cookie",
    name: "next-auth.session-token",
    description: "NextAuth v4 session cookie. Use the web sign-in flow at /api/auth/signin.",
  });
  r.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "ctd_*",
    description: "Personal Access Token. Issue via POST /api/v1/pats (session-only).",
  });

  const auth = [{ Session: [] }, { Bearer: [] }];
  const sessionOnly = [{ Session: [] }];

  const errorResponse = {
    description: "error",
    content: { "application/json": { schema: ErrorSchema } },
  };

  r.registerPath({
    method: "get",
    path: "/api/v1/me",
    summary: "Get the current user",
    tags: ["me"],
    security: auth,
    responses: {
      200: {
        description: "current user",
        content: { "application/json": { schema: MeResponseSchema } },
      },
      401: errorResponse,
      429: errorResponse,
    },
  });

  r.registerPath({
    method: "get",
    path: "/api/v1/tasks",
    summary: "List the caller's tasks",
    tags: ["tasks"],
    security: auth,
    request: { query: TasksQuerySchema },
    responses: {
      200: {
        description: "paginated tasks",
        content: { "application/json": { schema: TaskListResponseSchema } },
      },
      401: errorResponse,
      429: errorResponse,
    },
  });

  r.registerPath({
    method: "post",
    path: "/api/v1/tasks",
    summary: "Create a task",
    tags: ["tasks"],
    security: auth,
    request: {
      body: { content: { "application/json": { schema: NewTaskInputSchema } } },
    },
    responses: {
      201: {
        description: "created",
        content: { "application/json": { schema: TaskSchema } },
        headers: {
          Location: {
            description: "absolute path to the new task",
            schema: { type: "string" },
          },
        },
      },
      400: errorResponse,
      401: errorResponse,
      429: errorResponse,
    },
  });

  r.registerPath({
    method: "get",
    path: "/api/v1/tasks/{id}",
    summary: "Get one task",
    tags: ["tasks"],
    security: auth,
    request: { params: IdParamsSchema },
    responses: {
      200: { description: "task", content: { "application/json": { schema: TaskSchema } } },
      401: errorResponse,
      404: errorResponse,
    },
  });

  r.registerPath({
    method: "patch",
    path: "/api/v1/tasks/{id}",
    summary: "Update task status (open ↔ done)",
    tags: ["tasks"],
    security: auth,
    request: {
      params: IdParamsSchema,
      body: { content: { "application/json": { schema: TaskPatchSchema } } },
    },
    responses: {
      200: { description: "updated", content: { "application/json": { schema: TaskSchema } } },
      400: errorResponse,
      401: errorResponse,
      404: errorResponse,
    },
  });

  r.registerPath({
    method: "delete",
    path: "/api/v1/tasks/{id}",
    summary: "Soft-delete a task",
    tags: ["tasks"],
    security: auth,
    request: { params: IdParamsSchema },
    responses: {
      204: { description: "deleted" },
      401: errorResponse,
      404: errorResponse,
    },
  });

  r.registerPath({
    method: "get",
    path: "/api/v1/pats",
    summary: "List the caller's PATs",
    tags: ["pats"],
    security: sessionOnly,
    responses: {
      200: {
        description: "pats",
        content: { "application/json": { schema: PatListResponseSchema } },
      },
      401: errorResponse,
      403: errorResponse,
    },
  });

  r.registerPath({
    method: "post",
    path: "/api/v1/pats",
    summary: "Issue a new PAT (returns plaintext once)",
    tags: ["pats"],
    security: sessionOnly,
    request: {
      body: { content: { "application/json": { schema: NewPatInputSchema } } },
    },
    responses: {
      201: {
        description: "issued",
        content: { "application/json": { schema: IssuedPatSchema } },
      },
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
  });

  r.registerPath({
    method: "delete",
    path: "/api/v1/pats/{id}",
    summary: "Revoke a PAT (soft delete)",
    tags: ["pats"],
    security: sessionOnly,
    request: { params: IdParamsSchema },
    responses: {
      204: { description: "revoked" },
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
  });

  r.registerPath({
    method: "post",
    path: "/api/v1/tasks/prioritize",
    summary: "Claude-ranked list of the caller's open tasks (top 50)",
    tags: ["ai"],
    security: auth,
    responses: {
      200: {
        description: "ranked tasks",
        content: { "application/json": { schema: PrioritizeResponseSchema } },
      },
      401: errorResponse,
      429: errorResponse,
      502: errorResponse,
      503: errorResponse,
    },
  });

  r.registerPath({
    method: "post",
    path: "/api/v1/tasks/summary",
    summary: "Three-sentence Claude recap of tasks completed today",
    tags: ["ai"],
    security: auth,
    responses: {
      200: {
        description: "summary",
        content: { "application/json": { schema: SummaryResponseSchema } },
      },
      401: errorResponse,
      429: errorResponse,
      502: errorResponse,
      503: errorResponse,
    },
  });

  return r;
}

function serverUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/**
 * Build the full OpenAPI 3.1 document. Called on every request — the schema
 * set is small and generation is ~1ms, so dev edits show up without restart.
 */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(buildRegistry().definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "ClaudeTodo API",
      version: "0.1.0",
      description:
        "Public REST API for ClaudeTodo. See https://github.com/leongchiang/claude-todo for the tutorial.",
      license: { name: "MIT" },
    },
    servers: [{ url: serverUrl() }],
    tags: [
      { name: "me", description: "Current user" },
      { name: "tasks", description: "Tasks CRUD" },
      { name: "pats", description: "Personal Access Tokens (session-only)" },
      { name: "ai", description: "Claude-powered features (prioritize, summary)" },
    ],
  });
}
