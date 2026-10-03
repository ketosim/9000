"use client";

import { useId } from "react";

export function WorkoutCountSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-zinc-300">
          Workouts per week
        </label>
        <output htmlFor={id} className="text-lg font-semibold tabular-nums">
          {value}
        </output>
      </div>
      <input
        id={id}
        name="sessionsPerWeek"
        type="range"
        min={1}
        max={7}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-12 w-full cursor-pointer accent-red-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-wait"
      />
      <div
        aria-hidden="true"
        className="flex justify-between px-1 text-xs tabular-nums text-muted"
      >
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {value} {value === 1 ? "workout" : "workouts"} in each of the four
        weeks.
      </p>
    </div>
  );
}
