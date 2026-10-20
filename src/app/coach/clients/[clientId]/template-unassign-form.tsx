"use client";

import { useActionState } from "react";
import {
  unassignTrainingTemplate,
  type TemplateUnassignmentState,
} from "./actions";

const initialState: TemplateUnassignmentState = {
  status: "idle",
  message: "",
};

export function TemplateUnassignForm({
  clientId,
  assignmentId,
  templateName,
  durationWeeks,
}: {
  clientId: string;
  assignmentId: string;
  templateName: string;
  durationWeeks: number;
}) {
  const [state, formAction, pending] = useActionState(
    unassignTrainingTemplate,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-3"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Unassign “${templateName}”?\n\nThis removes its ${durationWeeks}-week client snapshot and all associated workouts, exercises and prescribed sets. The reusable template will not be deleted.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <button
        type="submit"
        disabled={pending}
        className="min-h-10 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Unassigning…" : "Unassign"}
      </button>

      {state.status === "error" && (
        <p
          role="alert"
          className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
