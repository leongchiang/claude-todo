import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function LandingPage() {
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
          className="inline-flex items-center gap-1.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
          <span className="text-xl font-semibold tracking-tight">ClaudeTodo</span>
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10 sm:py-20">
        <div className="space-y-5">
          <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Open-source tutorial
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            A todo app,
            <br className="hidden sm:block" /> the long way around.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            An end-to-end walkthrough of building a real, deployed, AI-augmented web app with Claude
            Code. Sign in to try it; read the build at{" "}
            <Link
              href="https://github.com/leongchiang/claude-todo/blob/main/TUTORIAL.md"
              className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600"
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
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-base font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Sign in with Google or Microsoft
          </Link>
          <Link
            href="/api/docs"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Browse the API docs
          </Link>
        </div>

        <dl className="grid grid-cols-1 gap-6 border-t border-neutral-200 pt-8 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              Public REST API
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-neutral-600">
              Versioned{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/api/v1/*</code>, Bearer
              or session auth, rate-limited, OpenAPI 3.1 docs.
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              Claude AI features
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-neutral-600">
              Task prioritization and daily summary, with a per-user cost ceiling and metadata-only
              audit log.
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
              Open source
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-neutral-600">
              MIT.{" "}
              <Link
                href="https://github.com/leongchiang/claude-todo"
                className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600"
              >
                Fork the repo
              </Link>{" "}
              and follow the tutorial.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-xs text-neutral-400">
        Built with Claude Code · MIT license
      </footer>
    </main>
  );
}
