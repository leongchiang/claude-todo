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
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              ClaudeTodo
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/app"
              className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Tasks
            </Link>
            <Link
              href="/app/settings"
              className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Settings
            </Link>
            <span className="mx-1 hidden h-4 w-px bg-neutral-200 sm:block" aria-hidden="true" />
            <span className="hidden max-w-32 truncate text-sm text-neutral-500 sm:inline">
              {displayName}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
