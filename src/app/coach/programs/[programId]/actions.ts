"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutateTemplate } from "@/lib/programs/server";

export type ProgramEditValues = {
  name: string;
  goal: string;
  description: string;
  sessionsPerWeek: string;
  status: string;
};
export type ProgramEditState = { error: string; values: ProgramEditValues };
export async function updateProgram(
  _previousState: ProgramEditState,
  formData: FormData,
): Promise<ProgramEditState> {
  const read = (key: string) => String(formData.get(key) ?? "").trim();
  const values = {
    name: read("name"),
    goal: read("goal"),
    description: read("description"),
    sessionsPerWeek: read("sessionsPerWeek"),
    status: read("status"),
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
  if (
    !/^[1-7]$/.test(values.sessionsPerWeek) ||
    !["draft", "active", "archived"].includes(values.status)
  )
    return fail("Choose a valid workout count and status.");
  const result = await mutateTemplate(formData, "details", {
    ...values,
    count: Number(values.sessionsPerWeek),
    confirmed: read("confirmed") === "yes",
  });
  if (result.error) return fail(result.error);
  revalidatePath("/coach/programs");
  revalidatePath(`/coach/programs/${result.data!.programId}`, "layout");
  redirect(`/coach/programs/${result.data!.programId}/builder`);
}
