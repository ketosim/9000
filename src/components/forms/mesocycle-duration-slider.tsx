"use client";

import { useId } from "react";
import {
  MAX_MESOCYCLE_WEEKS,
  MIN_MESOCYCLE_WEEKS,
} from "@/lib/programs/model";

type MesocycleDurationSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function MesocycleDurationSlider({
  value,
  onChange,
  disabled = false,
}: MesocycleDurationSliderProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700"
        >
          Duration
        </label>

        <output
          htmlFor={id}
          className="text-lg font-semibold tabular-nums"
        >
          {value} {value === 1 ? "week" : "weeks"}
        </output>
      </div>

      <input
        id={id}
        name="durationWeeks"
        type="range"
        min={MIN_MESOCYCLE_WEEKS}
        max={MAX_MESOCYCLE_WEEKS}
        step={1}
        value={value}
        disabled={disabled}
        aria-describedby={descriptionId}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="mt-3 h-12 w-full cursor-pointer accent-brand-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue disabled:cursor-wait"
      />

      <div
        aria-hidden="true"
        className="flex justify-between px-1 text-xs tabular-nums text-muted"
      >
        {Array.from(
          {
            length:
              MAX_MESOCYCLE_WEEKS -
              MIN_MESOCYCLE_WEEKS +
              1,
          },
          (_, index) => MIN_MESOCYCLE_WEEKS + index,
        ).map((number) => (
          <span key={number}>{number}</span>
        ))}
      </div>

      <p id={descriptionId} className="mt-3 text-xs text-muted">
        All weeks and their workout slots will be created
        automatically.
      </p>
    </div>
  );
}
