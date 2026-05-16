"use client";

import { useActionState, useRef, useState } from "react";

import { type ActionResult, type IssuedPatPayload, issuePatAction } from "../actions";

async function action(
  _prev: ActionResult<IssuedPatPayload> | null,
  formData: FormData,
): Promise<ActionResult<IssuedPatPayload> | null> {
  return issuePatAction(formData);
}

function errorMessage(result: ActionResult<IssuedPatPayload> | null): string | null {
  if (!result || result.ok) return null;
  switch (result.error) {
    case "validation_error":
      return result.details ?? "Invalid name.";
    default:
      return "Could not issue token. Try again.";
  }
}

export function NewPatForm() {
  const [state, formAction, pending] = useActionState<
    ActionResult<IssuedPatPayload> | null,
    FormData
  >(action, null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const error = errorMessage(state);
  const issued = state?.ok ? state.data : null;

  const onCopy = async () => {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onDone = () => {
    formRef.current?.reset();
    setCopied(false);
    // Clear the issued state by re-mounting via key would be needed; the
    // user can navigate away or refresh to drop it.
  };

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-2" data-testid="new-pat-form">
        <label htmlFor="pat-name" className="block text-sm font-medium text-neutral-900">
          Issue a new token
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="pat-name"
            name="name"
            required
            maxLength={100}
            placeholder="e.g. 'cli' or 'my laptop'"
            disabled={pending}
            aria-invalid={error ? "true" : undefined}
            className="block w-full min-h-11 rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {pending ? "Issuing…" : "New token"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      {issued ? (
        <div
          data-testid="issued-pat"
          role="status"
          className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4"
        >
          <p className="text-sm font-medium text-amber-900">
            Your token for &ldquo;{issued.name}&rdquo; — save it now. We never show it again.
          </p>
          <code className="block w-full overflow-x-auto rounded bg-white px-3 py-2 font-mono text-sm text-neutral-900">
            {issued.token}
          </code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-11 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              I&apos;ve saved it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
