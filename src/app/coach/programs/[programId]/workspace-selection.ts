export type WorkspaceWorkout = {
  progression_key: string;
  id: string;
  name: string;
  position: number;
  estimated_minutes: number | null;
  warmup_notes: string;
};

export type WorkspaceWeek = {
  id: string;
  week_number: number;
  focus: string;
  coaching_notes: string;
  is_deload: boolean;
  program_workouts: WorkspaceWorkout[];
};

// Only pass weeks already fetched through the owned program query.
// An unknown requested ID must not silently select someone else's workout.
export function selectWorkspace(
  weeks: WorkspaceWeek[],
  requestedWeekId?: string,
  requestedWorkoutId?: string,
) {
  const sorted = [...weeks].sort((a, b) => a.week_number - b.week_number);
  const week = requestedWorkoutId
    ? sorted.find((item) =>
        item.program_workouts.some((w) => w.id === requestedWorkoutId),
      )
    : requestedWeekId
      ? sorted.find((item) => item.id === requestedWeekId)
      : sorted[0];

  if ((requestedWeekId || requestedWorkoutId) && !week) return null;
  const workouts = [...(week?.program_workouts ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const workout = requestedWorkoutId
    ? workouts.find((item) => item.id === requestedWorkoutId)
    : workouts[0];
  return { weeks: sorted, week, workouts, workout };
}
