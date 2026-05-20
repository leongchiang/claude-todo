"use client";

import { useTransition } from "react";

import { revokePatAction } from "../actions";

interface Props {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PatRow({ id, name, lastUsedAt, createdAt }: Props) {
  const [pending, startTransition] = useTransition();

  const onRevoke = () => {
    if (
      !window.confirm(`Revoke "${name}"? Anyone using this token will lose access immediately.`)
    ) {
      return;
    }
    startTransition(async () => {
      await revokePatAction(id);
    });
  };

  return (
    <li
      data-testid="pat-row"
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{name}</p>
          <p className="text-xs text-neutral-500">
            Created {fmtDate(createdAt)} ·{" "}
            {lastUsedAt ? `last used ${fmtDate(lastUsedAt)}` : "never used"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        disabled={pending}
        aria-label={`Revoke "${name}"`}
        className="inline-flex min-h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
      >
        Revoke
      </button>
    </li>
  );
}
