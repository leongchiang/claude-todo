import { getServerSession } from "next-auth";

import { authOptions } from "./auth";
import { verifyPat } from "./pats";
import { type Db, getDb } from "./storage";

export interface AuthenticatedUser {
  user_id: string;
  /** Set when the request authenticated via a PAT — useful for audit logs. */
  pat_id?: string;
}

/**
 * Tests inject a stub here to avoid pulling NextAuth's request-context
 * machinery into vitest. Production code uses the default below.
 */
export type SessionResolver = () => Promise<AuthenticatedUser | null>;

async function defaultSessionResolver(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return { user_id: session.user.id };
  } catch {
    // No cookie context, no NEXTAUTH_URL set, etc. — treat as anonymous.
  }
  return null;
}

/**
 * Bearer token takes precedence over session — that mirrors how curl users
 * pass `Authorization` while a browser cookie is also incidentally present.
 * Returns `null` when neither path resolves.
 */
export async function resolveUser(
  req: Request,
  options: { db?: Db; sessionResolver?: SessionResolver } = {},
): Promise<AuthenticatedUser | null> {
  const db = options.db ?? getDb();
  const sessionResolver = options.sessionResolver ?? defaultSessionResolver;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    const pat = verifyPat(db, token);
    if (pat) return { user_id: pat.user_id, pat_id: pat.pat_id };
    return null; // Bearer was presented but invalid — don't fall through to session
  }

  return sessionResolver();
}
