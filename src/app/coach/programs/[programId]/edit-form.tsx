"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
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
  const originalCount = Number(initialValues.sessionsPerWeek);
  const [count, setCount] = useState(originalCount);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const allowSubmit = useRef(false);
  const totals = removalTotals(removalCounts, count);
  const initialState: ProgramEditState = {
    error: "",
    values: initialValues,
  };

  const [state, formAction, pending] = useActionState(
    updateProgram,
    initialState,
  );

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
        if (fixedStructure && count < originalCount) {
          event.preventDefault();
          setConfirming(true);
          setConfirmed(false);
        }
      }}
    >
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="confirmed" value={confirmed ? "yes" : "no"} />

      <fieldset
        disabled={pending}
        className="hal-panel min-w-0 space-y-6 rounded-xl border border-white/10 bg-panel p-5 disabled:opacity-60 sm:p-7"
      >
        <div>
          <label htmlFor="name" className={labelClass}>
            Program name
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
            <p className="text-sm text-muted">Four-week template · Weeks 1–4</p>
            <WorkoutCountSlider
              value={count}
              onChange={(value) => {
                setCount(value);
                setConfirming(false);
                setConfirmed(false);
              }}
              disabled={pending}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="sessionsPerWeek" value={originalCount} />
            <p className="text-sm text-muted">
              Existing programme preserved. Create a four-week copy from
              Programs to change its schedule.
            </p>
          </>
        )}
        {confirming && (
          <section
            role="alertdialog"
            aria-labelledby="remove-workouts-title"
            className="rounded-xl border border-red-400/40 bg-red-950/20 p-5"
          >
            <h2 id="remove-workouts-title" className="font-semibold">
              Remove workouts across all four weeks?
            </h2>
            <p className="mt-3 text-sm">
              Remove{" "}
              {Array.from(
                { length: originalCount - count },
                (_, i) => `Workout ${count + i + 1}`,
              ).join(", ")}{" "}
              from every week, including {totals.exercises} exercises and{" "}
              {totals.sets} prescribed sets. This cannot be undone.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="min-h-12 rounded-lg border border-white/15 px-4"
                onClick={() => {
                  setCount(originalCount);
                  setConfirming(false);
                  setConfirmed(false);
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
                  // Commit the hidden confirmation value before native form submission.
                  requestAnimationFrame(() => form.current?.requestSubmit());
                }}
              >
                Remove workouts
              </button>
            </div>
          </section>
        )}

        <fieldset className="min-w-0">
          <legend className={labelClass}>Status</legend>

          <div className="grid grid-cols-3 gap-3">
            {statusOptions.map((option) => (
              <label key={option.value} className="relative">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  defaultChecked={state.values.status === option.value}
                  required
                  className="peer sr-only"
                />

                <span
                  className="
                    flex min-h-14 cursor-pointer items-center
                    justify-center rounded-xl border border-white/15
                    bg-panel px-2 py-3 text-sm font-medium
                    text-muted transition
                    peer-checked:border-hal-red
                    peer-checked:bg-hal-red/10
                    peer-checked:text-foreground
                    peer-focus-visible:outline-2
                    peer-focus-visible:outline-offset-2
                    peer-focus-visible:outline-red-400
                    peer-disabled:cursor-wait
                  "
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Draft: being prepared. Active: ready to use. Archived: kept for
            reference. Active requires exercises and valid prescribed sets in
            every workout.
          </p>
        </fieldset>

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
        Back to programs
      </Link>
    </form>
  );
}
