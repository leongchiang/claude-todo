"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
    >
      Sign out
    </button>
  );
}
