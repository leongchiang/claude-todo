"use client";

import { useActionState, useEffect, useRef } from "react";

import { type ActionResult, addTaskAction } from "./actions";

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult | null> {
  return addTaskAction(formData);
}

function errorMessage(result: ActionResult | null): string | null {
  if (!result || result.ok) return null;
  switch (result.error) {
    case "pii_rejected":
      return `PII detected (${result.details ?? "unknown"}). Remove personal info and try again.`;
    case "validation_error":
      return result.details ?? "Validation failed.";
    default:
      return "Could not add task. Try again.";
  }
}

export function AddTaskForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && formRef.current) formRef.current.reset();
  }, [state]);

  const error = errorMessage(state);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      data-testid="add-task-form"
    >
      <label htmlFor="task-title" className="block text-sm font-semibold text-neutral-900">
        New task
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="task-title"
          name="title"
          required
          maxLength={200}
          placeholder="What needs doing?"
          disabled={pending}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "task-error" : undefined}
          className="block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add task"}
        </button>
      </div>
      {error ? (
        <p id="task-error" role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      ) : null}
    </form>
  );
}
