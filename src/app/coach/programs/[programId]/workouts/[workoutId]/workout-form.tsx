"use client";

import { BlockOptions } from "@/components/forms/block-options";
import { useActionState, useState } from "react";
import { addWorkoutItem, type WorkoutFormState } from "./actions";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  defaultValue?: string;
  advanced?: boolean;
  options?: { value: string; label: string }[];
};

type Props = {
  mode: "exercise" | "set";
  programId: string;
  revision: number;
  workoutId: string;
  exerciseId?: string;
  itemId: string;
  fields: Field[];
  submitLabel: string;
  operation?: "create" | "update";
  initialValues?: Record<string, string>;
};

const initialState: WorkoutFormState = {
  error: "",
  values: {},
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-base text-foreground outline-none focus:border-hal-red-bright";

export function WorkoutForm({
  mode,
  programId,
  revision,
  workoutId,
  exerciseId,
  itemId,
  fields,
  submitLabel,
  operation = "create",
  initialValues = {},
}: Props) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(addWorkoutItem, initialState);

  function renderField(field: Field) {
    const value =
      state.values[field.name] ??
      initialValues[field.name] ??
      field.defaultValue ??
      "";

    if (field.options)
      return (
        <BlockOptions
          key={field.name}
          name={field.name}
          label={field.label}
          options={field.options}
          value={value || field.options[0]?.value || ""}
          required={field.required}
        />
      );
    return (
      <label key={field.name} className="block text-sm text-muted">
        {field.label}
        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            rows={3}
            required={field.required}
            maxLength={field.maxLength}
            defaultValue={value}
            className={inputClass}
          />
        ) : (
          <input
            name={field.name}
            type={field.type ?? "text"}
            inputMode={
              field.type === "number"
                ? field.step === 0.01
                  ? "decimal"
                  : "numeric"
                : undefined
            }
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.type === "number" ? (field.step ?? 1) : undefined}
            maxLength={field.maxLength}
            defaultValue={value}
            className={inputClass}
          />
        )}
      </label>
    );
  }

  return (
    <form aria-busy={pending} action={action} className="mt-4">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="revision" value={revision} />
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="exerciseId" value={exerciseId ?? ""} />
      <input type="hidden" name="itemId" value={itemId} />

      <fieldset disabled={pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.filter((field) => !field.advanced).map(renderField)}
        </div>

        {fields.some((field) => field.advanced) && (
          <details className="border-t border-white/10 pt-2">
            <summary className="min-h-11 cursor-pointer py-3 text-sm text-muted">
              More options
            </summary>

            <div className="mt-2 space-y-4">
              {fields.filter((field) => field.advanced).map(renderField)}
            </div>
          </details>
        )}

        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-hal-red px-5 py-3 font-medium text-white transition active:bg-hal-red-dark disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
