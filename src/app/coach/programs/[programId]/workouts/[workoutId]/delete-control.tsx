"use client";

import { useActionState, useState } from "react";
import { deleteWorkoutItem } from "./delete-actions";

type Props = {
  mode: "exercise" | "set";
  programId: string;
  revision: number;
  workoutId: string;
  exerciseId?: string;
  itemId: string;
  label: string;
  setCount?: number;
};

function DeleteConfirmation({
  mode,
  programId,
  revision,
  workoutId,
  exerciseId,
  itemId,
  label,
  setCount = 0,
  onCancel,
}: Props & { onCancel: () => void }) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(deleteWorkoutItem, {
    error: "",
  });

  return (
    <form
      aria-busy={pending}
      action={action}
      className="mt-3 rounded-lg border border-red-400/30 bg-red-500/5 p-4"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="confirmed" value="yes" />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="exerciseId" value={exerciseId ?? ""} />
      <input type="hidden" name="itemId" value={itemId} />

      <p className="text-sm font-medium [overflow-wrap:anywhere]">
        Delete {label}?
      </p>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        {mode === "exercise" && setCount > 0
          ? `This also deletes its ${setCount} prescribed ${
              setCount === 1 ? "set" : "sets"
            }. `
          : ""}
        This cannot be undone.
      </p>

      <fieldset disabled={pending} className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-white/15 px-4 text-sm text-foreground disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="min-h-11 rounded-lg bg-hal-red px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </fieldset>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function DeleteControl(props: Props) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <DeleteConfirmation {...props} onCancel={() => setConfirming(false)} />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${props.label}`}
      className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 active:text-red-400"
    >
      Delete
    </button>
  );
}
