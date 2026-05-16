import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/api-auth";
import { mapError, rateLimited, unauthenticated } from "@/lib/api-errors";
import { NewTaskInputSchema } from "@/lib/models";
import { checkRateLimit } from "@/lib/ratelimit";
import { addTask, getDb, listTasks } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();
    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const result = listTasks(getDb(), auth.user_id, {
      ...(status !== undefined ? { status: status as "open" | "done" | "all" } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
    return NextResponse.json(result);
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();
    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    const body = await req.json();
    const input = NewTaskInputSchema.parse(body);
    const task = addTask(getDb(), auth.user_id, input);
    return NextResponse.json(task, {
      status: 201,
      headers: { Location: `/api/v1/tasks/${task.id}` },
    });
  } catch (error) {
    return mapError(error);
  }
}
