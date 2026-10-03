"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutateTemplate } from "@/lib/programs/server";
import { uuidPattern } from "@/lib/programs/model";

export type WorkoutFormState = {
  error: string;
  values: Record<string, string>;
};
export async function addWorkoutItem(
  _previousState: WorkoutFormState,
  formData: FormData,
): Promise<WorkoutFormState> {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => !key.startsWith("$ACTION_"))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : "",
      ]),
  );
  const fail = (error: string) => ({ error, values });
  const mode = read("mode"),
    operation = read("operation") || "create";
  const workoutId = read("workoutId"),
    itemId = read("itemId"),
    exerciseId = mode === "exercise" ? itemId : read("exerciseId");
  if (
    !["exercise", "set"].includes(mode) ||
    !["create", "update"].includes(operation) ||
    !uuidPattern.test(workoutId) ||
    !uuidPattern.test(itemId) ||
    (mode === "set" && !uuidPattern.test(exerciseId))
  )
    return fail("Invalid form. Refresh the page.");
  const payload: Record<string, unknown> = {
    workoutId,
    exerciseId,
    setId: mode === "set" ? itemId : undefined,
  };
  const integer = (
    field: string,
    min: number,
    max: number,
    optional = false,
  ) => {
    const text = read(field);
    return optional && !text
      ? null
      : /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max
        ? Number(text)
        : undefined;
  };
  if (mode === "exercise") {
    if (!read("name") || read("name").length > 100)
      return fail("Enter an exercise name of 1–100 characters.");
    for (const [field, limit] of Object.entries({
      name: 100,
      variation: 200,
      coaching_cues: 2000,
      exercise_group: 100,
      coach_notes: 2000,
    })) {
      if (read(field).length > limit)
        return fail(
          `Keep ${field.replaceAll("_", " ")} within ${limit} characters.`,
        );
      payload[field] = read(field);
    }
    payload.side = read("side") || "both";
    if (!["both", "alternating", "each_side"].includes(String(payload.side)))
      return fail("Choose a valid side setting.");
  }
  if (mode === "set" || operation === "create") {
    for (const [field, min, max, optional] of [
      ["reps_min", 1, 1000, false],
      ["reps_max", 1, 1000, true],
      ["rir", 0, 10, false],
      ["rest_seconds", 0, 3600, false],
      ...(mode === "exercise" ? [["working_sets", 1, 50, false]] : []),
    ] as [string, number, number, boolean][]) {
      const value = integer(field, min, max, optional);
      if (value === undefined)
        return fail(
          `Enter ${field.replaceAll("_", " ")} between ${min} and ${max}.`,
        );
      payload[field] = value;
    }
    if (Number(payload.reps_max ?? payload.reps_min) < Number(payload.reps_min))
      return fail("Maximum reps must be at least minimum reps.");
  }
  if (mode === "set") {
    payload.set_type = read("set_type") || "working";
    payload.side_override = read("side_override");
    payload.notes = read("notes");
    if (
      !["warmup", "working", "top", "backoff", "drop"].includes(
        String(payload.set_type),
      ) ||
      !["", "both", "alternating", "each_side"].includes(
        String(payload.side_override),
      ) ||
      read("notes").length > 2000
    )
      return fail("Check the set type, side and notes.");
  }
  const result = await mutateTemplate(
    formData,
    `${operation === "create" ? "create" : "edit"}_${mode}`,
    payload,
  );
  if (result.error) return fail(result.error);
  const programId = result.data!.programId;
  revalidatePath(`/coach/programs/${programId}`, "layout");
  redirect(
    `/coach/programs/${programId}/workouts/${workoutId}#exercise-${result.data!.itemId}`,
  );
}
