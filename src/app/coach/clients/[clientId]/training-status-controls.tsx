"use client";

import { useActionState } from "react";
import {
  setMesocycleStatus,
  setTrainingBlockStatus,
  type TrainingStatusState,
} from "./actions";

type TrainingStatus = "draft" | "active" | "archived";

type StatusControlProps = {
  clientId: string;
  itemId: string;
  status: TrainingStatus;
  kind: "block" | "mesocycle";
};

const initialState: TrainingStatusState = {
  status: "idle",
  message: "",
};

function StatusButton({
  children,
  value,
  pending,
  variant = "secondary",
}: {
  children: React.ReactNode;
  value: TrainingStatus;
  pending: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary:
      "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
    danger:
      "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50",
  };

  return (
    <button
      type="submit"
      name="nextStatus"
      value={value}
      disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function TrainingStatusControls({
  clientId,
  itemId,
  status,
  kind,
}: StatusControlProps) {
  const action =
    kind === "block"
      ? setTrainingBlockStatus
      : setMesocycleStatus;

  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );

  const label =
    kind === "block" ? "training block" : "mesocycle";

  return (
    <div className="mt-4">
      <form
        action={formAction}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="clientId" value={clientId} />

        {kind === "block" ? (
          <input type="hidden" name="blockId" value={itemId} />
        ) : (
          <input
            type="hidden"
            name="mesocycleId"
            value={itemId}
          />
        )}

        {status === "draft" && (
          <StatusButton
            value="active"
            pending={pending}
            variant="primary"
          >
            {pending ? "Activating…" : `Activate ${label}`}
          </StatusButton>
        )}

        {status === "active" && (
          <>
            <StatusButton
              value="draft"
              pending={pending}
              variant="secondary"
            >
              {pending ? "Updating…" : "Return to draft"}
            </StatusButton>

            <StatusButton
              value="archived"
              pending={pending}
              variant="danger"
            >
              {pending ? "Archiving…" : `Archive ${label}`}
            </StatusButton>
          </>
        )}

        {status === "archived" && (
          <StatusButton
            value="draft"
            pending={pending}
            variant="secondary"
          >
            {pending ? "Restoring…" : `Restore ${label}`}
          </StatusButton>
        )}
      </form>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}