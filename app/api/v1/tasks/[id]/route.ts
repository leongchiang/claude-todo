import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveUser } from "@/lib/api-auth";
import { mapError, notFound, rateLimited, unauthenticated } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb, getTask, softDelete, updateTaskStatus } from "@/lib/storage";

const PatchSchema = z.object({
  status: z.enum(["open", "done"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function gate(req: NextRequest) {
  const auth = await resolveUser(req);
  if (!auth) return { response: unauthenticated() };
  const rl = checkRateLimit(auth.user_id);
  if (!rl.allowed) return { response: rateLimited(rl.retryAfterSeconds) };
  return { auth };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const g = await gate(req);
    if ("response" in g) return g.response;

    const { id } = await params;
    const task = getTask(getDb(), id, g.auth.user_id);
    if (!task) return notFound("task");
    return NextResponse.json(task);
  } catch (error) {
    return mapError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const g = await gate(req);
    if ("response" in g) return g.response;

    const { id } = await params;
    const body = await req.json();
    const input = PatchSchema.parse(body);
    const task = updateTaskStatus(getDb(), id, g.auth.user_id, input.status);
    return NextResponse.json(task);
  } catch (error) {
    return mapError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const g = await gate(req);
    if ("response" in g) return g.response;

    const { id } = await params;
    softDelete(getDb(), id, g.auth.user_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return mapError(error);
  }
}
