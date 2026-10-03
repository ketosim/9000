import { randomUUID } from "node:crypto";
import { TemplateActionControl } from "../../../template-action-control";
import {
  createExerciseFields,
  setFields,
  sideOptions,
  setOptions,
} from "./exercise-fields";
import { FormDialog } from "@/components/forms/form-dialog";
import { WorkoutForm } from "./workout-form";
import { EditWorkoutItem } from "./edit-controls";
import { WorkoutPanels } from "../../workout-panels";
import { ProgressionView } from "../../progression-view";
import {
  matchingExercise,
  reps,
  summarizePrescription,
  type ProgressionExercise,
} from "../../progression-model";
import type {
  WorkspaceWeek,
  WorkspaceWorkout,
} from "../../workspace-selection";

export type Exercise = ProgressionExercise & {
  variation: string;
  target_muscles: string;
  machine_settings: string;
  attachment: string;
  setup_instructions: string;
  side: string;
  coaching_cues: string;
  exercise_group: string;
  coach_notes: string;
};
const loadOptions = [
  { value: "total", label: "Total weight" },
  { value: "per_dumbbell", label: "Per dumbbell" },
  { value: "added_plates", label: "Added plates" },
  { value: "machine_display", label: "Machine display" },
  { value: "assistance", label: "Assistance weight" },
  { value: "bodyweight", label: "Bodyweight" },
];
function availableNumbers(used: number[]) {
  return Array.from({ length: 50 }, (_, index) => index + 1)
    .filter((number) => !used.includes(number))
    .map((number) => ({
      value: String(number),
      label: String(number),
    }));
}

