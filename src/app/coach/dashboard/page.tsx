import Link from "next/link";

const stats = [
  { label: "Active clients", value: "12", color: "text-lime-400" },
  { label: "Sessions this week", value: "38", color: "text-pink-400" },
  { label: "Completion rate", value: "91%", color: "text-orange-400" },
];

const clients = [
  {
    name: "Maya Chen",
    program: "Lower Body Strength",
    status: "Workout completed",
    color: "bg-lime-400",
  },
  {
    name: "Alex Morgan",
    program: "Hypertrophy Block 2",
    status: "Check-in needs review",
    color: "bg-pink-400",
  },
  {
    name: "Jordan Lee",
    program: "Foundation Block",
    status: "Training tomorrow",
    color: "bg-cyan-400",
  },
];

export default function CoachDashboard() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-lime-400"
          >
            9000
          </Link>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold">
            SH
          </div>
        </header>

        <section className="mt-12">
          <p className="text-sm font-medium text-zinc-500">Thursday</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Coach overview
          </h1>
          <p className="mt-3 text-zinc-400">
            Your clients are moving. Here&apos;s what needs your attention.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-zinc-900 p-6"
            >
              <p className={`text-4xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-pink-400">CLIENTS</p>
              <h2 className="mt-1 text-2xl font-bold">Needs attention</h2>
            </div>

            <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Add client
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {clients.map((client) => (
              <article
                key={client.name}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-5 transition hover:bg-zinc-800"
              >
                <div
                  className={`h-12 w-12 shrink-0 rounded-full ${client.color}`}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{client.name}</h3>
                  <p className="truncate text-sm text-zinc-400">
                    {client.program}
                  </p>
                </div>

                <p className="hidden text-sm text-zinc-500 sm:block">
                  {client.status}
                </p>

                <span className="text-zinc-500">›</span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-gradient-to-br from-pink-500 to-orange-500 p-7">
            <p className="text-sm font-semibold text-white/70">
              PROGRAM BUILDER
            </p>
            <h2 className="mt-8 text-3xl font-bold">Create a new mesocycle</h2>
            <p className="mt-2 max-w-md text-white/80">
              Build weeks, sessions, exercises and progression targets.
            </p>
          </article>

          <article className="rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 p-7">
            <p className="text-sm font-semibold text-white/70">
              WEEKLY REVIEW
            </p>
            <h2 className="mt-8 text-3xl font-bold">7 check-ins waiting</h2>
            <p className="mt-2 max-w-md text-white/80">
              Review recovery, sleep, caffeine and training feedback.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}