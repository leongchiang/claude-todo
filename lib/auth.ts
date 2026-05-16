import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import GoogleProvider from "next-auth/providers/google";

import type { Provider } from "./models";
import { getDb, upsertUser } from "./storage";

/**
 * NextAuth v4 raw provider name → our internal `Provider` enum.
 *
 * NextAuth still ships the Azure AD provider under `azure-ad`; Microsoft
 * has since rebranded it to "Microsoft Entra ID". The env vars and our
 * internal provider key use the new name, but the OAuth provider plug-in
 * is the old one — this mapping bridges that.
 */
export function mapProviderName(rawProvider: string): Provider | null {
  if (rawProvider === "google") return "google";
  if (rawProvider === "azure-ad") return "microsoft";
  return null;
}

// Read at module-init time but tolerate absence — Next.js evaluates this
// module during `next build` without OAuth creds. NextAuth itself surfaces
// a clearer error on the first sign-in attempt if these are blank.
const env = (name: string): string => process.env[name] ?? "";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env("AUTH_GOOGLE_ID"),
      clientSecret: env("AUTH_GOOGLE_SECRET"),
    }),
    AzureADProvider({
      clientId: env("AUTH_MICROSOFT_ENTRA_ID_ID"),
      clientSecret: env("AUTH_MICROSOFT_ENTRA_ID_SECRET"),
      tenantId: env("AUTH_MICROSOFT_ENTRA_ID_TENANT_ID") || "common",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Runs on every sign-in and every subsequent request. On first sign-in
    // we upsert the user row and stamp `token.userId`; subsequent calls
    // just preserve it.
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const provider = mapProviderName(account.provider);
        if (!provider) {
          // Unknown provider — fail closed.
          throw new Error(`unsupported OAuth provider: ${account.provider}`);
        }

        const user = upsertUser(getDb(), {
          provider,
          provider_user_id: account.providerAccountId,
          email: profile.email ?? null,
          display_name: profile.name ?? null,
        });
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};
