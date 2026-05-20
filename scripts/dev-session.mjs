// Quick dev-time helper: forge a NextAuth session cookie for a test user so
// you can browse /app and /app/settings without going through OAuth setup.
//
// Usage:
//   pnpm exec node scripts/dev-session.mjs
//
// Then paste the printed `document.cookie = "..."` line into your browser's
// DevTools console while on http://localhost:3000, refresh, and navigate to
// /app.  The cookie's JWT is valid for the default NextAuth expiry.
//
// Requires the dev server to be running with the same AUTH_SECRET and
// DATABASE_PATH this script uses (boot it from the project root with:
//   DATABASE_PATH=./data/dev-local.db \
//   AUTH_SECRET=local-dev-secret-32-chars-min-required-here \
//   NEXTAUTH_URL=http://localhost:3000 \
//   pnpm dev
// ).

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { encode } from "next-auth/jwt";

const DB_PATH = process.env.DATABASE_PATH ?? "./data/dev-local.db";
const SECRET = process.env.AUTH_SECRET ?? "local-dev-secret-32-chars-min-required-here";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    email TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (provider, provider_user_id)
  );
`;

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.exec(SCHEMA);

const provider = "google";
const providerUserId = "local-dev-user";
const id = `${provider}:${providerUserId}`;
const now = new Date().toISOString();

db.prepare(
  `INSERT INTO users (id, provider, provider_user_id, email, display_name, created_at)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(provider, provider_user_id) DO UPDATE SET
     email = excluded.email, display_name = excluded.display_name`,
).run(id, provider, providerUserId, "leon@local", "Leon (local)", now);
db.close();

const token = await encode({
  token: {
    userId: id,
    sub: id,
    name: "Leon (local)",
    email: "leon@local",
  },
  secret: SECRET,
});

console.log("\n✅ Session cookie ready.\n");
console.log("Steps:");
console.log("  1. Open http://localhost:3000/ in your browser.");
console.log("  2. Open DevTools (Cmd-Opt-I) → Console.");
console.log("  3. Paste the line below and press Enter.");
console.log("  4. Navigate to http://localhost:3000/app\n");
console.log("———————————————————————————————————————————————————————————————");
console.log(`document.cookie = "next-auth.session-token=${token}; path=/; SameSite=Lax";`);
console.log("———————————————————————————————————————————————————————————————\n");
console.log("Signed in as: Leon (local) — leon@local");
console.log(`User id:       ${id}`);
console.log(`DB:            ${DB_PATH}\n`);
