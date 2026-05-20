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
        <div className="flex items-center justify-between">
          <h2
            id="open-heading"
            className="text-sm font-semibold uppercase tracking-wide text-neutral-500"
          >
            Open tasks
          </h2>
          {open.items.length > 0 ? (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {open.items.length}
            </span>
          ) : null}
        </div>
        {open.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
            <p className="text-2xl" aria-hidden="true">
              ✓
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-600">All clear</p>
            <p className="text-sm text-neutral-400">Add a task above to get started.</p>
          </div>
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
          <div className="flex items-center justify-between">
            <h2
              id="done-heading"
              className="text-sm font-semibold uppercase tracking-wide text-neutral-500"
            >
              Done today
            </h2>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
              {done.items.length}
            </span>
          </div>
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
