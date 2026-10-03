import Link from "next/link";
import { FormDialog } from "@/components/forms/form-dialog";
import { ProgressionLinkForm } from "./progression-link-form";
import {
  matchingExercise,
  summarizePrescription,
  type ProgressionExercise,
} from "./progression-model";
import type { WorkspaceWeek, WorkspaceWorkout } from "./workspace-selection";

export function ProgressionView({
  programId,
  weeks,
  workout,
  exercises,
  currentExercises,
  revision,
  fixedStructure = true,
  readOnly = false,
}: {
  programId: string;
  revision: number;
  fixedStructure?: boolean;
  readOnly?: boolean;
  weeks: WorkspaceWeek[];
  workout: WorkspaceWorkout;
  exercises: ProgressionExercise[];
  currentExercises: ProgressionExercise[];
}) {
  const columns = weeks.map((week) => ({
    week,
    linked: week.program_workouts.find(
      (item) => item.progression_key === workout.progression_key,
    ),
  }));
  function linkForm(
    kind: "workout" | "exercise",
    referenceId: string,
    options: { value: string; label: string }[],
    unlink = false,
  ) {
    return (
      <ProgressionLinkForm
        programId={programId}
        revision={revision}
        workoutId={workout.id}
        kind={kind}
        referenceId={referenceId}
        options={options}
        unlink={unlink}
      />
    );
  }
  return (
    <section aria-label="Planned progression">
      <h2 className="text-xl font-semibold">Planned progression</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Compare prescribed sets across weeks. Copying a week links its
        corresponding exercises automatically. You can also link exercises
        manually. Tap a prescription to open it.
      </p>
      <p className="mt-2 text-xs text-muted">
        These are planned values, not client results. Loads never increase
        automatically.
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-white/15">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Workout {workout.position}: prescribed sets by week
          </caption>
          <thead>
            <tr className="bg-panel-raised">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-44 border-b border-white/10 bg-panel-raised p-4"
              >
                Exercise
              </th>
              {columns.map(({ week, linked }) => (
                <th
                  scope="col"
                  key={week.id}
                  className="min-w-56 border-b border-l border-white/10 p-4 align-top"
                >
                  <p>
                    Week {week.week_number}
                    {week.is_deload ? " · Deload" : ""}
                  </p>
                  {linked ? (
                    <>
                      <p className="mt-2 text-xs font-normal text-muted">
                        Workout {linked.position}
                      </p>
                      {!fixedStructure &&
                        !readOnly &&
                        linked.id !== workout.id && (
                          <div className="mt-2">
                            <FormDialog
                              title={`Unlink week ${week.week_number} workout`}
                              trigger="Unlink"
                            >
                              {linkForm(
                                "workout",
                                workout.id,
                                [
                                  {
                                    value: linked.id,
                                    label: `Workout ${linked.position}`,
                                  },
                                ],
                                true,
                              )}
                            </FormDialog>
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="mt-2">
                      {!readOnly && week.program_workouts.length ? (
                        <FormDialog
                          title={`Link workout · Week ${week.week_number}`}
                          trigger="Link workout"
                        >
                          {linkForm(
                            "workout",
                            workout.id,
                            [...week.program_workouts]
                              .sort((a, b) => a.position - b.position)
                              .map((item) => ({
                                value: item.id,
                                label: `Workout ${item.position}`,
                              })),
                          )}
                        </FormDialog>
                      ) : (
                        <span className="text-xs font-normal text-muted">
                          No workouts yet
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentExercises.map((exercise) => (
              <tr key={exercise.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-white/10 bg-panel p-4 align-top font-medium"
                >
                  {exercise.name}
                </th>
                {columns.map(({ week, linked }) => {
                  const match =
                    linked &&
                    matchingExercise(
                      exercises,
                      linked.id,
                      exercise.progression_key,
                    );
                  const candidates = linked
                    ? exercises.filter((item) => item.workout_id === linked.id)
                    : [];
                  return (
                    <td
                      key={week.id}
                      className="border-b border-l border-white/10 p-3 align-top"
                    >
                      {match ? (
                        <>
                          <Link
                            data-exercise-link
                            href={`/coach/programs/${programId}/workouts/${linked!.id}#exercise-${match.id}`}
                            className="block min-h-12 rounded-lg border border-white/10 bg-panel p-3 leading-relaxed hover:border-hal-red focus-visible:outline-2 focus-visible:outline-red-400"
                          >
                            <span className="block text-xs text-muted">
                              {match.name}
                            </span>
                            <span className="mt-1 block">
                              {summarizePrescription(match)}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              {match.load_convention.replaceAll("_", " ")}
                            </span>
                          </Link>
                          {!readOnly && linked!.id !== workout.id && (
                            <div className="mt-2">
                              <FormDialog
                                title={`Unlink ${match.name}`}
                                trigger="Unlink"
                              >
                                {linkForm(
                                  "exercise",
                                  exercise.id,
                                  [{ value: match.id, label: match.name }],
                                  true,
                                )}
                              </FormDialog>
                            </div>
                          )}
                        </>
                      ) : !readOnly && linked && candidates.length ? (
                        <FormDialog
                          title={`Link ${exercise.name} · Week ${week.week_number}`}
                          trigger="Link exercise"
                        >
                          {linkForm(
                            "exercise",
                            exercise.id,
                            candidates.map((item) => ({
                              value: item.id,
                              label: `${item.position}. ${item.name}`,
                            })),
                          )}
                        </FormDialog>
                      ) : (
                        <p className="p-2 text-xs text-muted">
                          {linked ? "No linked exercise" : "No linked workout"}
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!currentExercises.length && (
        <p className="mt-5 text-sm text-muted">
          Add exercises to the selected workout to compare their prescriptions.
        </p>
      )}
    </section>
  );
}
