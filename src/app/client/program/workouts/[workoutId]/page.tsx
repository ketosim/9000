import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

function formatReps(set: PrescribedSet) {
  if (set.repsMin === set.repsMax) {
    return String(set.repsMin);
  }

  return `${set.repsMin}–${set.repsMax}`;
}

function formatLoad(
  set: PrescribedSet,
  exercise: AssignedExercise,
) {
  if (set.targetLoad === null) {
    return "—";
  }

  return `${set.targetLoad} ${exercise.loadUnit}`;
}

function formatRest(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds
    ? `${minutes} min ${remainingSeconds} sec`
    : `${minutes} min`;
}

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
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/client/program"
          className="inline-flex min-h-11 items-center rounded-lg text-sm text-muted transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          ← Back to training plan
        </Link>

        <header className="mt-7">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-700">
            {workout.template.name} · Week{" "}
            {workout.week.weekNumber}
          </p>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Workout {workout.position}
              </h1>

              <p className="mt-3 text-sm text-muted">
                {workout.block.name} · {workout.mesocycle.name}
              </p>
            </div>

            {workout.estimatedMinutes && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
                Approximately {workout.estimatedMinutes} min
              </span>
            )}
          </div>

          {workout.week.focus && (
            <p className="mt-5 text-sm font-medium text-foreground">
              Week focus: {workout.week.focus}
            </p>
          )}
        </header>

        {(workout.warmupNotes ||
          workout.week.coachingNotes) && (
          <section
            className="hal-panel mt-8 rounded-2xl p-5 sm:p-6"
            aria-labelledby="preparation-heading"
          >
            <h2
              id="preparation-heading"
              className="text-xl font-semibold"
            >
              Before you start
            </h2>

            {workout.week.coachingNotes && (
              <div className="mt-4">
                <h3 className="text-xs uppercase tracking-[0.12em] text-muted">
                  Coach&apos;s weekly notes
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {workout.week.coachingNotes}
                </p>
              </div>
            )}

            {workout.warmupNotes && (
              <div className="mt-4">
                <h3 className="text-xs uppercase tracking-[0.12em] text-muted">
                  Warm-up
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                  {workout.warmupNotes}
                </p>
              </div>
            )}
          </section>
        )}

        <section
          className="mt-10"
          aria-labelledby="exercises-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="exercises-heading"
              className="text-2xl font-semibold"
            >
              Exercises
            </h2>

            <span className="text-sm text-muted">
              {workout.exercises.length}{" "}
              {workout.exercises.length === 1
                ? "exercise"
                : "exercises"}
            </span>
          </div>

          {workout.exercises.length === 0 ? (
            <div className="hal-panel mt-5 rounded-2xl p-6">
              <p className="text-sm text-muted">
                No exercises have been prescribed for this workout.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
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

                return (
                  <article
                    key={exercise.id}
                    className="hal-panel overflow-hidden rounded-2xl"
                  >
                    <header className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 font-mono text-sm font-semibold text-blue-800">
                          {String(exercise.position).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-xl font-semibold">
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
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-800">
                            Personalised instruction
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-blue-950">
                            {exercise.personalisationNotes}
                          </p>
                        </div>
                      )}

                      {details.length > 0 && (
                        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                          {details.map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-lg border border-blue-100 bg-white p-3"
                            >
                              <dt className="text-xs uppercase tracking-[0.1em] text-muted">
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
                        <div className="mt-5">
                          <h4 className="text-xs uppercase tracking-[0.12em] text-muted">
                            Setup
                          </h4>

                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                            {exercise.setupInstructions}
                          </p>
                        </div>
                      )}

                      {exercise.coachingCues && (
                        <div className="mt-5">
                          <h4 className="text-xs uppercase tracking-[0.12em] text-muted">
                            Coaching cues
                          </h4>

                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                            {exercise.coachingCues}
                          </p>
                        </div>
                      )}
                    </header>

                    <div className="overflow-x-auto border-t border-blue-100">
                      <table className="w-full min-w-[650px] text-left text-sm tabular-nums">
                        <caption className="sr-only">
                          Prescribed sets for {exercise.name}
                        </caption>

                        <thead className="bg-blue-50/70 text-xs uppercase tracking-[0.08em] text-muted">
                          <tr>
                            <th className="px-4 py-3 font-medium">
                              Set
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Type
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Reps
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Load
                            </th>
                            <th className="px-4 py-3 font-medium">
                              RIR
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Rest
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-blue-100">
                          {exercise.sets.map((set) => (
                            <tr key={set.id}>
                              <td className="px-4 py-3 font-semibold">
                                {set.setNumber}
                              </td>
                              <td className="px-4 py-3">
                                {formatLabel(set.setType)}
                              </td>
                              <td className="px-4 py-3">
                                {formatReps(set)}
                              </td>
                              <td className="px-4 py-3">
                                {formatLoad(set, exercise)}
                              </td>
                              <td className="px-4 py-3">
                                {set.rir ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {formatRest(set.restSeconds)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {exercise.sets.some(
                      (set) =>
                        set.notes || set.sideOverride,
                    ) && (
                      <div className="space-y-2 border-t border-blue-100 p-5 text-sm">
                        {exercise.sets
                          .filter(
                            (set) =>
                              set.notes ||
                              set.sideOverride,
                          )
                          .map((set) => (
                            <p key={set.id}>
                              <span className="font-semibold">
                                Set {set.setNumber}:
                              </span>{" "}
                              {set.sideOverride
                                ? `${formatLabel(
                                    set.sideOverride,
                                  )}${set.notes ? " · " : ""}`
                                : ""}
                              {set.notes}
                            </p>
                          ))}
                      </div>
                    )}

                    {exercise.coachNotes && (
                      <div className="border-t border-blue-100 p-5">
                        <h4 className="text-xs uppercase tracking-[0.12em] text-muted">
                          Coach notes
                        </h4>

                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                          {exercise.coachNotes}
                        </p>
                      </div>
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