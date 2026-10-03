"use server";

// Retained for old imports. Manual week/workout creation is superseded by the
// synchronized template controls. Old forms must not make partial changes.
export type BuilderState = { error: string; values: Record<string, string> };
export type MoveWorkoutState = { error: string; message: string };
export async function createBuilderItem(
  _previous: BuilderState,
  _form: FormData,
): Promise<BuilderState> {
  void _previous;
  void _form;
  return {
    error:
      "Weeks and workout blocks are created automatically. Refresh and use the updated builder.",
    values: {},
  };
}
export async function moveWorkout(
  _previous: MoveWorkoutState,
  _form: FormData,
): Promise<MoveWorkoutState> {
  void _previous;
  void _form;
  return {
    error: "Refresh and use Manage to move the workout across all four weeks.",
    message: "",
  };
}
