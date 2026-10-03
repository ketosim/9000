"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { WorkoutCountSlider } from "@/components/forms/workout-count-slider";
import { createProgram, type ProgramFormState } from "./actions";

const initialState: ProgramFormState = {
  error: "",
};

const inputClass =
  "min-h-12 w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-base text-foreground outline-none transition placeholder:text-zinc-600 focus:border-red-400 focus:ring-1 focus:ring-red-400";

const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

export function ProgramForm({ programId }: { programId: string }) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [count, setCount] = useState(3);
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
        className="hal-panel min-w-0 space-y-6 rounded-xl border border-white/10 bg-panel p-5 disabled:opacity-60 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Program details</h2>

          <span className="text-xs uppercase tracking-widest text-muted">
            Draft
          </span>
        </div>

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
            defaultValue={state.values?.name ?? ""}
            placeholder="Lower Body Strength"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goal" className={labelClass}>
            Goal <span className="text-muted">(optional)</span>
          </label>

          <input
            id="goal"
            name="goal"
            type="text"
            maxLength={300}
            defaultValue={state.values?.goal ?? ""}
            placeholder="Build lower-body strength"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description <span className="text-muted">(optional)</span>
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={state.values?.description ?? ""}
            placeholder="Describe the focus of this program."
            className={`${inputClass} resize-y`}
          />
        </div>

        <p className="text-sm text-muted">
          Four-week template · Weeks 1–4 are created automatically.
        </p>
        <WorkoutCountSlider
          value={count}
          onChange={setCount}
          disabled={pending}
        />

        <p className="text-sm leading-relaxed text-muted">
          Save these details to create all four weeks and their workout blocks,
          then add exercises.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-hal-red px-6 py-3 font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:bg-hal-red-dark disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save draft"}
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
