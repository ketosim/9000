"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutateTemplate } from "@/lib/programs/server";
import { uuidPattern } from "@/lib/programs/model";
export async function linkProgression(
  _previous: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const read = (name: string) => String(formData.get(name) ?? "");
  const workoutId = read("workoutId"),
    referenceId = read("referenceId"),
    exerciseId = read("itemId");
  if (
    read("kind") !== "exercise" ||
    ![workoutId, referenceId, exerciseId].every((id) => uuidPattern.test(id))
  )
    return { error: "Choose a corresponding exercise." };
  const result = await mutateTemplate(formData, "link_exercise", {
    workoutId,
    referenceId,
    exerciseId,
    unlink: read("unlink") === "true",
  });
  if (result.error) return { error: result.error };
  revalidatePath(`/coach/programs/${result.data!.programId}`, "layout");
  redirect(
    `/coach/programs/${result.data!.programId}/workouts/${workoutId}?view=progression`,
  );
}
