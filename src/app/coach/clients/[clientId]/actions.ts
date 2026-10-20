"use server";

import { revalidatePath } from "next/cache";
import { createCoachAdminClient } from "@/lib/supabase/admin";

export type TrainingBlockValues = {
  name: string;
  description: string;
  mesocycleCount: string;
  startsOn: string;
};

export type TrainingBlockState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: TrainingBlockValues;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function actionError(message: string) {
  const errors: Record<string, string> = {
    BLOCK_NAME_INVALID:
      "Enter a training block name between 1 and 100 characters.",
    BLOCK_DESCRIPTION_INVALID:
      "Keep the description under 2,000 characters.",
    MESOCYCLE_COUNT_INVALID:
      "Choose between one and six mesocycles.",
    CLIENT_UNAVAILABLE:
      "This client is unavailable. Return to Clients and try again.",
    COACH_UNAVAILABLE:
      "Your coach account could not be verified.",
  };

  return (
    errors[message] ??
    "Could not create the training block. Please try again."
  );
}

export async function createTrainingBlock(
  _previousState: TrainingBlockState,
  formData: FormData,
): Promise<TrainingBlockState> {
  const clientId = String(formData.get("clientId") ?? "");

  const values: TrainingBlockValues = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    mesocycleCount: String(
      formData.get("mesocycleCount") ?? "3",
    ),
    startsOn: String(formData.get("startsOn") ?? ""),
  };

  const fail = (message: string): TrainingBlockState => ({
    status: "error",
    message,
    values,
  });

  if (!uuidPattern.test(clientId)) {
    return fail(
      "This client is unavailable. Return to Clients and try again.",
    );
  }

  if (!values.name || values.name.length > 100) {
    return fail(
      "Enter a training block name between 1 and 100 characters.",
    );
  }

  if (values.description.length > 2000) {
    return fail("Keep the description under 2,000 characters.");
  }

  const mesocycleCount = Number(values.mesocycleCount);

  if (
    !Number.isInteger(mesocycleCount) ||
    mesocycleCount < 1 ||
    mesocycleCount > 6
  ) {
    return fail("Choose between one and six mesocycles.");
  }

  if (
    values.startsOn &&
    !/^\d{4}-\d{2}-\d{2}$/.test(values.startsOn)
  ) {
    return fail("Choose a valid start date.");
  }

  try {
    const admin = await createCoachAdminClient();

    const { error } = await admin.rpc(
      "create_client_training_block",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_client_id: clientId,
        p_name: values.name,
        p_description: values.description,
        p_mesocycle_count: mesocycleCount,
        p_starts_on: values.startsOn || null,
      },
    );

    if (error) {
      console.error("Training block creation failed", {
        code: error.code,
        message: error.message,
      });

      return fail(actionError(error.message));
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message: `${values.name} was created with ${mesocycleCount} ${
        mesocycleCount === 1 ? "mesocycle" : "mesocycles"
      }.`,
    };
  } catch {
    return fail(
      "Could not confirm the save. Check your connection and try again.",
    );
  }
}