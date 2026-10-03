import "server-only";
import { createCoachAdminClient } from "@/lib/supabase/admin";
import { mutationError, uuidPattern } from "./model";

export async function mutateTemplate(
  formData: FormData,
  operation: string,
  payload: Record<string, unknown>,
) {
  const programId = String(formData.get("programId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const revision = String(formData.get("revision") ?? "");
  if (
    !uuidPattern.test(programId) ||
    !uuidPattern.test(requestId) ||
    !/^\d+$/.test(revision)
  ) {
    return {
      error: "Invalid form. Refresh the page and try again.",
      data: null,
    };
  }
  try {
    const admin = await createCoachAdminClient();
    const { data, error } = await admin.rpc("coach_template_mutation", {
      p_coach_id: process.env.COACH_USER_ID!,
      p_program_id: programId,
      p_expected_revision: Number(revision),
      p_request_id: requestId,
      p_operation: operation,
      p_payload: payload,
    });
    if (error) {
      console.error("Template save failed", {
        code: error.code,
        message: error.message,
      });
      return { error: mutationError(error.message), data: null };
    }
    return {
      error: "",
      data: data as { programId: string; workoutId?: string; itemId?: string },
    };
  } catch {
    return {
      error:
        "Could not confirm the save. Check your connection and coach sign-in, then retry this same form.",
      data: null,
    };
  }
}

export async function loadRemovalCounts(programId: string) {
  const admin = await createCoachAdminClient();
  const { data: weeks, error } = await admin
    .from("program_weeks")
    .select("id, program_workouts(id, position)")
    .eq("program_id", programId);
  if (error) throw new Error("Could not load workout counts.");
  const workouts = (weeks ?? []).flatMap((week) => week.program_workouts);
  const counts = workouts.map((workout) => ({
    position: workout.position,
    exercises: 0,
    sets: 0,
  }));
  if (!workouts.length) return counts;
  for (let offset = 0; ; offset += 500) {
    const { data: rows, error: rowError } = await admin
      .from("program_exercises")
      .select("id, workout_id, program_sets(id)")
      .in(
        "workout_id",
        workouts.map((workout) => workout.id),
      )
      .order("id")
      .range(offset, offset + 499);
    if (rowError) throw new Error("Could not load exercise counts.");
    for (const exercise of rows ?? []) {
      const index = workouts.findIndex(
        (workout) => workout.id === exercise.workout_id,
      );
      if (index >= 0) {
        counts[index].exercises += 1;
        counts[index].sets += exercise.program_sets.length;
      }
    }
    if (!rows || rows.length < 500) break;
  }
  return counts;
}
