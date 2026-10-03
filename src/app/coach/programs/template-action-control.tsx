"use client";

import { useActionState, useState, type ReactNode } from "react";
import { templateAction } from "./template-actions";

export function TemplateActionControl({
  programId,
  revision,
  operation,
  payload = {},
  label,
  confirmation,
  confirmLabel = "Confirm",
  disabled = false,
  children,
}: {
  programId: string;
  revision: number;
  operation: string;
  payload?: Record<string, unknown>;
  label: string;
  confirmation?: string;
  confirmLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(templateAction, {
    error: "",
    message: "",
  });
  const button =
    "min-h-11 rounded-lg border border-white/15 px-3 text-sm font-medium text-foreground transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-wait disabled:opacity-40";
  return (
    <form aria-busy={pending} action={action} aria-label={label}>
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="operation" value={operation} />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          ...payload,
          confirmed: Boolean(confirmation && confirming),
        })}
      />
      <fieldset disabled={disabled || pending} className="min-w-0">
        {children}
        {confirmation && confirming ? (
          <section
            role="alertdialog"
            aria-label={label}
            className="mt-3 rounded-lg border border-red-400/30 bg-red-950/20 p-4"
          >
            <p className="text-sm leading-relaxed">{confirmation}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className={button}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${button} bg-hal-red text-white`}
              >
                {pending ? "Saving…" : confirmLabel}
              </button>
            </div>
          </section>
        ) : (
          <button
            type={confirmation ? "button" : "submit"}
            onClick={confirmation ? () => setConfirming(true) : undefined}
            className={button}
          >
            {pending ? "Saving…" : label}
          </button>
        )}
      </fieldset>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      <p
        role="status"
        className={state.message ? "mt-2 text-xs text-muted" : "sr-only"}
      >
        {pending ? "Saving…" : state.message}
      </p>
    </form>
  );
}
