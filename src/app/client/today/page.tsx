import Link from "next/link";

const exercises = [
  {
    name: "Barbell Hip Thrust",
    prescription: "4 sets × 8–10 reps",
    detail: "RIR 2",
    color: "bg-pink-400",
  },
  {
    name: "Leg Press",
    prescription: "3 sets × 10–12 reps",
    detail: "RIR 2",
    color: "bg-orange-400",
  },
  {
    name: "Romanian Deadlift",
    prescription: "3 sets × 8–10 reps",
    detail: "RIR 3",
    color: "bg-lime-400",
  },
  {
    name: "Cable Abduction",
    prescription: "3 sets × 12–15 reps",
    detail: "RIR 2",
    color: "bg-cyan-400",
  },
];

export default function ClientTodayPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-lime-400"
          >
            9000
          </Link>

          <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            Online
          </div>
        </header>

        <section className="mt-12">
          <p className="text-sm font-medium text-zinc-500">GOOD MORNING</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
            Today&apos;s training
          </h1>
          <p className="mt-3 text-zinc-400">
            Lower Body Strength · Week 3 · Session 2
          </p>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white/70">
                LOWER BODY
              </p>
              <h2 className="mt-2 text-3xl font-bold">Glutes &amp; Hamstrings</h2>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-white/40 text-sm font-bold">
              45m
            </div>
          </div>

          <div className="mt-12 flex gap-6 text-sm">
            <div>
              <p className="text-white/60">Exercises</p>
              <p className="mt-1 text-xl font-bold">4</p>
            </div>
            <div>
              <p className="text-white/60">Working sets</p>
              <p className="mt-1 text-xl font-bold">13</p>
            </div>
            <div>
              <p className="text-white/60">Target effort</p>
              <p className="mt-1 text-xl font-bold">RIR 2</p>
            </div>
          </div>

          <button className="mt-8 w-full rounded-full bg-white py-4 font-bold text-black transition hover:bg-zinc-100">
            Start workout
          </button>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Workout plan</h2>

          <div className="mt-5 space-y-3">
            {exercises.map((exercise, index) => (
              <article
                key={exercise.name}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-5"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-black ${exercise.color}`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{exercise.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {exercise.prescription}
                  </p>
                </div>

                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {exercise.detail}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <p className="text-sm font-semibold text-cyan-400">DAILY CHECK-IN</p>
          <h2 className="mt-2 text-2xl font-bold">How are you feeling?</h2>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {["Sleep", "Energy", "Soreness"].map((item) => (
              <button
                key={item}
                className="rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-300 transition hover:bg-zinc-700"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}