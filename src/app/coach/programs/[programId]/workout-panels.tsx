"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function WorkoutPanels({
  exercises,
  progression,
  addExercise,
  initialView = "exercises",
}: {
  exercises: ReactNode;
  progression: ReactNode;
  addExercise: ReactNode;
  initialView?: "exercises" | "progression";
}) {
  const [view, setView] = useState(initialView);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Server actions return to the saved exercise. Scroll only this pane.
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
    return () => window.removeEventListener("hashchange", reveal);
  }, [exercises, view]);
  return (
    <section
      className="flex min-h-0 flex-1 flex-col"
      onClickCapture={(event) => {
        const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          "a[data-exercise-link]",
        );
        if (
          anchor &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          event.button === 0
        ) {
          setView("exercises");
        }
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-background px-4 py-1 sm:px-6">
        <div
          role="tablist"
          aria-label="Workout view"
          className="flex gap-1 rounded-lg border border-white/15 p-1"
        >
          {(["exercises", "progression"] as const).map((item) => (
            <button
              key={item}
              id={`view-${item}`}
              type="button"
              role="tab"
              aria-selected={view === item}
              aria-controls={`panel-${item}`}
              tabIndex={view === item ? 0 : -1}
              onClick={() => {
                setView(item);
                if (scroll.current) scroll.current.scrollTop = 0;
              }}
              onKeyDown={(event) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "exercises"
                      : event.key === "End"
                        ? "progression"
                        : item === "exercises"
                          ? "progression"
                          : "exercises";
                  setView(next);
                  document.getElementById(`view-${next}`)?.focus();
                }
              }}
              className={`min-h-11 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-red-400 ${view === item ? "bg-panel-light text-white" : "text-muted"}`}
            >
              {item === "exercises" ? "Exercises" : "Progression"}
            </button>
          ))}
        </div>
        {view === "exercises" && addExercise}
      </header>
      <div
        ref={scroll}
        data-workspace-scroll
        tabIndex={0}
        aria-label="Workout content"
        className="min-h-0 flex-1 overflow-auto overscroll-contain px-4 py-5 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-red-400 sm:px-6"
      >
        <div
          role="tabpanel"
          id="panel-exercises"
          aria-labelledby="view-exercises"
          hidden={view !== "exercises"}
        >
          {exercises}
        </div>
        <div
          role="tabpanel"
          id="panel-progression"
          aria-labelledby="view-progression"
          hidden={view !== "progression"}
        >
          {progression}
        </div>
      </div>
    </section>
  );
}
