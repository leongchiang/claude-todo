import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { listPats } from "@/lib/pats";
import { getDb } from "@/lib/storage";

import { NewPatForm } from "./new-pat-form";
import { PatRow } from "./pat-row";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string; // layout already gated this
  const pats = listPats(getDb(), userId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Personal Access Tokens authenticate API calls on your behalf. Issue one per tool or
          machine, revoke anytime.
        </p>
      </header>

      <NewPatForm />

      <section aria-labelledby="pat-list-heading" className="space-y-3">
        <h2
          id="pat-list-heading"
          className="text-sm font-semibold uppercase tracking-wide text-neutral-600"
        >
          Your tokens ({pats.length})
        </h2>
        {pats.length === 0 ? (
          <p className="text-sm text-neutral-500">No tokens yet.</p>
        ) : (
          <ul className="space-y-2" data-testid="pat-list">
            {pats.map((p) => (
              <PatRow
                key={p.id}
                id={p.id}
                name={p.name}
                lastUsedAt={p.last_used_at}
                createdAt={p.created_at}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
