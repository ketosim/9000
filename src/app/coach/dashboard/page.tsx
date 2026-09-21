import Link from "next/link";
import { logout } from "@/app/logout/actions";

const stats = [
  { label: "Active clients", value: "12" },
  { label: "Sessions this week", value: "38" },
  { label: "Completion rate", value: "91%" },
];

const clients = [
  {
    name: "Maya Chen",
    initials: "MC",
    program: "Lower Body Strength",
    status: "Workout completed",
  },
  {
    name: "Alex Morgan",
    initials: "AM",
    program: "Hypertrophy Block 2",
    status: "Check-in needs review",
  },
  {
    name: "Jordan Lee",
    initials: "JL",
    program: "Foundation Block",
    status: "Training tomorrow",
  },
];

export default function CoachDashboard() {
  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-mono text-xl font-black tracking-[0.18em] text-foreground"
          >
            9000
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-panel font-mono text-xs font-semibold text-muted">
              SH
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="min-h-11 rounded-lg border border-white/15 bg-panel px-4 py-2 text-sm font-medium text-muted transition active:scale-95 active:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Thursday
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Coach overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Your clients are moving. Here&apos;s what needs your attention.
          </p>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className="hal-panel relative overflow-hidden rounded-xl p-5 sm:p-6"
            >
              {index === 0 && (
                <div className="absolute left-0 top-0 h-full w-1 bg-hal-red" />
              )}

              <p className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
                {stat.value}
              </p>

              <p className="mt-3 text-sm text-muted">{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hal-red-bright">
                Clients
              </p>

              <h2 className="mt-2 text-2xl font-semibold">Needs attention</h2>
            </div>

            <button
              type="button"
              className="min-h-11 shrink-0 rounded-lg bg-hal-red px-4 py-2 text-sm font-semibold text-white transition active:scale-95 active:bg-hal-red-dark"
            >
              Add client
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {clients.map((client) => (
              <article
                key={client.name}
                className="hal-panel flex min-h-20 items-center gap-4 rounded-xl p-4 sm:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-hal-red/40 bg-hal-red-dark/20 font-mono text-xs font-semibold text-hal-red-bright">
                  {client.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">
                    {client.name}
                  </h3>

                  <p className="mt-1 truncate text-sm text-muted">
                    {client.program}
                  </p>

                  <p className="mt-2 text-xs text-muted sm:hidden">
                    {client.status}
                  </p>
                </div>

                <p className="hidden text-sm text-muted sm:block">
                  {client.status}
                </p>

                <span
                  aria-hidden="true"
                  className="font-mono text-lg text-hal-red-bright"
                >
                  ›
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="hal-panel relative overflow-hidden rounded-2xl p-6 sm:p-7">
            <div className="absolute left-0 top-0 h-1 w-full bg-hal-red" />

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hal-red-bright">
              Program builder
            </p>

            <h2 className="mt-8 text-2xl font-semibold sm:text-3xl">
              Create a new mesocycle
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Build weeks, sessions, exercises and progression targets.
            </p>

            <button
              type="button"
              className="mt-7 min-h-11 rounded-lg border border-white/15 bg-panel-light px-5 py-2 text-sm font-medium text-foreground transition active:scale-[0.98] active:border-hal-red/60"
            >
              Create program
            </button>
          </article>

          <article className="hal-panel relative overflow-hidden rounded-2xl p-6 sm:p-7">
            <div className="absolute left-0 top-0 h-1 w-full bg-white/20" />

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Weekly review
            </p>

            <h2 className="mt-8 text-2xl font-semibold sm:text-3xl">
              7 check-ins waiting
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Review recovery, sleep, caffeine and training feedback.
            </p>

            <button
              type="button"
              className="mt-7 min-h-11 rounded-lg border border-white/15 bg-panel-light px-5 py-2 text-sm font-medium text-foreground transition active:scale-[0.98] active:border-hal-red/60"
            >
              Review check-ins
            </button>
          </article>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6">
          <p className="text-xs text-muted">Coach dashboard</p>
        </footer>
      </div>
    </main>
  );
}