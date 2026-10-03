import Link from "next/link";
import { createCoachAdminClient } from "@/lib/supabase/admin";

type Program = {
  id: string;
  name: string;
  goal: string;
  description: string;
  duration_weeks: number;
  sessions_per_week: number;
  status: "draft" | "active" | "archived";
};

export default async function CoachProgramsPage() {
  const admin = await createCoachAdminClient();

  const { data, error } = await admin
    .from("programs")
    .select(
      "id, name, goal, description, duration_weeks, sessions_per_week, status",
    )
    .eq("created_by", process.env.COACH_USER_ID!)
    .order("created_at", { ascending: false });

  const programs: Program[] = data ?? [];

  const stats = [
    {
      label: "Programs",
      value: programs.length,
    },
    {
      label: "Active",
      value: programs.filter((program) => program.status === "active").length,
    },
    {
      label: "Drafts",
      value: programs.filter((program) => program.status === "draft").length,
    },
  ];

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
              Training library
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Programs
            </h1>

            <p className="mt-3 text-sm text-muted">
              Build and manage your training programs.
            </p>
          </div>

          <Link
            href="/coach/programs/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-hal-red px-5 py-3 font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:scale-[0.98] active:bg-hal-red-dark"
          >
            Create program
          </Link>
        </header>

        <section
          aria-label="Program totals"
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className={`hal-panel rounded-xl p-5 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <h2 className="text-sm font-normal text-muted">
                {stat.label}
              </h2>

              <p className="mt-3 text-3xl font-semibold">
                {error ? "—" : String(stat.value).padStart(2, "0")}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">All programs</h2>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200"
            >
              Could not load programs. Check that the programs table
              includes the goal column, then reload.
            </div>
          ) : programs.length === 0 ? (
            <div className="hal-panel mt-5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">
                No programs yet
              </h3>

              <p className="mt-2 text-sm text-muted">
                Select Create program to save your first draft.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {programs.map((program, index) => (
                <article
                  key={program.id}
                  className="hal-panel min-w-0 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs text-hal-red-bright">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${
                        program.status === "active"
                          ? "border-hal-red/30 text-hal-red-bright"
                          : "border-white/10 text-muted"
                      }`}
                    >
                      {program.status}
                    </span>
                  </div>

                  <h3 className="mt-7 break-words text-xl font-semibold">
                    {program.name}
                  </h3>

                  {program.goal && (
                    <p className="mt-2 break-words text-sm text-foreground">
                      {program.goal}
                    </p>
                  )}

                  {program.description && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                      {program.description}
                    </p>
                  )}

                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                    <div>
                      <dt className="text-xs text-muted">
                        Duration
                      </dt>

                      <dd className="mt-1 text-sm font-medium">
                        {program.duration_weeks} weeks
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted">
                        Planned workouts
                      </dt>

                      <dd className="mt-1 text-sm font-medium">
                        {program.sessions_per_week} per week
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}