import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { NotFoundError, PiiRejectedError, ValidationError } from "./errors";

export function errorResponse(
  code: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: code, ...(extra ?? {}) }, { status });
}

export function unauthenticated(): NextResponse {
  return errorResponse("unauthenticated", 401, {
    message: "sign in or provide a valid bearer token",
  });
}

export function notFound(message = "not found"): NextResponse {
  return errorResponse("not_found", 404, { message });
}

export function rateLimited(retryAfterSeconds: number): NextResponse {
  const res = errorResponse("rate_limited", 429, {
    message: "60 requests per minute per user",
  });
  res.headers.set("Retry-After", String(retryAfterSeconds));
  return res;
}

/**
 * Map a thrown error to a JSON response. Unknown errors get a 500 with a
 * generated `request_id` that's logged so support can trace it (TC-API-16).
 */
export function mapError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) {
    return notFound(error.message);
  }
  if (error instanceof PiiRejectedError) {
    return errorResponse("pii_rejected", 400, {
      type: error.piiType,
      message: error.message,
    });
  }
  if (error instanceof ValidationError) {
    return errorResponse("validation_error", 400, {
      message: error.message,
      ...(error.issues ? { issues: error.issues } : {}),
    });
  }
  if (error instanceof ZodError) {
    return errorResponse("validation_error", 400, {
      issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }
  const requestId = randomUUID();
  // eslint-disable-next-line no-console
  console.error(`[${requestId}]`, error);
  return errorResponse("internal", 500, { request_id: requestId });
}
