import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

import { openDb, upsertUser } from "@/lib/storage";

const TEST_DB_PATH = process.env.DATABASE_PATH ?? "./data/playwright.db";
const TEST_SECRET = process.env.AUTH_SECRET ?? "playwright-test-secret-32-chars-min-required-here";

interface SignInOptions {
  providerUserId?: string;
  email?: string;
  displayName?: string;
}

/**
 * Forge a NextAuth-compatible session for a Playwright `BrowserContext`. The
 * user is upserted into the test SQLite at `DATABASE_PATH` (the same path
 * the dev server reads from), and a JWT signed with `AUTH_SECRET` is dropped
 * into the `next-auth.session-token` cookie.
 *
 * This is the test-time analogue of completing the real OAuth dance — gives
 * Playwright authenticated access without mocking the OAuth providers.
 */
export async function signInAsTestUser(
  context: BrowserContext,
  opts: SignInOptions = {},
): Promise<{ userId: string }> {
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true });
  const db = openDb(TEST_DB_PATH);
  const user = upsertUser(db, {
    provider: "google",
    provider_user_id: opts.providerUserId ?? `test-${Date.now()}`,
    email: opts.email ?? "test@example.com",
    display_name: opts.displayName ?? "Test User",
  });
  db.close();

  const token = await encode({
    token: {
      userId: user.id,
      sub: user.id,
      name: opts.displayName ?? "Test User",
      email: opts.email ?? "test@example.com",
    },
    secret: TEST_SECRET,
  });

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  return { userId: user.id };
}