export function WorkoutEditor({
  programId,
  workout,
  week,
  weeks,
  exercises,
  initialView,
  revision,
  readOnly = false,
}: {
  programId: string;
  revision: number;
  readOnly?: boolean;
  workout: WorkspaceWorkout;
  week: WorkspaceWeek;
  weeks: WorkspaceWeek[];
  exercises: Exercise[];
  initialView: "exercises" | "progression";
}) {
  const workoutId = workout.id;
  const currentExercises = exercises
    .filter((exercise) => exercise.workout_id === workoutId)
    .sort((a, b) => a.position - b.position);
  const exerciseNumbers = availableNumbers(
    currentExercises.map((exercise) => exercise.position),
  );
  const previousWeek = weeks.find(
    (item) => item.week_number === week.week_number - 1,
  );
  const previousWorkout = previousWeek?.program_workouts.find(
    (item) => item.progression_key === workout.progression_key,
  );
  const addExercise =
    !readOnly && exerciseNumbers.length > 0 ? (
      <FormDialog
        key={`add-exercise-${workoutId}-${currentExercises.length}`}
        title="Add exercise"
        trigger="+ Exercise"
        primary
      >
        <WorkoutForm
          mode="exercise"
          programId={programId}
          revision={revision}
          workoutId={workoutId}
          itemId={randomUUID()}
          submitLabel="Save exercise"
          fields={createExerciseFields}
        />
      </FormDialog>
    ) : (
      <span className="text-xs text-muted">
        {readOnly ? "Preserved program" : "50 exercises added"}
      </span>
    );

  return (
    <WorkoutPanels
      initialView={initialView}
      addExercise={addExercise}
      progression={
        <ProgressionView
          programId={programId}
          weeks={weeks}
          workout={workout}
          exercises={exercises}
          currentExercises={currentExercises}
          revision={revision}
          fixedStructure={!readOnly}
          readOnly={readOnly}
        />
      }
      exercises={
        <section
          aria-label={`Workout ${workout.position} exercises`}
          className="mx-auto max-w-6xl space-y-4"
        >
          {workout.warmup_notes && (
            <details className="rounded-lg border border-white/10 bg-panel px-4">
              <summary className="min-h-11 cursor-pointer py-3 text-sm text-muted">
                Warm-up notes
                {workout.estimated_minutes
                  ? ` · ${workout.estimated_minutes} min workout`
                  : ""}
              </summary>
              <p className="whitespace-pre-line pb-4 text-sm">
                {workout.warmup_notes}
              </p>
            </details>
          )}
          {currentExercises.length === 0 && (
            <div className="hal-panel rounded-xl p-6">
              <h2 className="text-xl font-semibold">No exercises yet</h2>
              <p className="mt-2 text-sm text-muted">
                Tap + Exercise above to build this workout.
              </p>
            </div>
          )}
          {currentExercises.map((exercise, exerciseIndex) => {
            const sets = [...exercise.program_sets].sort(
              (a, b) => a.set_number - b.set_number,
            );
            const hasExistingLoad = sets.some(
              (set) => set.target_load !== null,
            );
            const setNumbers = availableNumbers(
              sets.map((set) => set.set_number),
            );
            const previous =
              previousWorkout &&
              matchingExercise(
                exercises,
                previousWorkout.id,
                exercise.progression_key,
              );
            const details = [
              ["Variation", exercise.variation],
              ["Target muscles", exercise.target_muscles],
              ["Machine settings", exercise.machine_settings],
              ["Attachment", exercise.attachment],
              ["Setup", exercise.setup_instructions],
              [
                "Side",
                sideOptions.find((option) => option.value === exercise.side)
                  ?.label ?? exercise.side,
              ],
              [
                "Load convention",
                (hasExistingLoad ? loadOptions : []).find(
                  (option) => option.value === exercise.load_convention,
                )?.label ?? (hasExistingLoad ? exercise.load_convention : ""),
              ],
              ["Coaching cues", exercise.coaching_cues],
              ["Superset / circuit group", exercise.exercise_group],
              ["Coach notes", exercise.coach_notes],
            ].filter(([, value]) => Boolean(value));

            return (
              <article
                key={exercise.id}
                id={`exercise-${exercise.id}`}
                className="hal-panel scroll-mt-3 rounded-xl p-4 sm:p-5"
              >
                <header className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 font-mono text-sm text-hal-red-bright">
                      {String(exercise.position).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold [overflow-wrap:anywhere]">
                        {exercise.name}
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        {sets.length} prescribed{" "}
                        {sets.length === 1 ? "set" : "sets"}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <EditWorkoutItem
                      mode="exercise"
                      programId={programId}
                      workoutId={workoutId}
                      item={exercise}
                      setCount={sets.length}
                      revision={revision}
                    />
                  )}
                </header>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {previous
                    ? `Week ${week.week_number - 1} prescribed: ${summarizePrescription(previous)}${previous.program_sets.some((set) => set.target_load !== null) ? ` · ${previous.load_convention.replaceAll("_", " ")}` : ""}`
                    : week.week_number > 1
                      ? `No linked prescription in Week ${week.week_number - 1}. Link it in Progression to compare.`
                      : "First week · no previous prescription"}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-sm tabular-nums">
                    <caption className="sr-only">
                      Prescribed sets for {exercise.name}
                    </caption>
                    <thead>
                      <tr className="border-y border-white/10 text-xs text-muted">
                        {[
                          "Set",
                          "Type",
                          "Reps",
                          ...(hasExistingLoad ? ["Load"] : []),
                          "RIR",
                          "Rest",
                          ...(!readOnly ? ["Actions"] : []),
                        ].map((label) => (
                          <th
                            key={label}
                            scope="col"
                            className="px-2 py-3 font-normal"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sets.map((set) => (
                        <tr key={set.id} className="border-b border-white/10">
                          <th scope="row" className="px-2 py-2 font-medium">
                            {set.set_number}
                          </th>
                          <td className="px-2 py-2 text-muted">
                            {setOptions.find(
                              (item) => item.value === set.set_type,
                            )?.label ?? set.set_type}
                          </td>
                          <td className="px-2 py-2">{reps(set)}</td>
                          {hasExistingLoad && (
                            <td className="px-2 py-2">
                              {set.target_load === null
                                ? "—"
                                : `${set.target_load} ${exercise.load_unit}`}
                            </td>
                          )}
                          <td className="px-2 py-2">{set.rir ?? "—"}</td>
                          <td className="px-2 py-2">
                            {set.rest_seconds === null
                              ? "—"
                              : `${set.rest_seconds}s`}
                          </td>
                          {!readOnly && (
                            <td className="px-2 py-2 text-right">
                              <EditWorkoutItem
                                mode="set"
                                programId={programId}
                                workoutId={workoutId}
                                exerciseId={exercise.id}
                                item={set}
                                revision={revision}
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!sets.length && (
                  <p className="py-4 text-sm text-muted">
                    No prescribed sets yet. Add your first set below.
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {sets.length} prescribed{" "}
                    {sets.length === 1 ? "set" : "sets"}
                  </span>
                  {!readOnly && setNumbers.length > 0 && (
                    <FormDialog
                      key={`add-set-${exercise.id}-${sets.length}`}
                      title={`Add set · ${exercise.name}`}
                      trigger="+ Add set"
                    >
                      <p className="mt-4 text-xs text-muted">
                        For exact reps, leave maximum reps blank. Personal loads
                        are set when assigning the program.
                      </p>
                      <WorkoutForm
                        mode="set"
                        programId={programId}
                        revision={revision}
                        workoutId={workoutId}
                        exerciseId={exercise.id}
                        itemId={randomUUID()}
                        submitLabel="Save set"
                        fields={setFields}
                      />
                    </FormDialog>
                  )}
                </div>
                {!readOnly && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <TemplateActionControl
                      key={`duplicate-${exercise.id}-${revision}`}
                      programId={programId}
                      revision={revision}
                      operation="duplicate_exercise"
                      payload={{ workoutId, exerciseId: exercise.id }}
                      label="Duplicate exercise"
                      disabled={currentExercises.length >= 50}
                    />
                    <TemplateActionControl
                      key={`up-${exercise.id}-${revision}`}
                      programId={programId}
                      revision={revision}
                      operation="move_exercise"
                      payload={{
                        workoutId,
                        exerciseId: exercise.id,
                        direction: "up",
                      }}
                      label="↑ Move up"
                      disabled={exerciseIndex === 0}
                    />
                    <TemplateActionControl
                      key={`down-${exercise.id}-${revision}`}
                      programId={programId}
                      revision={revision}
                      operation="move_exercise"
                      payload={{
                        workoutId,
                        exerciseId: exercise.id,
                        direction: "down",
                      }}
                      label="↓ Move down"
                      disabled={exerciseIndex === currentExercises.length - 1}
                    />
                  </div>
                )}
                <details className="mt-3 border-t border-white/10">
                  <summary className="min-h-11 cursor-pointer py-3 text-sm text-muted">
                    Coaching notes &amp; setup
                  </summary>
                  <dl className="grid gap-4 py-2 sm:grid-cols-2">
                    {details.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="mt-1 whitespace-pre-line text-sm [overflow-wrap:anywhere]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {sets
                    .filter((set) => set.notes || set.side_override)
                    .map((set) => (
                      <div
                        key={set.id}
                        className="mt-3 border-t border-white/10 py-3 text-sm"
                      >
                        <p className="font-medium">Set {set.set_number}</p>
                        {set.side_override && (
                          <p className="mt-1 text-muted">
                            {
                              sideOptions.find(
                                (item) => item.value === set.side_override,
                              )?.label
                            }
                          </p>
                        )}
                        {set.notes && (
                          <p className="mt-1 whitespace-pre-line text-muted">
                            {set.notes}
                          </p>
                        )}
                      </div>
                    ))}
                </details>
              </article>
            );
          })}
        </section>
      }
    />
  );
}
