"use client";

import { useActionState, useState } from "react";
import {
  createTrainingBlock,
  type TrainingBlockState,
} from "./actions";

const initialState: TrainingBlockState = {
  status: "idle",
  message: "",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const labelClass =
  "mb-2 block text-sm font-medium text-slate-700";

export function TrainingBlockForm({
  clientId,
}: {
  clientId: string;
}) {
  const [mesocycleCount, setMesocycleCount] = useState(3);
  const [state, formAction, pending] = useActionState(
    createTrainingBlock,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5">
      <input type="hidden" name="clientId" value={clientId} />

      <fieldset
        disabled={pending}
        className="hal-panel space-y-6 rounded-2xl p-5 disabled:opacity-60 sm:p-6"
      >
        <div>
          <label htmlFor="block-name" className={labelClass}>
            Block name
          </label>

          <input
            id="block-name"
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={state.values?.name ?? ""}
            placeholder="BJJ Competition Preparation"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="block-description" className={labelClass}>
            Description{" "}
            <span className="font-normal text-muted">
              (optional)
            </span>
          </label>

          <textarea
            id="block-description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={state.values?.description ?? ""}
            placeholder="Describe the overall focus of this training block."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="mesocycle-count"
              className="text-sm font-medium text-slate-700"
            >
              Mesocycles
            </label>

            <output
              htmlFor="mesocycle-count"
              className="text-xl font-semibold tabular-nums text-blue-700"
            >
              {mesocycleCount}
            </output>
          </div>

          <input
            id="mesocycle-count"
            name="mesocycleCount"
            type="range"
            min={1}
            max={6}
            step={1}
            value={mesocycleCount}
            onChange={(event) =>
              setMesocycleCount(Number(event.target.value))
            }
            className="mt-3 h-12 w-full cursor-pointer accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
          />

          <div
            aria-hidden="true"
            className="flex justify-between px-1 text-xs tabular-nums text-muted"
          >
            {[1, 2, 3, 4, 5, 6].map((number) => (
              <span key={number}>{number}</span>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted">
            Three mesocycles is the default. You can adjust this
            later while the affected mesocycles are empty.
          </p>
        </div>

        <div>
          <label htmlFor="block-starts-on" className={labelClass}>
            Start date{" "}
            <span className="font-normal text-muted">
              (optional)
            </span>
          </label>

          <input
            id="block-starts-on"
            name="startsOn"
            type="date"
            defaultValue={state.values?.startsOn ?? ""}
            className={inputClass}
          />

          <p className="mt-2 text-xs text-muted">
            Leave this empty if the block has not been scheduled yet.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create training block"}
        </button>
      </fieldset>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border p-4 text-sm ${
            state.status === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}