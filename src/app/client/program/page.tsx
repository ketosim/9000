import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type AssignedWorkout = {
  id: string;
  position: number;
  estimatedMinutes: number | null;
  warmupNotes: string;
};

type AssignedWeek = {
  id: string;
  weekNumber: number;
  focus: string;
  coachingNotes: string;
  workouts: AssignedWorkout[];
};

type AssignedTemplate = {
  id: string;
  name: string;
  goal: string;
  description: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  position: number;
  weeks: AssignedWeek[];
};

type ActivePlan = {
  block: {
    id: string;
    name: string;
    description: string;
    startsOn: string | null;
    status: "active";
  };
  mesocycle: {
    id: string;
    name: string;
    position: number;
    durationWeeks: number | null;
    startsOn: string | null;
    status: "active";
  } | null;
  templates: AssignedTemplate[];
};

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function currentWeek(
  startsOn: string | null,
  durationWeeks: number | null,
) {
  if (!startsOn || !durationWeeks) {
    return null;
  }

  const start = dateOnly(startsOn);
  const now = new Date();

  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const elapsedDays = Math.floor(
    (now.getTime() - start.getTime()) / 86_400_000,
  );

  if (elapsedDays < 0) {
    return 0;
  }

  return Math.min(
    durationWeeks,
    Math.floor(elapsedDays / 7) + 1,
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(dateOnly(value));
}

function weekStatus(
  weekNumber: number,
  activeWeek: number | null,
) {
  if (activeWeek === null) {
    return "Scheduled";
  }

  if (activeWeek === 0) {
    return "Upcoming";
  }

  if (weekNumber < activeWeek) {
    return "Previous";
  }

  if (weekNumber === activeWeek) {
    return "Current";
  }

  return "Upcoming";
}

export default async function ClientProgramPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_client_active_training_plan",
  );

  if (error) {
    console.error("Could not load client training plan", {
      code: error.code,
      message: error.message,
    });
  }

  const plan = !error && data ? (data as ActivePlan) : null;

  if (error) {
    return (
      <main className="hal-grid min-h-dvh bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            Current training
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Training plan
          </h1>

          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-800"
          >
            Your training plan could not be loaded. Refresh the page or
            contact your coach if the problem continues.
          </div>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="hal-grid min-h-dvh bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            Current training
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            No active training block
          </h1>

          <div className="hal-panel mt-8 rounded-2xl p-6">
            <h2 className="text-xl font-semibold">
              Nothing has been scheduled yet
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your coach will assign and activate your training block
              when it is ready.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!plan.mesocycle) {
    return (
      <main className="hal-grid min-h-dvh bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            Active training block
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {plan.block.name}
          </h1>

          <div className="hal-panel mt-8 rounded-2xl p-6">
            <h2 className="text-xl font-semibold">
              No active mesocycle
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              The block is active, but your coach has not activated a
              mesocycle yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const activeWeek = currentWeek(
    plan.mesocycle.startsOn,
    plan.mesocycle.durationWeeks,
  );

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            Active training block
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {plan.block.name}
          </h1>

          {plan.block.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {plan.block.description}
            </p>
          )}

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="hal-panel rounded-xl p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Mesocycle
              </dt>
              <dd className="mt-2 font-semibold">
                {plan.mesocycle.name}
              </dd>
            </div>

            <div className="hal-panel rounded-xl p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Starts
              </dt>
              <dd className="mt-2 font-semibold">
                {formatDate(plan.mesocycle.startsOn)}
              </dd>
            </div>

            <div className="hal-panel rounded-xl p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Current week
              </dt>
              <dd className="mt-2 font-semibold">
                {activeWeek === 0
                  ? "Not started"
                  : activeWeek
                    ? `Week ${activeWeek}`
                    : "Not scheduled"}
              </dd>
            </div>
          </dl>
        </header>

        <section
          className="mt-10"
          aria-labelledby="templates-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="templates-heading"
                className="text-2xl font-semibold"
              >
                Assigned templates
              </h2>

              <p className="mt-2 text-sm text-muted">
                {plan.templates.length}{" "}
                {plan.templates.length === 1
                  ? "training template"
                  : "training templates"}
              </p>
            </div>
          </div>

          {plan.templates.length === 0 ? (
            <div className="hal-panel mt-5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold">
                No templates assigned
              </h3>

              <p className="mt-2 text-sm text-muted">
                Contact your coach before beginning this mesocycle.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {plan.templates.map((template) => (
                <article
                  key={template.id}
                  className="hal-panel overflow-hidden rounded-2xl"
                >
                  <header className="border-b border-blue-100 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.12em] text-blue-700">
                          Training template {template.position}
                        </p>

                        <h3 className="mt-2 break-words text-2xl font-semibold">
                          {template.name}
                        </h3>

                        {template.goal && (
                          <p className="mt-2 text-sm text-foreground">
                            {template.goal}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-800">
                        {template.sessionsPerWeek}{" "}
                        {template.sessionsPerWeek === 1
                          ? "session"
                          : "sessions"}{" "}
                        per week
                      </span>
                    </div>

                    {template.description && (
                      <p className="mt-4 text-sm leading-relaxed text-muted">
                        {template.description}
                      </p>
                    )}
                  </header>

                  <div className="space-y-3 p-4 sm:p-5">
                    {template.weeks.map((week) => {
                      const status = weekStatus(
                        week.weekNumber,
                        activeWeek,
                      );
                      const isCurrent = status === "Current";

                      return (
                        <details
                          key={week.id}
                          open={isCurrent}
                          className={`rounded-xl border bg-white ${
                            isCurrent
                              ? "border-blue-400"
                              : "border-blue-100"
                          }`}
                        >
                          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3 focus-visible:outline-2 focus-visible:outline-blue-500">
                            <div>
                              <h4 className="font-semibold">
                                Week {week.weekNumber}
                                {week.focus
                                  ? ` · ${week.focus}`
                                  : ""}
                              </h4>

                              <p className="mt-1 text-xs text-muted">
                                {week.workouts.length}{" "}
                                {week.workouts.length === 1
                                  ? "workout"
                                  : "workouts"}
                              </p>
                            </div>

                            <span
                              className={`text-xs uppercase tracking-[0.12em] ${
                                isCurrent
                                  ? "font-semibold text-blue-700"
                                  : "text-muted"
                              }`}
                            >
                              {status}
                            </span>
                          </summary>

                          <div className="border-t border-blue-100 p-4">
                            {week.coachingNotes && (
                              <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-muted">
                                {week.coachingNotes}
                              </p>
                            )}

                            {week.workouts.length === 0 ? (
                              <p className="text-sm text-muted">
                                No workouts scheduled.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {week.workouts.map((workout) => (
                                  <Link
                                    key={workout.id}
                                    href={`/client/program/workouts/${workout.id}`}
                                    className="block rounded-lg border border-blue-100 bg-blue-50/50 p-4 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.99]"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="font-semibold">
                                        Workout {workout.position}
                                      </span>

                                      <div className="flex items-center gap-3">
                                        {workout.estimatedMinutes && (
                                          <span className="text-xs text-muted">
                                            {
                                              workout.estimatedMinutes
                                            }{" "}
                                            min
                                          </span>
                                        )}

                                        <span
                                          aria-hidden="true"
                                          className="text-blue-700"
                                        >
                                          ›
                                        </span>
                                      </div>
                                    </div>

                                    {workout.warmupNotes && (
                                      <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-muted">
                                        {workout.warmupNotes}
                                      </p>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}