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
    <section data-testid="ai-panel" className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPrioritize}
          disabled={pending || initialOpenCount === 0}
          aria-label="Ask Claude to rank my open tasks"
          className="inline-flex min-h-11 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Asking Claude…" : "Prioritize my tasks"}
        </button>
        <button
          type="button"
          onClick={onSummary}
          disabled={pending}
          aria-label="Ask Claude to summarise today"
          className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          Today&apos;s summary
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {summary ? (
        <p className="mt-3 text-sm text-neutral-800" data-testid="summary-result">
          {summary}
        </p>
      ) : null}
      {ranked && ranked.length > 0 ? (
        <ol className="mt-3 space-y-1 text-sm text-neutral-800" data-testid="prioritize-result">
          {ranked.map((r) => (
            <li key={r.id} className="flex items-baseline gap-2">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-neutral-200 px-1 text-xs font-medium text-neutral-900">
                {r.rank}
              </span>
              <span className="italic">{r.reason}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
