export const TEMPLATE_WEEKS = 4;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  return title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export function mutationError(message: string) {
  const errors: Record<string, string> = {
    PROGRAM_UNAVAILABLE: "This program is unavailable for your coach account.",
    STALE_TEMPLATE:
      "This program changed in another request. Refresh to review its latest contents before trying again.",
    LEGACY_TEMPLATE:
      "This existing program is preserved. Create a four-week copy to use the new builder.",
    CONFIRM_REMOVAL:
      "Review and confirm the workouts being removed before saving.",
    CONFIRM_REPLACE:
      "Review and confirm replacing the selected week's contents.",
    CONFIRM_LEGACY_COPY:
      "Confirm creating a four-week copy. The existing program will be preserved.",
    TEMPLATE_NOT_READY:
      "Every workout needs at least one exercise, and every exercise needs valid prescribed sets before this program can be Active. Keep it as Draft while building.",
    WORKOUT_LIMIT: "Programs support one to seven workouts per week.",
    EXERCISE_LIMIT: "A workout supports up to 50 exercises.",
    SET_LIMIT: "An exercise supports up to 50 sets.",
    ITEM_UNAVAILABLE:
      "This item is no longer available in the selected workout. Refresh the page.",
    REQUEST_CONFLICT:
      "This form has already been used for a different change. Refresh before trying again.",
    INVALID_REQUEST: "Check the form values and try again.",
    TEMPLATE_SHAPE:
      "The program structure is inconsistent. Reload or create a four-week copy.",
  };
  return (
    errors[message] ??
    "Could not confirm the save. Retry this same form, or refresh to check. Your changes may already have saved."
  );
}
