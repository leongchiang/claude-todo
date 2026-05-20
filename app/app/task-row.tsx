"use client";

import { useTransition } from "react";

import { markStatusAction, softDeleteAction } from "./actions";

interface Props {
  id: string;
  title: string;
  notes: string | null;
  status: "open" | "done";
  reason?: string;
  rank?: number;
}

export function TaskRow({ id, title, notes, status, reason, rank }: Props) {
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      await markStatusAction(id, status === "open" ? "done" : "open");
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      await softDeleteAction(id);
    });
  };

  const isOpen = status === "open";

  return (
    <li
      data-testid="task-row"
      data-status={status}
      className={`flex flex-col gap-2 rounded-lg border p-3 pl-4 sm:flex-row sm:items-start sm:justify-between ${
        isOpen
          ? "border-neutral-200 border-l-2 border-l-indigo-400 bg-white"
          : "border-neutral-100 bg-neutral-50"
      }`}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {rank !== undefined ? (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-indigo-600 px-1 text-xs font-semibold text-white">
              {rank}
            </span>
          ) : null}
          <p
            className={`text-base leading-snug ${
              isOpen ? "font-medium text-neutral-900" : "text-neutral-400 line-through"
            }`}
          >
            {title}
          </p>
        </div>
        {notes ? <p className="pl-0 text-sm text-neutral-500">{notes}</p> : null}
        {reason ? (
          <p className="text-sm italic text-indigo-600" data-testid="task-reason">
            {reason}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-label={isOpen ? `Mark "${title}" done` : `Reopen "${title}"`}
          className={`inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 ${
            isOpen
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {isOpen ? "✓ Done" : "Reopen"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label={`Delete "${title}"`}
          className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
        >
          ×
        </button>
      </div>
    </li>
  );
}
