import { logout } from "@/app/logout/actions";

const exercises = [
  {
    name: "Barbell Hip Thrust",
    prescription: "4 sets × 8–10 reps",
    detail: "RIR 2",
  },
  {
    name: "Leg Press",
    prescription: "3 sets × 10–12 reps",
    detail: "RIR 2",
  },
  {
    name: "Romanian Deadlift",
    prescription: "3 sets × 8–10 reps",
    detail: "RIR 3",
  },
  {
    name: "Cable Abduction",
    prescription: "3 sets × 12–15 reps",
    detail: "RIR 2",
  },
];

export default function ClientTodayPage() {
  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        <header className="flex items-center justify-between gap-4">
          <div
            role="status"
            className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-hal-amber" />
            <span>Offline · sync later</span>
          </div>

          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-white/15 bg-panel px-4 py-2 text-sm font-medium text-muted transition active:scale-95 active:text-white"
            >
              Log out
            </button>
          </form>
        </header>



        <section className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-hal-red-bright">
            Today&apos;s training
          </p>


          <p className="mt-3 text-sm text-muted">
            Lower Body Strength · Week 3 · Session 2
          </p>
        </section>

        <section className="hal-panel relative mt-8 overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-1 w-24 bg-hal-red" />

          <p className="font-mono text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Lower body
          </p>

          <div className="mt-4 flex items-start justify-between gap-5">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Glutes &amp; Hamstrings
              </h2>

              <p className="mt-3 text-sm text-muted">
                Estimated duration · 45 minutes
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-hal-red/50 bg-hal-red-dark/20 font-mono text-sm font-semibold text-hal-red-bright">
              45m
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 border-y border-white/10 py-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Exercises
              </p>
              <p className="mt-2 text-xl font-semibold">4</p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Sets
              </p>
              <p className="mt-2 text-xl font-semibold">13</p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Effort
              </p>
              <p className="mt-2 text-xl font-semibold">RIR 2</p>
            </div>
          </div>

          <button
            type="button"
            className="mt-7 min-h-12 w-full rounded-lg bg-hal-red px-6 py-3 font-semibold text-white transition active:scale-[0.98] active:bg-hal-red-dark"
          >
            Start workout
          </button>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hal-red-bright">
                Today
              </p>

              <h2 className="mt-2 text-2xl font-semibold">Workout plan</h2>
            </div>

            <p className="text-xs text-muted">4 exercises</p>
          </div>

          <div className="mt-5 space-y-3">
            {exercises.map((exercise, index) => (
              <article
                key={exercise.name}
                className="hal-panel flex min-h-20 items-center gap-4 rounded-xl p-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hal-red/50 bg-hal-red-dark/30 font-mono text-sm font-bold text-hal-red-bright">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">
                    {exercise.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted">
                    {exercise.prescription}
                  </p>
                </div>

                <span className="shrink-0 border-l border-white/10 pl-3 font-mono text-[11px] text-muted">
                  {exercise.detail}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="hal-panel mt-12 rounded-2xl p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Vibe Check
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            How are you feeling?
          </h2>

          <p className="mt-2 text-sm text-muted">
            Check in before starting today&apos;s workout.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["Sleep", "Energy", "Soreness"].map((item) => (
              <button
                type="button"
                key={item}
                className="min-h-12 rounded-lg border border-white/10 bg-panel-light px-4 py-3 text-sm text-muted transition active:scale-[0.98] active:border-hal-red/60 active:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6">
          <p className="text-xs text-muted">Every gram counts.</p>
        </footer>
      </div>
    </main>
  );
}