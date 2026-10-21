"use client";

import { useActionState, useState } from "react";
import {
  updateTrainingBlock,
  type TrainingBlockEditState,
} from "./actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const labelClass =
  "mb-2 block text-xs font-medium text-slate-700";

export function TrainingBlockEditForm({
  clientId,
  blockId,
  initialName,
  initialDescription,
  initialStartsOn,
  initialMesocycleCount,
  blockStatus,
}: {
  clientId: string;
  blockId: string;
  initialName: string;
  initialDescription: string;
  initialStartsOn: string | null;
  initialMesocycleCount: number;
  blockStatus: "draft" | "active" | "archived";
}) {
  const [mesocycleCount, setMesocycleCount] = useState(
    initialMesocycleCount,
  );

  const initialState: TrainingBlockEditState = {
    status: "idle",
    message: "",
    values: {
      name: initialName,
      description: initialDescription,
      startsOn: initialStartsOn ?? "",
      mesocycleCount: String(initialMesocycleCount),
    },
  };

  const [state, formAction, pending] = useActionState(
    updateTrainingBlock,
    initialState,
  );

  if (blockStatus === "archived") {
    return null;
  }

  return (
    <details className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500">
        Edit training block
        <span aria-hidden="true">+</span>
      </summary>

      <form
        action={formAction}
        className="space-y-5 border-t border-blue-100 p-4"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="blockId" value={blockId} />

        <fieldset
          disabled={pending}
          className="space-y-5 disabled:opacity-60"
        >
          <div>
            <label
              htmlFor={`block-name-${blockId}`}
              className={labelClass}
            >
              Block name
            </label>

            <input
              id={`block-name-${blockId}`}
              name="name"
              type="text"
              required
              maxLength={100}
              defaultValue={state.values?.name ?? initialName}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor={`block-description-${blockId}`}
              className={labelClass}
            >
              Description{" "}
              <span className="font-normal text-muted">
                (optional)
              </span>
            </label>

            <textarea
              id={`block-description-${blockId}`}
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={
                state.values?.description ?? initialDescription
              }
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor={`block-start-${blockId}`}
              className={labelClass}
            >
              Start date{" "}
              <span className="font-normal text-muted">
                (optional)
              </span>
            </label>

            <input
              id={`block-start-${blockId}`}
              name="startsOn"
              type="date"
              defaultValue={
                state.values?.startsOn ?? initialStartsOn ?? ""
              }
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor={`block-mesocycles-${blockId}`}
                className="text-xs font-medium text-slate-700"
              >
                Mesocycles
              </label>

              <output
                htmlFor={`block-mesocycles-${blockId}`}
                className="font-semibold tabular-nums text-blue-700"
              >
                {mesocycleCount}
              </output>
            </div>

            <input
              id={`block-mesocycles-${blockId}`}
              name="mesocycleCount"
              type="range"
              min={1}
              max={6}
              step={1}
              value={mesocycleCount}
              disabled={pending || blockStatus !== "draft"}
              onChange={(event) =>
                setMesocycleCount(Number(event.target.value))
              }
              className="mt-2 h-11 w-full cursor-pointer accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
            />

            <div
              aria-hidden="true"
              className="flex justify-between px-1 text-xs tabular-nums text-muted"
            >
              {[1, 2, 3, 4, 5, 6].map((number) => (
                <span key={number}>{number}</span>
              ))}
            </div>

            {blockStatus === "draft" ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Reducing the count removes mesocycles from the end.
                Mesocycles containing assigned templates cannot be
                removed.
              </p>
            ) : (
              <>
                <input
                  type="hidden"
                  name="mesocycleCount"
                  value={initialMesocycleCount}
                />

                <p className="mt-2 text-xs leading-relaxed text-muted">
                  The mesocycle count is locked because this block is{" "}
                  {blockStatus}.
                </p>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save block changes"}
          </button>
        </fieldset>

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.message}
          </p>
        )}

        {state.status === "success" && (
          <p role="status" className="text-sm text-blue-700">
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}