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
      className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-900">{name}</p>
        <p className="text-xs text-neutral-500">
          Created {fmtDate(createdAt)} ·{" "}
          {lastUsedAt ? `last used ${fmtDate(lastUsedAt)}` : "never used"}
        </p>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        disabled={pending}
        aria-label={`Revoke "${name}"`}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
      >
        Revoke
      </button>
    </li>
  );
}
