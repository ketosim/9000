import "server-only";

import { createCoachAdminClient } from "@/lib/supabase/admin";

export async function getOwnedWorkout(
  programId: string,
  workoutId: string,
) {
  const supabase = await createCoachAdminClient();

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(programId) || !uuid.test(workoutId)) {
    return null;
  }

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id, name")
    .eq("id", programId)
    .eq("created_by", process.env.COACH_USER_ID!)
    .maybeSingle();

  if (programError) {
  console.error("Program lookup failed:", {
    code: programError.code,
    message: programError.message,
    details: programError.details,
    hint: programError.hint,
  });

  throw new Error("Could not load program.");
}
  if (!program) return null;

  const { data: workout, error: workoutError } = await supabase
    .from("program_workouts")
    .select("id, week_id, name, position, warmup_notes")
    .eq("id", workoutId)
    .maybeSingle();

  if (workoutError) throw new Error("Could not load workout.");
  if (!workout) return null;

  const { data: week, error: weekError } = await supabase
    .from("program_weeks")
    .select("id, week_number")
    .eq("id", workout.week_id)
    .eq("program_id", programId)
    .maybeSingle();

  if (weekError) throw new Error("Could not load week.");
  if (!week) return null;

  return { supabase, program, workout, week };
}