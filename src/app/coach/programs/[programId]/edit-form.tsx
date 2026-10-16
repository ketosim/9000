"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { MesocycleDurationSlider } from "@/components/forms/mesocycle-duration-slider";
import { WorkoutCountSlider } from "@/components/forms/workout-count-slider";
import { removalTotals, type RemovalCount } from "@/lib/programs/model";
import {
  updateProgram,
  type ProgramEditState,
  type ProgramEditValues,
} from "./actions";

type EditProgramFormProps = {
  programId: string;
  initialValues: ProgramEditValues;
  revision: number;
  removalCounts: RemovalCount[];
  fixedStructure: boolean;
};

const inputClass =
  "min-h-12 w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-base text-foreground outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400";

const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function EditProgramForm({
  programId,
  initialValues,
  revision,
  removalCounts,
  fixedStructure,
}: EditProgramFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [requestId] = useState(() => crypto.randomUUID());

  const originalDuration = Number(initialValues.durationWeeks);
  const originalWorkoutCount = Number(initialValues.sessionsPerWeek);

  const [durationWeeks, setDurationWeeks] =
    useState(originalDuration);

  const [workoutCount, setWorkoutCount] =
    useState(originalWorkoutCount);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const allowSubmit = useRef(false);

  const removesWeeks = durationWeeks < originalDuration;
  const removesWorkouts = workoutCount < originalWorkoutCount;

  const workoutRemovalTotals = removalTotals(
    removalCounts,
    workoutCount,
  );

  const initialState: ProgramEditState = {
    error: "",
    values: initialValues,
  };

  const [state, formAction, pending] = useActionState(
    updateProgram,
    initialState,
  );

  function clearConfirmation() {
    setConfirming(false);
    setConfirmed(false);
  }

  return (
    <form
      ref={form}
      action={formAction}
      className="mt-8"
      onSubmit={(event) => {
        if (allowSubmit.current) {
          allowSubmit.current = false;
          return;
        }

        if (
          fixedStructure &&
          (removesWeeks || removesWorkouts)
        ) {
          event.preventDefault();
          setConfirming(true);
          setConfirmed(false);
        }
      }}
    >
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value={revision} />
      <input
        type="hidden"
        name="confirmed"
        value={confirmed ? "yes" : "no"}
      />

      <fieldset
        disabled={pending}
        className="hal-panel min-w-0 space-y-6 rounded-xl border border-white/10 bg-panel p-5 disabled:opacity-60 sm:p-7"
      >
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
            defaultValue={state.values.name}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goal" className={labelClass}>
            Goal
          </label>

          <input
            id="goal"
            name="goal"
            type="text"
            maxLength={300}
            defaultValue={state.values.goal}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={state.values.description}
            className={`${inputClass} resize-y`}
          />
        </div>

        {fixedStructure ? (
          <>
            <MesocycleDurationSlider
              value={durationWeeks}
              onChange={(value) => {
                setDurationWeeks(value);
                clearConfirmation();
              }}
              disabled={pending}
            />

            <WorkoutCountSlider
              value={workoutCount}
              weekCount={durationWeeks}
              onChange={(value) => {
                setWorkoutCount(value);
                clearConfirmation();
              }}
              disabled={pending}
            />
          </>
        ) : (
          <>
            <input
              type="hidden"
              name="durationWeeks"
              value={originalDuration}
            />

            <input
              type="hidden"
              name="sessionsPerWeek"
              value={originalWorkoutCount}
            />

            <p className="rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-muted">
              This older mesocycle is preserved in its current
              structure. Duplicate it from the Mesocycles page to use
              the variable-duration builder.
            </p>
          </>
        )}

        <div>
          <fieldset>
            <legend className={labelClass}>Status</legend>

            <div className="grid grid-cols-3 gap-3">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    defaultChecked={
                      state.values.status === option.value
                    }
                    required
                    className="peer sr-only"
                  />

                  <span className="flex min-h-14 items-center justify-center rounded-xl border border-white/15 bg-black px-3 py-3 text-sm font-medium text-muted transition peer-checked:border-hal-red peer-checked:bg-hal-red/10 peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-400">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Draft: still being built. Active: ready for use. Archived:
            kept for reference.
          </p>
        </div>

        {confirming && (
          <section
            role="alertdialog"
            aria-labelledby="structure-change-title"
            className="rounded-xl border border-red-400/40 bg-red-950/20 p-5"
          >
            <h2
              id="structure-change-title"
              className="font-semibold"
            >
              Remove part of this mesocycle?
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-relaxed">
              {removesWeeks && (
                <p>
                  Weeks {durationWeeks + 1}–{originalDuration} will be
                  removed, including their workouts, exercises and
                  prescribed sets.
                </p>
              )}

              {removesWorkouts && (
                <p>
                  {Array.from(
                    {
                      length:
                        originalWorkoutCount - workoutCount,
                    },
                    (_, index) =>
                      `Workout ${workoutCount + index + 1}`,
                  ).join(", ")}{" "}
                  will be removed from the remaining weeks. This may
                  remove up to {workoutRemovalTotals.exercises}{" "}
                  exercises and {workoutRemovalTotals.sets} prescribed
                  sets.
                </p>
              )}

              <p className="font-medium text-red-200">
                This cannot be undone.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-12 rounded-lg border border-white/15 px-4"
                onClick={() => {
                  setDurationWeeks(originalDuration);
                  setWorkoutCount(originalWorkoutCount);
                  clearConfirmation();
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="min-h-12 rounded-lg bg-hal-red px-4 font-semibold text-white"
                onClick={() => {
                  setConfirmed(true);
                  allowSubmit.current = true;

                  requestAnimationFrame(() => {
                    form.current?.requestSubmit();
                  });
                }}
              >
                Confirm and save
              </button>
            </div>
          </section>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-hal-red px-6 py-3 font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:bg-hal-red-dark disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
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