import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="w-full max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
          Training, structured
        </p>

        <h1 className="text-7xl font-black tracking-tight sm:text-9xl">
          9000
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Build mesocycles, coach smarter and track every workout—even when
          the gym Wi-Fi gives up.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="/coach/dashboard"
            className="rounded-2xl bg-lime-400 p-6 text-zinc-950 transition hover:bg-lime-300"
          >
            <h2 className="text-2xl font-bold">Coach Portal</h2>
            <p className="mt-2 text-zinc-700">
              Build programs, manage clients and review progress.
            </p>
          </Link>

          <Link
            href="/client/today"
            className="rounded-2xl border border-zinc-700 p-6 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            <h2 className="text-2xl font-bold">Client Portal</h2>
            <p className="mt-2 text-zinc-400">
              View today&apos;s training, log sets and track recovery.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}