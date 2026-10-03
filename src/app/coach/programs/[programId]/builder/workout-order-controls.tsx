"use client";

import { useActionState } from "react";
import { moveWorkout } from "./actions";

type Props = {
  programId: string;
  weekId: string;
  workoutId: string;
  workoutName: string;
  order: string[];
};

export function WorkoutOrderControls({
  programId,
  weekId,
  workoutId,
  workoutName,
  order,
}: Props) {
  const [state, formAction, pending] = useActionState(moveWorkout, {
    error: "",
    message: "",
  });
  const index = order.indexOf(workoutId);
  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-panel px-3 text-sm text-foreground transition hover:bg-panel-light active:bg-panel-light disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400";

  return (
    <form
      action={formAction}
      aria-label={`Reorder ${workoutName}`}
      className="mt-4"
    >
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="weekId" value={weekId} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="expectedOrder" value={JSON.stringify(order)} />

      <fieldset
        disabled={pending}
        aria-busy={pending}
        className="flex flex-wrap gap-2"
      >
        <button
          type="submit"
          name="direction"
          value="up"
          disabled={index <= 0}
          className={buttonClass}
          aria-label={`Move ${workoutName} up`}
        >
          <span aria-hidden="true">↑</span> Move up
        </button>
        <button
          type="submit"
          name="direction"
          value="down"
          disabled={index < 0 || index >= order.length - 1}
          className={buttonClass}
          aria-label={`Move ${workoutName} down`}
        >
          <span aria-hidden="true">↓</span> Move down
        </button>
      </fieldset>

      <p
        role="status"
        className={pending ? "mt-2 text-xs text-muted" : "sr-only"}
      >
        {pending ? "Saving order…" : state.message}
      </p>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}
