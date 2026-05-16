import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { summary } from "@/lib/ai/summary";
import { resolveUser } from "@/lib/api-auth";
import { mapError, rateLimited, unauthenticated } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();
    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    const text = await summary(getDb(), auth.user_id);
    return NextResponse.json({ summary: text });
  } catch (error) {
    return mapError(error);
  }
}
