import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getDb, listTasks } from "@/lib/storage";

import { AddTaskForm } from "./add-task-form";
import { AiPanel } from "./ai-panel";
import { TaskRow } from "./task-row";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  // Layout already redirects unauthenticated requests; this assertion narrows
  // the type without re-checking.
  const userId = session?.user?.id as string;

  const open = listTasks(getDb(), userId, { status: "open", limit: 50 });
  const done = listTasks(getDb(), userId, { status: "done", limit: 20 });

  return (
    <div className="space-y-8">
      <AddTaskForm />

      <AiPanel initialOpenCount={open.items.length} />

      <section aria-labelledby="open-heading" className="space-y-3">
        <h2
          id="open-heading"
          className="text-sm font-semibold uppercase tracking-wide text-neutral-600"
        >
          Open ({open.items.length})
        </h2>
        {open.items.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing open. Add one above.</p>
        ) : (
          <ul className="space-y-2" data-testid="open-tasks">
            {open.items.map((t) => (
              <TaskRow key={t.id} id={t.id} title={t.title} notes={t.notes} status="open" />
            ))}
          </ul>
        )}
      </section>

      {done.items.length > 0 ? (
        <section aria-labelledby="done-heading" className="space-y-3">
          <h2
            id="done-heading"
            className="text-sm font-semibold uppercase tracking-wide text-neutral-600"
          >
            Recently done
          </h2>
          <ul className="space-y-2" data-testid="done-tasks">
            {done.items.map((t) => (
              <TaskRow key={t.id} id={t.id} title={t.title} notes={t.notes} status="done" />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
