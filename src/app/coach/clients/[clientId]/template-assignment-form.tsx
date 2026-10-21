"use client";

import { useActionState } from "react";
import {
  assignTrainingTemplate,
  type TemplateAssignmentState,
} from "./actions";

export type AssignableTemplate = {
  id: string;
  name: string;
  duration_weeks: number;
  sessions_per_week: number;
};

const initialState: TemplateAssignmentState = {
  status: "idle",
  message: "",
};

export function TemplateAssignmentForm({
  clientId,
  mesocycleId,
  durationWeeks,
  templates,
}: {
  clientId: string;
  mesocycleId: string;
  durationWeeks: number | null;
  templates: AssignableTemplate[];
}) {
  const [state, formAction, pending] = useActionState(
    assignTrainingTemplate,
    initialState,
  );

  if (templates.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white/70 p-3 text-sm text-muted">
        {durationWeeks
          ? `No unassigned active ${durationWeeks}-week templates are available.`
          : "No unassigned active templates are available."}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="mesocycleId" value={mesocycleId} />

      <label
        htmlFor={`template-${mesocycleId}`}
        className="block text-xs font-medium text-slate-700"
      >
        Assign training template
      </label>

      <select
        id={`template-${mesocycleId}`}
        name="programId"
        required
        defaultValue=""
        disabled={pending}
        className="min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-wait disabled:opacity-60"
      >
        <option value="" disabled>
          Choose a template
        </option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} · {template.duration_weeks} weeks ·{" "}
            {template.sessions_per_week}/week
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Assigning…" : "Assign template"}
      </button>

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700"
          >
            {state.message}
          </p>
        )}
    </form>
  );
}
