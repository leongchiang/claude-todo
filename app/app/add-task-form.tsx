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
    <form ref={formRef} action={formAction} className="space-y-2" data-testid="add-task-form">
      <label htmlFor="task-title" className="block text-sm font-medium text-neutral-900">
        Add a task
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
          className="block w-full min-h-11 rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {error ? (
        <p id="task-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
