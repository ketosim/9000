"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function WorkoutPanels({
  exercises,
  addExercise,
}: {
  exercises: ReactNode;
  addExercise: ReactNode;
}) {
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));

      if (!id) return;

      const target = document.getElementById(id);
      const pane = scroll.current;

      if (target && pane?.contains(target)) {
        pane.scrollTop +=
          target.getBoundingClientRect().top -
          pane.getBoundingClientRect().top -
          12;
      }
    };

    reveal();
    window.addEventListener("hashchange", reveal);

    return () => {
      window.removeEventListener("hashchange", reveal);
    };
  }, [exercises]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-background px-4 py-2 sm:px-6">
        <h2 className="text-sm font-semibold">Exercises</h2>

        {addExercise}
      </header>

      <div
        ref={scroll}
        data-workspace-scroll
        tabIndex={0}
        aria-label="Workout exercises"
        className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 py-5 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand-blue sm:px-6"
      >
        {exercises}
      </div>
    </section>
  );
}
