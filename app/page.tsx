import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
  // If they're already signed in, send them straight to the app.
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) redirect("/app");
  } catch {
    // No NextAuth context at build time — fine, render the landing.
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 pt-8 pb-4 sm:pt-12">
        <Link
          href="/"
          className="inline-block rounded-sm text-xl font-semibold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          ClaudeTodo
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:py-16">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            A todo app, the long way around.
          </h1>
          <p className="text-base text-neutral-600 sm:text-lg">
            ClaudeTodo is an open-source tutorial project. The product is the process: an end-to-end
            walkthrough of building a real, deployed, AI-augmented web app with Claude Code. Sign in
            to try it; read the build at{" "}
            <Link
              href="https://github.com/leongchiang/claude-todo/blob/main/TUTORIAL.md"
              className="underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-900"
            >
              TUTORIAL.md
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/api/auth/signin?callbackUrl=%2Fapp"
            data-testid="signin-cta"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-5 text-base font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Continue with Google or Microsoft
          </Link>
          <Link
            href="/api/docs"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-base font-medium text-neutral-900 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Browse the API docs
          </Link>
        </div>

        <dl className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-3 sm:pt-8">
          <div>
            <dt className="text-sm font-semibold text-neutral-900">Public REST API</dt>
            <dd className="mt-1 text-sm text-neutral-600">
              Versioned <code>/api/v1/*</code>, Bearer or session auth, rate-limited, with
              auto-generated OpenAPI 3.1 docs.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-900">AI features</dt>
            <dd className="mt-1 text-sm text-neutral-600">
              Claude-powered task prioritization and a 3-sentence daily summary, with a per-user
              cost ceiling and metadata-only audit log.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-900">Open source</dt>
            <dd className="mt-1 text-sm text-neutral-600">
              MIT.{" "}
              <Link
                href="https://github.com/leongchiang/claude-todo"
                className="underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-900"
              >
                Fork the repo
              </Link>{" "}
              and follow along.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-neutral-500">
        Built with Claude Code. License: MIT.
      </footer>
    </main>
  );
}
