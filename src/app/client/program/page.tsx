const weeks = [
  { week: "Week 1", status: "Completed", sessions: "3 of 3 sessions" },
  { week: "Week 2", status: "Completed", sessions: "3 of 3 sessions" },
  { week: "Week 3", status: "Current", sessions: "1 of 3 sessions" },
  { week: "Week 4", status: "Upcoming", sessions: "0 of 3 sessions" },
];

export default function ClientProgramPage() {
  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Current program
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Lower Body Strength
          </h1>

          <p className="mt-3 text-sm text-muted">
            Four-week training block · Week 3 of 4
          </p>
        </header>

        <section className="hal-panel mt-8 rounded-2xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Overall progress</p>
              <p className="mt-2 text-3xl font-semibold">58%</p>
            </div>

            <p className="text-sm text-muted">7 of 12 sessions</p>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[58%] bg-hal-red" />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Training weeks</h2>

          <div className="mt-5 space-y-3">
            {weeks.map((item) => {
              const current = item.status === "Current";

              return (
                <article
                  key={item.week}
                  className={`hal-panel rounded-xl border p-5 ${
                    current
                      ? "border-hal-red/60"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium">{item.week}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {item.sessions}
                      </p>
                    </div>

                    <span
                      className={`text-xs uppercase tracking-[0.12em] ${
                        current
                          ? "text-hal-red-bright"
                          : "text-muted"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}