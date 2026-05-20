"use client";

import { useState, useTransition } from "react";

import type { RankedTask } from "@/lib/ai/prioritize";

import { type ActionResult, prioritizeAction, summaryAction } from "./actions";

interface Props {
  initialOpenCount: number;
}

function aiErrorMessage(result: ActionResult<unknown> | null): string | null {
  if (!result || result.ok) return null;
  switch (result.error) {
    case "ai_unavailable":
      return "AI is unavailable right now. Check that ANTHROPIC_API_KEY is set on the server.";
    case "cost_ceiling_exceeded":
      return "Daily AI cost ceiling reached for your account. Try again tomorrow.";
    case "ai_response_invalid":
      return "Claude returned something we couldn't parse. Try again in a moment.";
    default:
      return "Something went wrong calling Claude.";
  }
}

export function AiPanel({ initialOpenCount }: Props) {
  const [ranked, setRanked] = useState<RankedTask[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onPrioritize = () => {
    setError(null);
    startTransition(async () => {
      const result = await prioritizeAction();
      if (result.ok) setRanked(result.data);
      else setError(aiErrorMessage(result));
    });
  };

  const onSummary = () => {
    setError(null);
    startTransition(async () => {
      const result = await summaryAction();
      if (result.ok) setSummary(result.data);
      else setError(aiErrorMessage(result));
    });
  };

  return (
    <section
      data-testid="ai-panel"
      className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-indigo-500" aria-hidden="true">
          ✦
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Claude AI
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPrioritize}
          disabled={pending || initialOpenCount === 0}
          aria-label="Ask Claude to rank my open tasks"
          className="inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Asking Claude…" : "Prioritize my tasks"}
        </button>
        <button
          type="button"
          onClick={onSummary}
          disabled={pending}
          aria-label="Ask Claude to summarise today"
          className="inline-flex min-h-10 items-center rounded-lg border border-indigo-200 bg-white px-4 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          Today&apos;s summary
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {summary ? (
        <p
          className="mt-3 rounded-lg border border-indigo-100 bg-white p-3 text-sm leading-relaxed text-neutral-800"
          data-testid="summary-result"
        >
          {summary}
        </p>
      ) : null}
      {ranked && ranked.length > 0 ? (
        <ol className="mt-3 space-y-1.5 text-sm text-neutral-800" data-testid="prioritize-result">
          {ranked.map((r) => (
            <li key={r.id} className="flex items-baseline gap-2">
              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-indigo-600 px-1 text-xs font-semibold text-white">
                {r.rank}
              </span>
              <span className="text-neutral-700 italic">{r.reason}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
