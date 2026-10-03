const recentSessions = [
  {
    date: "18 Sep",
    name: "Glutes & Hamstrings",
    duration: "47 min",
    completed: "13 sets",
  },
  {
    date: "15 Sep",
    name: "Upper Body",
    duration: "52 min",
    completed: "16 sets",
  },
  {
    date: "12 Sep",
    name: "Quads & Calves",
    duration: "43 min",
    completed: "14 sets",
  },
];

const weeklyVolume = [42, 58, 51, 72, 65, 84];

export default function ClientProgressPage() {
  const maxVolume = Math.max(...weeklyVolume);

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Training history
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Your progress
          </h1>

          <p className="mt-3 text-sm text-muted">
            A summary of your recent training and consistency.
          </p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className="hal-panel rounded-xl p-5">
            <p className="text-sm text-muted">Sessions</p>
            <p className="mt-3 text-3xl font-semibold">18</p>
          </article>

          <article className="hal-panel rounded-xl p-5">
            <p className="text-sm text-muted">Completion</p>
            <p className="mt-3 text-3xl font-semibold">92%</p>
          </article>

          <article className="hal-panel col-span-2 rounded-xl p-5 sm:col-span-1">
            <p className="text-sm text-muted">Current streak</p>
            <p className="mt-3 text-3xl font-semibold">4 weeks</p>
          </article>
        </section>

        <section className="hal-panel mt-8 rounded-2xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
                Weekly volume
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Working sets</h2>
            </div>

            <p className="text-sm text-muted">Last 6 weeks</p>
          </div>

          <div className="mt-8 flex h-44 items-end gap-3">
            {weeklyVolume.map((volume, index) => {
              const height = Math.max((volume / maxVolume) * 100, 8);

              return (
                <div
                  key={`${volume}-${index}`}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div
                    className="w-full rounded-t-md bg-hal-red/80"
                    style={{ height: `${height}%` }}
                  />

                  <p className="text-center font-mono text-[10px] text-muted">
                    W{index + 1}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
                History
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Recent sessions</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentSessions.map((session) => (
              <article
                key={`${session.date}-${session.name}`}
                className="hal-panel rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-hal-red-bright">
                      {session.date}
                    </p>

                    <h3 className="mt-2 font-medium">{session.name}</h3>

                    <p className="mt-1 text-sm text-muted">
                      {session.completed}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm text-muted">
                    {session.duration}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}