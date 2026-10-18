"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MesocycleDurationSlider } from "@/components/forms/mesocycle-duration-slider";
import { WorkoutCountSlider } from "@/components/forms/workout-count-slider";
import { DEFAULT_MESOCYCLE_WEEKS } from "@/lib/programs/model";
import {
  createProgram,
  type ProgramFormState,
} from "./actions";

const initialState: ProgramFormState = {
  error: "",
};

const inputClass =
  "min-h-12 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue";

const labelClass =
  "mb-2 block text-sm font-medium text-slate-700";

export function ProgramForm({
  programId,
}: {
  programId: string;
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [durationWeeks, setDurationWeeks] = useState(
    DEFAULT_MESOCYCLE_WEEKS,
  );
  const [workoutCount, setWorkoutCount] = useState(3);

  const [state, formAction, pending] = useActionState(
    createProgram,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value="0" />

      <fieldset
        disabled={pending}
        className="hal-panel min-w-0 space-y-7 rounded-xl border border-white/10 bg-panel p-5 disabled:opacity-60 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Mesocycle details
          </h2>

          <span className="text-xs uppercase tracking-widest text-muted">
            Draft
          </span>
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            Mesocycle name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={state.values?.name ?? ""}
            placeholder="BJJ Strength"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goal" className={labelClass}>
            Goal{" "}
            <span className="text-muted">(optional)</span>
          </label>

          <input
            id="goal"
            name="goal"
            type="text"
            maxLength={300}
            defaultValue={state.values?.goal ?? ""}
            placeholder="Build maximal strength for grappling"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description{" "}
            <span className="text-muted">(optional)</span>
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={state.values?.description ?? ""}
            placeholder="Describe the focus of this mesocycle."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="border-t border-white/10 pt-7">
          <MesocycleDurationSlider
            value={durationWeeks}
            onChange={setDurationWeeks}
            disabled={pending}
          />
        </div>

        <div className="border-t border-white/10 pt-7">
          <WorkoutCountSlider
            value={workoutCount}
            weekCount={durationWeeks}
            onChange={setWorkoutCount}
            disabled={pending}
          />
        </div>

        <p className="text-sm leading-relaxed text-muted">
          Saving creates {durationWeeks}{" "}
          {durationWeeks === 1 ? "week" : "weeks"} with{" "}
          {workoutCount}{" "}
          {workoutCount === 1 ? "workout" : "workouts"} in each
          week. You can then add exercises from the Workouts tab.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-hal-red px-6 py-3 font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue active:bg-hal-red-dark disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create draft"}
        </button>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200"
        >
          {state.error}
        </p>
      )}

      <Link
        href="/coach/programs"
        className="mt-5 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4"
      >
        Back to mesocycles
      </Link>
    </form>
  );
}
