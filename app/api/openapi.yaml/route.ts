import { stringify as toYaml } from "yaml";

import { buildOpenApiDocument } from "@/lib/openapi";

export async function GET() {
  const yaml = toYaml(buildOpenApiDocument());
  return new Response(yaml, {
    status: 200,
    headers: {
      "content-type": "application/yaml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
