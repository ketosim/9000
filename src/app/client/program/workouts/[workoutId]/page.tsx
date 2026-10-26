import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileSetList } from "../mobile-set-list";

type PrescribedSet = {
  id: string;
  setNumber: number;
  setType: string;
  repsMin: number;
  repsMax: number;
  targetLoad: number | null;
  rir: number | null;
  restSeconds: number | null;
  sideOverride: string | null;
  notes: string;
};

type AssignedExercise = {
  id: string;
  name: string;
  position: number;
  variation: string;
  targetMuscles: string;
  machineSettings: string;
  attachment: string;
  setupInstructions: string;
  side: string;
  loadConvention: string;
  loadUnit: string;
  coachingCues: string;
  exerciseGroup: string;
  coachNotes: string;
  isDeload: boolean;
  personalisationNotes: string;
  sets: PrescribedSet[];
};

type AssignedWorkout = {
  id: string;
  position: number;
  estimatedMinutes: number | null;
  warmupNotes: string;
  week: {
    id: string;
    weekNumber: number;
    focus: string;
    coachingNotes: string;
  };
  template: {
    id: string;
    name: string;
    position: number;
  };
  mesocycle: {
    id: string;
    name: string;
  };
  block: {
    id: string;
    name: string;
  };
  exercises: AssignedExercise[];
};

type PageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ClientWorkoutPage({
  params,
}: PageProps) {
  const { workoutId } = await params;

  if (!uuidPattern.test(workoutId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_client_assigned_workout",
    {
      p_workout_id: workoutId,
    },
  );

  if (error || !data) {
    if (error) {
      console.error("Could not load assigned client workout", {
        code: error.code,
        message: error.message,
      });
    }

    notFound();
  }

  const workout = data as AssignedWorkout;

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/client/program"
          className="inline-flex min-h-11 items-center rounded-lg text-sm text-muted transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          ← Back to training plan
        </Link>

        <header className="mt-5">
          <p className="break-words text-xs uppercase tracking-[0.16em] text-blue-700">
            {workout.template.name} · Week{" "}
            {workout.week.weekNumber}
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Workout {workout.position}
          </h1>

          <p className="mt-2 break-words text-sm text-muted">
            {workout.block.name} · {workout.mesocycle.name}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {workout.estimatedMinutes && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
                Approximately {workout.estimatedMinutes} min
              </span>
            )}

            {workout.week.focus && (
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-800">
                {workout.week.focus}
              </span>
            )}
          </div>
        </header>

        {(workout.warmupNotes ||
          workout.week.coachingNotes) && (
          <details className="hal-panel mt-6 rounded-2xl">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-blue-500">
              Before you start
              <span aria-hidden="true" className="text-blue-700">
                +
              </span>
            </summary>

            <div className="space-y-5 border-t border-blue-100 p-4">
              {workout.week.coachingNotes && (
                <div>
                  <h2 className="text-xs uppercase tracking-[0.12em] text-muted">
                    Coach&apos;s weekly notes
                  </h2>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {workout.week.coachingNotes}
                  </p>
                </div>
              )}

              {workout.warmupNotes && (
                <div>
                  <h2 className="text-xs uppercase tracking-[0.12em] text-muted">
                    Warm-up
                  </h2>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {workout.warmupNotes}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}

        <section
          className="mt-8"
          aria-labelledby="exercises-heading"
        >
          <div className="flex items-end justify-between gap-3">
            <h2
              id="exercises-heading"
              className="text-2xl font-semibold"
            >
              Exercises
            </h2>

            <span className="shrink-0 text-sm text-muted">
              {workout.exercises.length}
            </span>
          </div>

          {workout.exercises.length === 0 ? (
            <div className="hal-panel mt-4 rounded-2xl p-5">
              <p className="text-sm text-muted">
                No exercises have been prescribed for this workout.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {workout.exercises.map((exercise) => {
                const details = [
                  ["Variation", exercise.variation],
                  ["Target muscles", exercise.targetMuscles],
                  [
                    "Machine settings",
                    exercise.machineSettings,
                  ],
                  ["Attachment", exercise.attachment],
                  [
                    "Side",
                    exercise.side
                      ? formatLabel(exercise.side)
                      : "",
                  ],
                  [
                    "Load convention",
                    exercise.loadConvention
                      ? formatLabel(exercise.loadConvention)
                      : "",
                  ],
                  [
                    "Superset / circuit",
                    exercise.exerciseGroup,
                  ],
                ].filter(([, value]) => Boolean(value));

                const hasInstructions = Boolean(
                  details.length ||
                    exercise.setupInstructions ||
                    exercise.coachingCues ||
                    exercise.coachNotes,
                );

                return (
                  <article
                    key={exercise.id}
                    className="hal-panel overflow-hidden rounded-2xl"
                  >
                    <header className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-mono text-sm font-semibold text-blue-800">
                          {String(exercise.position).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-lg font-semibold">
                              {exercise.name}
                            </h3>

                            {exercise.isDeload && (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                Deload
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-muted">
                            {exercise.sets.length} prescribed{" "}
                            {exercise.sets.length === 1
                              ? "set"
                              : "sets"}
                          </p>
                        </div>
                      </div>

                      {exercise.personalisationNotes && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-800">
                            Personalised instruction
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-blue-950">
                            {exercise.personalisationNotes}
                          </p>
                        </div>
                      )}
                    </header>

                    <MobileSetList
                      sets={exercise.sets}
                      loadUnit={exercise.loadUnit}
                    />

                    {hasInstructions && (
                      <details className="border-t border-blue-100">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500">
                          Exercise details
                          <span aria-hidden="true">+</span>
                        </summary>

                        <div className="space-y-5 border-t border-blue-100 p-4">
                          {details.length > 0 && (
                            <dl className="grid gap-3">
                              {details.map(([label, value]) => (
                                <div
                                  key={label}
                                  className="rounded-lg border border-blue-100 bg-white p-3"
                                >
                                  <dt className="text-xs uppercase tracking-[0.08em] text-muted">
                                    {label}
                                  </dt>
                                  <dd className="mt-1 break-words text-sm">
                                    {value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          {exercise.setupInstructions && (
                            <div>
                              <h4 className="text-xs uppercase tracking-[0.1em] text-muted">
                                Setup
                              </h4>

                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                                {exercise.setupInstructions}
                              </p>
                            </div>
                          )}

                          {exercise.coachingCues && (
                            <div>
                              <h4 className="text-xs uppercase tracking-[0.1em] text-muted">
                                Coaching cues
                              </h4>

                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                                {exercise.coachingCues}
                              </p>
                            </div>
                          )}

                          {exercise.coachNotes && (
                            <div>
                              <h4 className="text-xs uppercase tracking-[0.1em] text-muted">
                                Coach notes
                              </h4>

                              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                                {exercise.coachNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}