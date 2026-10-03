"use client";

import { useEffect, useId, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useProgramNavigation } from "./program-navigation-guard";

type Props = {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
};

export function WorkspaceSelect({ label, value, options }: Props) {
  const id = useId();
  const router = useRouter();
  const confirmNavigation = useProgramNavigation();

  const rowRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const [pending, startTransition] = useTransition();

  const isWorkout = label.toLowerCase() === "workout";

  // Reveal the selected block without moving the page vertically.
  useEffect(() => {
    const row = rowRef.current;
    const selected = selectedRef.current;

    if (!row || !selected) return;

    const rowBounds = row.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    const padding = 8;

    if (selectedBounds.left < rowBounds.left + padding) {
      row.scrollLeft += selectedBounds.left - rowBounds.left - padding;
    } else if (selectedBounds.right > rowBounds.right - padding) {
      row.scrollLeft += selectedBounds.right - rowBounds.right + padding;
    }
  }, [value]);

  function navigate(destination: string) {
    if (pending || destination === value || !confirmNavigation()) {
      return;
    }

    startTransition(() => {
      router.push(destination, { scroll: false });
    });
  }

  return (
    <div className="w-full min-w-0">
      <p id={id} className="sr-only">
        Select {label.toLowerCase()}
      </p>

      <div
        ref={rowRef}
        role="group"
        aria-labelledby={id}
        aria-busy={pending}
        className="
          flex w-full min-w-0 snap-x snap-proximity
          gap-2 overflow-x-auto overscroll-x-contain
          px-1 py-2
        "
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              ref={selected ? selectedRef : undefined}
              title={option.label}
              type="button"
              aria-pressed={selected}
              disabled={pending}
              onClick={() => navigate(option.value)}
              className={`
                shrink-0 snap-start rounded-lg border
                px-4 py-3 transition-colors
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-red-400
                disabled:cursor-wait
                ${
                  isWorkout
                    ? "min-h-12 min-w-28 text-center"
                    : "min-h-12 min-w-24 text-center"
                }
                ${
                  selected
                    ? "border-hal-red bg-hal-red/10 text-foreground"
                    : "border-white/15 bg-panel text-muted hover:border-white/30 hover:text-foreground"
                }
              `}
            >
              <span className="block text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      <span role="status" className="sr-only">
        {pending ? `Opening ${label.toLowerCase()}…` : ""}
      </span>
    </div>
  );
}
