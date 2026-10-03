"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutateTemplate } from "@/lib/programs/server";
import { uuidPattern } from "@/lib/programs/model";

export type TemplateActionState = { error: string; message: string };
export async function templateAction(
  _previousState: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const operation = String(formData.get("operation") ?? "");
  if (
    ![
      "duplicate",
      "add_workout",
      "delete_workout",
      "move_workout",
      "copy_week",
      "duplicate_exercise",
      "move_exercise",
      "workout_details",
    ].includes(operation)
  )
    return { error: "Invalid action. Refresh the page.", message: "" };
  let payload: Record<string, unknown>;
  try {
    const raw = String(formData.get("payload") ?? "{}");
    if (raw.length > 12000) throw new Error();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    return { error: "Invalid action. Refresh the page.", message: "" };
  }
  if (operation === "workout_details") {
    payload.warmup_notes = String(formData.get("warmup_notes") ?? "").trim();
    const minutes = String(formData.get("estimated_minutes") ?? "").trim();
    if (
      minutes &&
      (!/^\d+$/.test(minutes) || Number(minutes) < 1 || Number(minutes) > 300)
    )
      return { error: "Choose a duration of 1–300 minutes.", message: "" };
    payload.estimated_minutes = minutes ? Number(minutes) : null;
  }
  const result = await mutateTemplate(formData, operation, payload);
  if (result.error) return { error: result.error, message: "" };
  const programId = result.data!.programId;
  revalidatePath("/coach/programs");
  revalidatePath(`/coach/programs/${programId}`, "layout");
  if (operation === "duplicate")
    redirect(`/coach/programs/${programId}/builder`);
  if (operation === "duplicate_exercise")
    redirect(
      `/coach/programs/${programId}/workouts/${result.data!.workoutId}#exercise-${result.data!.itemId}`,
    );
  if (operation === "delete_workout") {
    const weekId = String(payload.weekId ?? "");
    redirect(
      `/coach/programs/${programId}/builder${uuidPattern.test(weekId) ? `?week=${weekId}` : ""}`,
    );
  }
  return {
    error: "",
    message:
      operation === "copy_week"
        ? "Previous week copied. Prescriptions remain independently editable."
        : "Changes saved.",
  };
}
