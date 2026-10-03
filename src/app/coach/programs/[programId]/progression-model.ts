export type PrescribedSet = {
  id: string;
  set_number: number;
  set_type: string;
  reps_min: number;
  reps_max: number;
  target_load: number | null;
  rir: number | null;
  rest_seconds: number | null;
  side_override: string | null;
  notes: string;
};
export type ProgressionExercise = {
  id: string;
  workout_id: string;
  progression_key: string;
  name: string;
  position: number;
  load_unit: string;
  load_convention: string;
  program_sets: PrescribedSet[];
};
export function reps(set: PrescribedSet) {
  return set.reps_min === set.reps_max
    ? String(set.reps_min)
    : `${set.reps_min}–${set.reps_max}`;
}
export function summarizePrescription(exercise: ProgressionExercise) {
  const sets = exercise.program_sets;
  if (!sets.length) return "No sets prescribed";
  const repValues = new Set(sets.map(reps));
  const loads = new Set(sets.map((set) => set.target_load));
  const repText =
    repValues.size === 1
      ? `${sets.length} × ${reps(sets[0])}`
      : `${sets.length} sets · varied reps`;
  const loadText =
    loads.size > 1
      ? "varied loads"
      : sets[0].target_load === null
        ? "load set on assignment"
        : `${sets[0].target_load} ${exercise.load_unit}`;
  return `${repText} · ${loadText}`;
}
export function matchingExercise(
  exercises: ProgressionExercise[],
  workoutId: string,
  key: string,
) {
  return exercises.find(
    (exercise) =>
      exercise.workout_id === workoutId && exercise.progression_key === key,
  );
}
