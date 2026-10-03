"use client";

import { BlockOptions } from "@/components/forms/block-options";
import { useActionState, useId } from "react";
import { createBuilderItem, type BuilderState } from "./actions";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  defaultValue?: string;
  options?: { value: string; label: string }[];
};

type BuilderFormProps = {
  mode: "week" | "workout";
  programId: string;
  weekId?: string;
  itemId: string;
  fields: Field[];
  submitLabel: string;
};

const initialState: BuilderState = {
  error: "",
  values: {},
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-black px-3 py-3 text-base text-foreground outline-none focus:border-hal-red-bright";

export function BuilderForm({
  mode,
  programId,
  weekId,
  itemId,
  fields,
  submitLabel,
}: BuilderFormProps) {
  const [state, action, pending] = useActionState(
    createBuilderItem,
    initialState,
  );

  const formId = useId();

  return (
    <form aria-busy={pending} action={action} className="mt-5">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="weekId" value={weekId ?? ""} />
      <input type="hidden" name="itemId" value={itemId} />

      <fieldset disabled={pending} className="space-y-4">
        {fields.map((field) => {
          const id = `${formId}-${field.name}`;
          const value = state.values[field.name] ?? field.defaultValue ?? "";

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
            <div key={field.name}>
              <label htmlFor={id} className="block text-sm text-muted">
                {field.label}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={3}
                  required={field.required}
                  maxLength={field.maxLength}
                  defaultValue={value}
                  className={inputClass}
                />
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type ?? "text"}
                  inputMode={field.type === "number" ? "numeric" : undefined}
                  step={field.type === "number" ? 1 : undefined}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  maxLength={field.maxLength}
                  defaultValue={value}
                  className={inputClass}
                />
              )}
            </div>
          );
        })}

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
