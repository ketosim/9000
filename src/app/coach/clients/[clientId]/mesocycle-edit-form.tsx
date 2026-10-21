"use client";

import { useActionState } from "react";
import {
  updateClientMesocycle,
  type MesocycleEditState,
} from "./actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const labelClass =
  "mb-2 block text-xs font-medium text-slate-700";

export function MesocycleEditForm({
  clientId,
  mesocycleId,
  initialName,
  initialStartsOn,
  mesocycleStatus,
}: {
  clientId: string;
  mesocycleId: string;
  initialName: string;
  initialStartsOn: string | null;
  mesocycleStatus: "draft" | "active" | "archived";
}) {
  const initialState: MesocycleEditState = {
    status: "idle",
    message: "",
    values: {
      name: initialName,
      startsOn: initialStartsOn ?? "",
    },
  };

  const [state, formAction, pending] = useActionState(
    updateClientMesocycle,
    initialState,
  );

  if (mesocycleStatus === "archived") {
    return null;
  }

  return (
    <details className="mt-3 rounded-lg border border-blue-100 bg-white/70">
      <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500">
        Edit mesocycle
        <span aria-hidden="true">+</span>
      </summary>

      <form
        action={formAction}
        className="space-y-4 border-t border-blue-100 p-3"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <input
          type="hidden"
          name="mesocycleId"
          value={mesocycleId}
        />

        <fieldset
          disabled={pending}
          className="space-y-4 disabled:opacity-60"
        >
          <div>
            <label
              htmlFor={`mesocycle-name-${mesocycleId}`}
              className={labelClass}
            >
              Mesocycle name
            </label>

            <input
              id={`mesocycle-name-${mesocycleId}`}
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
              htmlFor={`mesocycle-start-${mesocycleId}`}
              className={labelClass}
            >
              Start date{" "}
              <span className="font-normal text-muted">
                (optional)
              </span>
            </label>

            <input
              id={`mesocycle-start-${mesocycleId}`}
              name="startsOn"
              type="date"
              defaultValue={
                state.values?.startsOn ?? initialStartsOn ?? ""
              }
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="min-h-10 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save mesocycle"}
          </button>
        </fieldset>

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700"
          >
            {state.message}
          </p>
        )}

        {state.status === "success" && (
          <p role="status" className="text-xs text-blue-700">
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}