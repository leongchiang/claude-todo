import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import { GET as docsHandler } from "@/app/api/docs/route";
import { GET as jsonHandler } from "@/app/api/openapi.json/route";
import { GET as yamlHandler } from "@/app/api/openapi.yaml/route";
import { buildOpenApiDocument } from "@/lib/openapi";

describe("buildOpenApiDocument", () => {
  it("TC-OAS-01: produces a valid OpenAPI 3.1 envelope", () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("ClaudeTodo API");
    expect(doc.info.version).toBeTruthy();
    expect(Array.isArray(doc.servers)).toBe(true);
  });

  it("TC-OAS-01: documents every /api/v1 path the spec lists", () => {
    const doc = buildOpenApiDocument();
    const paths = Object.keys(doc.paths ?? {});
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/v1/me",
        "/api/v1/tasks",
        "/api/v1/tasks/{id}",
        "/api/v1/pats",
        "/api/v1/pats/{id}",
      ]),
    );
  });

  it("TC-OAS-02: every operation declares security and at least one response", () => {
    const doc = buildOpenApiDocument();
    for (const [path, item] of Object.entries(doc.paths ?? {})) {
      for (const method of ["get", "post", "patch", "delete"] as const) {
        const op = (item as Record<string, unknown>)[method] as
          | { security?: unknown; responses?: Record<string, unknown> }
          | undefined;
        if (!op) continue;
        expect(op.security, `${method.toUpperCase()} ${path} security`).toBeTruthy();
        expect(
          Object.keys(op.responses ?? {}).length,
          `${method.toUpperCase()} ${path} responses`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("TC-OAS-02: registers both Session + Bearer security schemes", () => {
    const doc = buildOpenApiDocument();
    const schemes = doc.components?.securitySchemes ?? {};
    expect(schemes).toHaveProperty("Session");
    expect(schemes).toHaveProperty("Bearer");
  });

  it("TC-OAS-06: server URL defaults to localhost:3000 in dev", () => {
    // Test runs without PUBLIC_BASE_URL set in beforeEach for this file.
    const prior = process.env.PUBLIC_BASE_URL;
    const prior2 = process.env.NEXTAUTH_URL;
    delete process.env.PUBLIC_BASE_URL;
    delete process.env.NEXTAUTH_URL;
    try {
      const doc = buildOpenApiDocument();
      expect(doc.servers?.[0]?.url).toBe("http://localhost:3000");
    } finally {
      if (prior !== undefined) process.env.PUBLIC_BASE_URL = prior;
      if (prior2 !== undefined) process.env.NEXTAUTH_URL = prior2;
    }
  });

  it("TC-OAS-06: server URL honors PUBLIC_BASE_URL when set", () => {
    const prior = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = "https://claudetodo.azurewebsites.net";
    try {
      const doc = buildOpenApiDocument();
      expect(doc.servers?.[0]?.url).toBe("https://claudetodo.azurewebsites.net");
    } finally {
      if (prior === undefined) delete process.env.PUBLIC_BASE_URL;
      else process.env.PUBLIC_BASE_URL = prior;
    }
  });
});

describe("GET /api/openapi.json", () => {
  it("returns the spec as JSON", async () => {
    const res = await jsonHandler();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
  });
});

describe("GET /api/openapi.yaml", () => {
  it("TC-OAS-04: returns a YAML body that round-trips to the same JSON spec", async () => {
    const res = await yamlHandler();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^application\/yaml/);
    const text = await res.text();
    const parsed = parseYaml(text);
    expect(parsed.openapi).toBe("3.1.0");
    expect(parsed.paths["/api/v1/tasks"]).toBeDefined();
  });
});

describe("GET /api/docs", () => {
  it("TC-OAS-03: returns HTML with Scalar's references mount", async () => {
    const res = await docsHandler();
    expect(res.status).toBe(200);
    const ct = res.headers.get("content-type") ?? "";
    expect(ct).toMatch(/text\/html/);
    const html = await res.text();
    // Scalar's bundle references either /api/openapi.json (data-url) or
    // injects a script that does. Both lead to "/api/openapi.json" appearing
    // somewhere in the HTML.
    expect(html).toContain("/api/openapi.json");
  });
});
