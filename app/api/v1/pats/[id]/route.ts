import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/api-auth";
import { errorResponse, mapError, rateLimited, unauthenticated } from "@/lib/api-errors";
import { revokePat } from "@/lib/pats";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();
    if (auth.pat_id !== undefined) {
      return errorResponse("session_required", 403, {
        message: "PAT management requires a session, not a bearer token",
      });
    }
    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    const { id } = await params;
    revokePat(getDb(), id, auth.user_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return mapError(error);
  }
}
