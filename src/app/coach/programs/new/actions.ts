"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutateTemplate } from "@/lib/programs/server";

export type ProgramValues = {
  name: string;
  goal: string;
  description: string;
  sessionsPerWeek: string;
};
export type ProgramFormState = { error: string; values?: ProgramValues };
export async function createProgram(
  _previousState: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name"),
    goal: read("goal"),
    description: read("description"),
    sessionsPerWeek: read("sessionsPerWeek"),
  };
  const fail = (error: string) => ({ error, values });
  if (
    !values.name ||
    values.name.length > 100 ||
    values.goal.length > 300 ||
    values.description.length > 2000
  )
    return fail(
      "Enter a name of 1–100 characters, a goal within 300 characters and a description within 2,000 characters.",
    );
  if (!/^[1-7]$/.test(values.sessionsPerWeek))
    return fail("Choose one to seven workouts per week.");
  const result = await mutateTemplate(formData, "create", {
    ...values,
    count: Number(values.sessionsPerWeek),
  });
  if (result.error) return fail(result.error);
  revalidatePath("/coach/programs");
  redirect(`/coach/programs/${result.data!.programId}/builder`);
}
