export const DEFAULT_MESOCYCLE_WEEKS = 5;
export const MIN_MESOCYCLE_WEEKS = 1;
export const MAX_MESOCYCLE_WEEKS = 12;

export const MIN_WORKOUTS_PER_WEEK = 1;
export const MAX_WORKOUTS_PER_WEEK = 7;

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidMesocycleDuration(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_MESOCYCLE_WEEKS &&
    value <= MAX_MESOCYCLE_WEEKS
  );
}

export function isValidWorkoutCount(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_WORKOUTS_PER_WEEK &&
    value <= MAX_WORKOUTS_PER_WEEK
  );
}

export type RemovalCount = {
  position: number;
  exercises: number;
  sets: number;
};

export function removalTotals(rows: RemovalCount[], count: number) {
  return rows
    .filter((row) => row.position > count)
    .reduce(
      (sum, row) => ({
        exercises: sum.exercises + row.exercises,
        sets: sum.sets + row.sets,
      }),
      { exercises: 0, sets: 0 },
    );
}

export function matchesTitle(title: string, query: string) {
  return title
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase());
}

export function mutationError(message: string) {
  const errors: Record<string, string> = {
    PROGRAM_UNAVAILABLE:
      "This mesocycle is unavailable for your coach account.",
    STALE_TEMPLATE:
      "This mesocycle changed in another request. Refresh to review its latest contents before trying again.",
    LEGACY_TEMPLATE:
      "This existing mesocycle is preserved. Create a new copy to use the current builder.",
    CONFIRM_REMOVAL:
      "Review and confirm the workouts being removed before saving.",
    CONFIRM_REPLACE:
      "Review and confirm replacing the selected week's contents.",
    CONFIRM_LEGACY_COPY:
      "Confirm creating a new copy. The existing mesocycle will be preserved.",
    TEMPLATE_NOT_READY:
      "Every workout needs at least one exercise, and every exercise needs valid prescribed sets before this mesocycle can be Active. Keep it as Draft while building.",
    WORKOUT_LIMIT:
      "Mesocycles support one to seven workouts per week.",
    DURATION_LIMIT:
      `Mesocycles support ${MIN_MESOCYCLE_WEEKS} to ${MAX_MESOCYCLE_WEEKS} weeks.`,
    EXERCISE_LIMIT:
      "A workout supports up to 50 exercises.",
    SET_LIMIT:
      "An exercise supports up to 50 sets.",
    ITEM_UNAVAILABLE:
      "This item is no longer available in the selected workout. Refresh the page.",
    REQUEST_CONFLICT:
      "This form has already been used for a different change. Refresh before trying again.",
    INVALID_REQUEST:
      "Check the form values and try again.",
    TEMPLATE_SHAPE:
      "The mesocycle structure is inconsistent. Reload or create a new copy.",
  };

  return (
    errors[message] ??
    "Could not confirm the save. Retry this same form, or refresh to check. Your changes may already have saved."
  );
}