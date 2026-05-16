import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveUser } from "@/lib/api-auth";
import { errorResponse, mapError, rateLimited, unauthenticated } from "@/lib/api-errors";
import { issuePat, listPats } from "@/lib/pats";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/storage";

const IssueSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();
    // PAT management endpoints require a real session (TC-PAT spirit: don't
    // let a PAT issue more PATs); reject if this request authenticated via
    // a bearer token.
    if (auth.pat_id !== undefined) {
      return errorResponse("session_required", 403, {
        message: "PAT management requires a session, not a bearer token",
      });
    }
    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    return NextResponse.json({ pats: listPats(getDb(), auth.user_id) });
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const input = IssueSchema.parse(body);
    const pat = issuePat(getDb(), auth.user_id, input.name);
    return NextResponse.json(pat, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
