"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isValidMesocycleDuration,
  isValidWorkoutCount,
} from "@/lib/programs/model";
import { mutateTemplate } from "@/lib/programs/server";

export type ProgramEditValues = {
  name: string;
  goal: string;
  description: string;
  durationWeeks: string;
  sessionsPerWeek: string;
  status: string;
};

export type ProgramEditState = {
  error: string;
  values: ProgramEditValues;
};

export async function updateProgram(
  _previousState: ProgramEditState,
  formData: FormData,
): Promise<ProgramEditState> {
  const read = (name: string) =>
    String(formData.get(name) ?? "").trim();

  const values: ProgramEditValues = {
    name: read("name"),
    goal: read("goal"),
    description: read("description"),
    durationWeeks: read("durationWeeks"),
    sessionsPerWeek: read("sessionsPerWeek"),
    status: read("status"),
  };

  const fail = (error: string): ProgramEditState => ({
    error,
    values,
  });

  if (!values.name || values.name.length > 100) {
    return fail(
      "Enter a mesocycle name between 1 and 100 characters.",
    );
  }

  if (values.goal.length > 300) {
    return fail("Keep the goal within 300 characters.");
  }

  if (values.description.length > 2000) {
    return fail("Keep the description within 2,000 characters.");
  }

  const durationWeeks = Number(values.durationWeeks);
  const workoutCount = Number(values.sessionsPerWeek);

  if (!isValidMesocycleDuration(durationWeeks)) {
    return fail("Choose a duration between 1 and 12 weeks.");
  }

  if (!isValidWorkoutCount(workoutCount)) {
    return fail("Choose between 1 and 7 workouts per week.");
  }

  if (!["draft", "active", "archived"].includes(values.status)) {
    return fail("Choose a valid mesocycle status.");
  }

  const result = await mutateTemplate(formData, "details", {
    name: values.name,
    goal: values.goal,
    description: values.description,
    durationWeeks,
    count: workoutCount,
    status: values.status,
    confirmed: read("confirmed") === "yes",
  });

  if (result.error) {
    return fail(result.error);
  }

  const programId = result.data!.programId;

  revalidatePath("/coach/programs");
  revalidatePath(`/coach/programs/${programId}`);
  revalidatePath(`/coach/programs/${programId}/details`);
  revalidatePath(`/coach/programs/${programId}/builder`);

  redirect(`/coach/programs/${programId}/builder`);
}