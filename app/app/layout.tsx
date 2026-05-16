import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getDb, getUserById } from "@/lib/storage";

import { SignOutButton } from "./signout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=%2Fapp");
  }

  const user = getUserById(getDb(), session.user.id);
  const displayName = user?.display_name ?? user?.email ?? "you";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:py-4">
          <Link
            href="/app"
            className="rounded-sm text-lg font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            ClaudeTodo
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/app"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              Tasks
            </Link>
            <Link
              href="/app/settings"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              Settings
            </Link>
            <span className="hidden text-sm text-neutral-500 sm:inline">{displayName}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
