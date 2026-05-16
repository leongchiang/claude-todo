import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { resolveUser } from "@/lib/api-auth";
import { mapError, notFound, rateLimited, unauthenticated } from "@/lib/api-errors";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDb, getUserById } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveUser(req);
    if (!auth) return unauthenticated();

    const rl = checkRateLimit(auth.user_id);
    if (!rl.allowed) return rateLimited(rl.retryAfterSeconds);

    const user = getUserById(getDb(), auth.user_id);
    if (!user) return notFound("user");

    return NextResponse.json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      provider: user.provider,
    });
  } catch (error) {
    return mapError(error);
  }
}
