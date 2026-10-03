"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutateTemplate } from "@/lib/programs/server";
import { uuidPattern } from "@/lib/programs/model";
export type DeleteState = { error: string };
export async function deleteWorkoutItem(
  _previousState: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const read = (name: string) => String(formData.get(name) ?? "");
  const mode = read("mode"),
    workoutId = read("workoutId"),
    itemId = read("itemId"),
    exerciseId = mode === "exercise" ? itemId : read("exerciseId");
  if (
    !["exercise", "set"].includes(mode) ||
    ![workoutId, itemId, exerciseId].every((id) => uuidPattern.test(id))
  )
    return { error: "Invalid item. Refresh the page." };
  const result = await mutateTemplate(formData, `delete_${mode}`, {
    workoutId,
    exerciseId,
    setId: mode === "set" ? itemId : undefined,
    confirmed: read("confirmed") === "yes",
  });
  if (result.error) return { error: result.error };
  const programId = result.data!.programId;
  revalidatePath(`/coach/programs/${programId}`, "layout");
  redirect(
    `/coach/programs/${programId}/workouts/${workoutId}${mode === "set" ? `#exercise-${exerciseId}` : ""}`,
  );
}
