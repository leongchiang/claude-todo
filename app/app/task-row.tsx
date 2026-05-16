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

  return (
    <li
      data-testid="task-row"
      data-status={status}
      className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          {rank !== undefined ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-neutral-900 px-1 text-xs font-medium text-white">
              {rank}
            </span>
          ) : null}
          <p
            className={`text-sm sm:text-base ${
              status === "done" ? "text-neutral-500 line-through" : "text-neutral-900"
            }`}
          >
            {title}
          </p>
        </div>
        {notes ? <p className="text-xs text-neutral-500 sm:text-sm">{notes}</p> : null}
        {reason ? (
          <p className="text-xs text-neutral-600 italic sm:text-sm" data-testid="task-reason">
            {reason}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-label={status === "open" ? `Mark "${title}" done` : `Reopen "${title}"`}
          className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50"
        >
          {status === "open" ? "Done" : "Reopen"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label={`Delete "${title}"`}
          className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
