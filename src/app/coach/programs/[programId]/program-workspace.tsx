import { FormDialog } from "@/components/forms/form-dialog";
import { notFound } from "next/navigation";
import { createCoachAdminClient } from "@/lib/supabase/admin";
import { TemplateActionControl } from "../template-action-control";
import {
  WorkoutEditor,
  type Exercise,
} from "./workouts/[workoutId]/workout-editor";
import { WorkspaceSelect } from "./workspace-select";
import {
  selectWorkspace,
  type WorkspaceWeek,
} from "./workspace-selection";
import { uuidPattern } from "@/lib/programs/model";

type Props = {
  programId: string;
  weekId?: string;
  workoutId?: string;
};

export async function ProgramWorkspace({
  programId,
  weekId,
  workoutId,
}: Props) {
  const ids = [
    programId,
    ...(weekId ? [weekId] : []),
    ...(workoutId ? [workoutId] : []),
  ];

  if (!ids.every((id) => uuidPattern.test(id))) {
    notFound();
  }

  const admin = await createCoachAdminClient();

  const { data: program, error: programError } = await admin
    .from("programs")
    .select(
      "id, name, duration_weeks, sessions_per_week, status, template_version, template_revision",
    )
    .eq("id", programId)
    .eq("created_by", process.env.COACH_USER_ID!)
    .maybeSingle();

  if (programError) {
    throw new Error(
      "Could not load the mesocycle structure. Confirm that the latest database migrations have been applied.",
    );
  }

  if (!program) {
    notFound();
  }

  const { data, error } = await admin
    .from("program_weeks")
    .select(
      "id, week_number, focus, coaching_notes, is_deload, program_workouts(id, name, position, estimated_minutes, warmup_notes, progression_key)",
    )
    .eq("program_id", programId)
    .order("week_number");

  if (error) {
    throw new Error("Could not load mesocycle weeks.");
  }

  const selection = selectWorkspace(
    (data ?? []) as WorkspaceWeek[],
    weekId,
    workoutId,
  );

  if (!selection) {
    notFound();
  }

  const { weeks, week, workouts, workout } = selection;

  const allWorkouts = weeks.flatMap(
    (item) => item.program_workouts,
  );

  const allExercises: Exercise[] = [];

  if (allWorkouts.length) {
    for (let offset = 0; ; offset += 500) {
      const { data: rows, error: rowError } = await admin
        .from("program_exercises")
        .select("*, program_sets(*)")
        .in(
          "workout_id",
          allWorkouts.map((item) => item.id),
        )
        .order("id")
        .range(offset, offset + 499);

      if (rowError) {
        throw new Error(
          "Could not load prescribed exercises.",
        );
      }

      allExercises.push(...((rows ?? []) as Exercise[]));

      if (!rows || rows.length < 500) {
        break;
      }
    }
  }

  const fixed = program.template_version === 2;
  const revision = program.template_revision;
  const base = `/coach/programs/${programId}`;

  const destinationExercises = allExercises.filter((item) =>
    workouts.some(
      (workoutItem) =>
        workoutItem.id === item.workout_id,
    ),
  );

  const copySets = destinationExercises.reduce(
    (sum, exercise) =>
      sum + exercise.program_sets.length,
    0,
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-white/10 bg-background px-4 pb-2 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1
            className="min-w-0 truncate text-xl font-semibold sm:text-2xl"
            title={program.name}
          >
            {program.name}
          </h1>

          <span className="shrink-0 text-[11px] uppercase tracking-widest text-muted">
            {program.status}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted">
          {program.duration_weeks}{" "}
          {program.duration_weeks === 1 ? "week" : "weeks"} ·{" "}
          {program.sessions_per_week}{" "}
          {program.sessions_per_week === 1
            ? "workout"
            : "workouts"}{" "}
          per week
        </p>

        {!fixed && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-white/15 px-3 py-2">
            <p className="text-xs text-muted">
              Existing mesocycle preserved. Create a compatible
              copy to use the current builder.
            </p>

            <TemplateActionControl
              key={`legacy-${revision}`}
              programId={programId}
              revision={revision}
              operation="duplicate"
              label="Create compatible copy"
              confirmation="Create a separate draft from this mesocycle? Its complete duration and workout structure will be copied. Missing workout blocks will remain empty, workout labels will become numbers, and copied lb loads will be converted to kg."
              confirmLabel="Create copy"
            />
          </div>
        )}

        <div className="mt-2">
          <WorkspaceSelect
            label="Week"
            value={`${base}/builder?week=${week?.id}`}
            options={weeks.map((item) => ({
              value: `${base}/builder?week=${item.id}`,
              label: `Week ${item.week_number}${
                item.is_deload ? " · Deload" : ""
              }`,
            }))}
          />
        </div>

        {week && (
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <WorkspaceSelect
                label="Workout"
                value={`${base}/workouts/${workout?.id}`}
                options={workouts.map((item) => ({
                  value: `${base}/workouts/${item.id}`,
                  label: `Workout ${item.position}`,
                }))}
              />
            </div>

            {fixed && (
              <FormDialog
                key={`manage-${week.id}-${revision}`}
                title={`Week ${week.week_number} · Manage workouts`}
                trigger="Manage"
              >
                <p className="mt-4 text-sm text-muted">
                  Adding, removing or moving a workout applies
                  across every week in this mesocycle.
                </p>

                {program.sessions_per_week < 7 && (
                  <div className="mt-4">
                    <TemplateActionControl
                      key={`add-${revision}`}
                      programId={programId}
                      revision={revision}
                      operation="add_workout"
                      label="+ Workout"
                      payload={{ weekId: week.id }}
                    />
                  </div>
                )}

                <div className="mt-4 divide-y divide-white/10">
                  {workouts.map((item, index) => {
                    const matchingIds = allWorkouts
                      .filter(
                        (workoutItem) =>
                          workoutItem.progression_key ===
                          item.progression_key,
                      )
                      .map(
                        (workoutItem) => workoutItem.id,
                      );

                    const affected = allExercises.filter(
                      (exercise) =>
                        matchingIds.includes(
                          exercise.workout_id,
                        ),
                    );

                    const sets = affected.reduce(
                      (sum, exercise) =>
                        sum +
                        exercise.program_sets.length,
                      0,
                    );

                    return (
                      <div key={item.id} className="py-4">
                        <p className="font-semibold">
                          Workout {item.position}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <TemplateActionControl
                            key={`up-${item.id}-${revision}`}
                            programId={programId}
                            revision={revision}
                            operation="move_workout"
                            payload={{
                              workoutId: item.id,
                              direction: "up",
                            }}
                            label="↑ Move up"
                            disabled={index === 0}
                          />

                          <TemplateActionControl
                            key={`down-${item.id}-${revision}`}
                            programId={programId}
                            revision={revision}
                            operation="move_workout"
                            payload={{
                              workoutId: item.id,
                              direction: "down",
                            }}
                            label="↓ Move down"
                            disabled={
                              index ===
                              workouts.length - 1
                            }
                          />
                        </div>

                        {program.sessions_per_week > 1 && (
                          <div className="mt-3">
                            <TemplateActionControl
                              key={`delete-${item.id}-${revision}`}
                              programId={programId}
                              revision={revision}
                              operation="delete_workout"
                              payload={{
                                workoutId: item.id,
                                weekId: week.id,
                              }}
                              label={`Remove Workout ${item.position}`}
                              confirmation={`Remove Workout ${item.position} across every week, including ${affected.length} exercises and ${sets} prescribed sets? Remaining workouts will be renumbered. This cannot be undone.`}
                              confirmLabel="Remove workouts"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {workout && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <h3 className="mb-3 font-semibold">
                      Workout {workout.position} · This
                      week&apos;s notes
                    </h3>

                    <TemplateActionControl
                      key={`notes-${revision}`}
                      programId={programId}
                      revision={revision}
                      operation="workout_details"
                      payload={{
                        workoutId: workout.id,
                      }}
                      label="Save workout notes"
                    >
                      <label className="block text-sm text-muted">
                        Estimated minutes (optional)
                        <input
                          type="number"
                          name="estimated_minutes"
                          min={1}
                          max={300}
                          defaultValue={
                            workout.estimated_minutes ?? ""
                          }
                          className="mt-2 min-h-12 w-full rounded-lg border border-blue-200 bg-white px-3 text-base text-foreground"
                        />
                      </label>

                      <label className="my-4 block text-sm text-muted">
                        Warm-up notes (optional)
                        <textarea
                          name="warmup_notes"
                          maxLength={2000}
                          rows={3}
                          defaultValue={
                            workout.warmup_notes
                          }
                          className="mt-2 w-full rounded-lg border border-blue-200 bg-white p-3 text-base text-foreground"
                        />
                      </label>
                    </TemplateActionControl>
                  </div>
                )}
              </FormDialog>
            )}
          </div>
        )}

        {fixed && week && week.week_number > 1 && (
          <div className="pb-1">
            <FormDialog
              key={`quick-copy-${week.id}-${revision}`}
              title={`Copy Week ${
                week.week_number - 1
              } into Week ${week.week_number}`}
              trigger={`Copy Week ${week.week_number - 1}`}
            >
              <div className="mt-4">
                <TemplateActionControl
                  programId={programId}
                  revision={revision}
                  operation="copy_week"
                  payload={{ weekId: week.id }}
                  label="Copy previous week"
                  confirmation={`Replace Week ${week.week_number} with Week ${week.week_number - 1}? This replaces ${destinationExercises.length} exercises and ${copySets} prescribed sets, plus workout and week notes. Prescriptions are copied exactly. This cannot be undone.`}
                  confirmLabel="Copy previous week"
                />
              </div>
            </FormDialog>
          </div>
        )}
      </header>

      {workout && week ? (
        <WorkoutEditor
          key={`${workout.id}-${revision}`}
          programId={programId}
          workout={workout}

          exercises={allExercises.filter((exercise) =>
            allWorkouts.some(
              (workoutItem) =>
                workoutItem.id ===
                  exercise.workout_id &&
                workoutItem.progression_key ===
                  workout.progression_key,
            ),
          )}
          revision={revision}
          readOnly={!fixed}
        />
      ) : (
        <div
          data-workspace-scroll
          className="min-h-0 flex-1 overflow-auto p-6"
        >
          <p className="hal-panel rounded-xl p-6 text-muted">
            No workouts in this existing mesocycle. Create a
            compatible copy to start building.
          </p>
        </div>
      )}
    </main>
  );
}
