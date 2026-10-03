"use client";
import { useActionState, useState } from "react";
import { BlockOptions } from "@/components/forms/block-options";
import { linkProgression } from "./progression-actions";

export function ProgressionLinkForm({
  programId,
  revision,
  workoutId,
  kind,
  referenceId,
  options,
  unlink = false,
}: {
  programId: string;
  revision: number;
  workoutId: string;
  kind: "workout" | "exercise";
  referenceId: string;
  options: { value: string; label: string }[];
  unlink?: boolean;
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(linkProgression, {
    error: "",
  });
  return (
    <form aria-busy={pending} action={action} className="mt-4 text-left">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="unlink" value={String(unlink)} />
      <fieldset disabled={pending} className="space-y-4">
        <p className="text-sm text-muted">
          {unlink
            ? "Remove this item from the comparison. Its exercises and sets stay unchanged."
            : "Choose the corresponding item in this week. This changes the comparison link only; it does not copy or change sets."}
        </p>
        <BlockOptions
          name="itemId"
          label={unlink ? "Linked item" : `Choose ${kind}`}
          options={options}
          value={options[0]?.value ?? ""}
          required
        />
        <button
          type="submit"
          disabled={!options.length}
          className="min-h-12 rounded-lg bg-hal-red px-5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : unlink ? "Unlink" : "Save link"}
        </button>
      </fieldset>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}
