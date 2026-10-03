const reviews = [
  {
    client: "Alex Morgan",
    initials: "AM",
    submitted: "Today · 8:42 AM",
    sleep: 6,
    energy: 5,
    soreness: 7,
    note: "Lower back feels tight after the last session.",
    priority: true,
  },
  {
    client: "Maya Chen",
    initials: "MC",
    submitted: "Yesterday · 6:15 PM",
    sleep: 8,
    energy: 8,
    soreness: 3,
    note: "Training felt strong. Ready to increase the load.",
    priority: false,
  },
  {
    client: "Jordan Lee",
    initials: "JL",
    submitted: "Yesterday · 9:30 AM",
    sleep: 7,
    energy: 6,
    soreness: 4,
    note: "Slight shoulder fatigue but otherwise feeling good.",
    priority: false,
  },
];

export default function CoachReviewsPage() {
  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Client feedback
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Reviews
          </h1>

          <p className="mt-3 text-sm text-muted">
            Review readiness, recovery and training feedback.
          </p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className="hal-panel rounded-xl p-5">
            <p className="text-sm text-muted">Waiting</p>
            <p className="mt-3 text-3xl font-semibold">03</p>
          </article>

          <article className="hal-panel rounded-xl p-5">
            <p className="text-sm text-muted">Priority</p>
            <p className="mt-3 text-3xl font-semibold text-hal-red-bright">
              01
            </p>
          </article>

          <article className="hal-panel col-span-2 rounded-xl p-5 sm:col-span-1">
            <p className="text-sm text-muted">Reviewed this week</p>
            <p className="mt-3 text-3xl font-semibold">14</p>
          </article>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Waiting for review</h2>

            <button
              type="button"
              className="min-h-11 rounded-lg border border-white/10 bg-panel px-4 text-sm text-muted transition active:bg-panel-light active:text-white"
            >
              Filter
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <article
                key={review.client}
                className={`hal-panel rounded-2xl p-5 sm:p-6 ${
                  review.priority ? "border-hal-red/60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-panel-light font-semibold">
                    {review.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-medium">
                          {review.client}
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          {review.submitted}
                        </p>
                      </div>

                      {review.priority && (
                        <span className="rounded-full border border-hal-red/40 px-3 py-1 text-xs text-hal-red-bright">
                          Needs attention
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 border-y border-white/10 py-4">
                  <div>
                    <p className="text-xs text-muted">Sleep</p>
                    <p className="mt-2 text-xl font-semibold">
                      {review.sleep}/10
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Energy</p>
                    <p className="mt-2 text-xl font-semibold">
                      {review.energy}/10
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Soreness</p>
                    <p className="mt-2 text-xl font-semibold">
                      {review.soreness}/10
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    Client note
                  </p>

                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {review.note}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-6 min-h-12 w-full rounded-xl bg-hal-red px-5 font-medium text-white transition active:scale-[0.99] active:bg-hal-red-dark sm:w-auto"
                >
                  Review check-in
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}