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

export type TrainingBlockEditValues = {
  name: string;
  description: string;
  mesocycleCount: string;
  startsOn: string;
};

export type TrainingBlockEditState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: TrainingBlockEditValues;
};

export type MesocycleEditValues = {
  name: string;
  startsOn: string;
};

export type MesocycleEditState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: MesocycleEditValues;
};

export type TemplateAssignmentState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type TemplateUnassignmentState = {
  status: "idle" | "error" | "success";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function creationError(message: string) {
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

function structureEditError(message: string) {
  const errors: Record<string, string> = {
    BLOCK_NAME_INVALID:
      "Enter a training block name between 1 and 100 characters.",
    BLOCK_DESCRIPTION_INVALID:
      "Keep the description under 2,000 characters.",
    MESOCYCLE_COUNT_INVALID:
      "Choose between one and six mesocycles.",
    BLOCK_UNAVAILABLE:
      "This training block is unavailable. Refresh the page and try again.",
    BLOCK_ARCHIVED:
      "Archived training blocks cannot be edited.",
    BLOCK_STRUCTURE_LOCKED:
      "The number of mesocycles can only be changed while the training block is a draft.",
    BLOCK_MESOCYCLES_IN_USE:
      "The mesocycles being removed contain assigned templates. Unassign those templates first.",
    BLOCK_MESOCYCLES_NOT_DRAFT:
      "Only empty draft mesocycles can be removed.",
    MESOCYCLE_NAME_INVALID:
      "Enter a mesocycle name between 1 and 100 characters.",
    MESOCYCLE_UNAVAILABLE:
      "This mesocycle is unavailable. Refresh the page and try again.",
    MESOCYCLE_ARCHIVED:
      "Archived mesocycles cannot be edited.",
  };

  return (
    errors[message] ??
    "Could not save these changes. Please try again."
  );
}

function assignmentError(message: string) {
  const errors: Record<string, string> = {
    MESOCYCLE_UNAVAILABLE:
      "This mesocycle is unavailable. Refresh the client page and try again.",
    TEMPLATE_UNAVAILABLE:
      "This training template is unavailable. Refresh the client page and choose another template.",
    TEMPLATE_NOT_ACTIVE:
      "Only active training templates can be assigned.",
    TEMPLATE_ALREADY_ASSIGNED:
      "This training template is already assigned to the mesocycle.",
    MESOCYCLE_DURATION_MISMATCH:
      "Choose a template with the same duration as the other templates in this mesocycle.",
    ASSIGNMENT_LIMIT:
      "This mesocycle has reached its template assignment limit.",
  };

  return (
    errors[message] ??
    "Could not assign the training template. Please try again."
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

      return fail(creationError(error.message));
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

export async function updateTrainingBlock(
  _previousState: TrainingBlockEditState,
  formData: FormData,
): Promise<TrainingBlockEditState> {
  const clientId = String(formData.get("clientId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");

  const values: TrainingBlockEditValues = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    mesocycleCount: String(
      formData.get("mesocycleCount") ?? "",
    ),
    startsOn: String(formData.get("startsOn") ?? ""),
  };

  const fail = (message: string): TrainingBlockEditState => ({
    status: "error",
    message,
    values,
  });

  if (!uuidPattern.test(clientId) || !uuidPattern.test(blockId)) {
    return fail(
      "This training block is unavailable. Refresh the page and try again.",
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
      "update_client_training_block",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_block_id: blockId,
        p_name: values.name,
        p_description: values.description,
        p_mesocycle_count: mesocycleCount,
        p_starts_on: values.startsOn || null,
      },
    );

    if (error) {
      console.error("Training block update failed", {
        code: error.code,
        message: error.message,
      });

      return fail(structureEditError(error.message));
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message: "Training block updated.",
      values,
    };
  } catch {
    return fail(
      "Could not confirm the update. Check your connection and try again.",
    );
  }
}

export async function updateClientMesocycle(
  _previousState: MesocycleEditState,
  formData: FormData,
): Promise<MesocycleEditState> {
  const clientId = String(formData.get("clientId") ?? "");
  const mesocycleId = String(formData.get("mesocycleId") ?? "");

  const values: MesocycleEditValues = {
    name: String(formData.get("name") ?? "").trim(),
    startsOn: String(formData.get("startsOn") ?? ""),
  };

  const fail = (message: string): MesocycleEditState => ({
    status: "error",
    message,
    values,
  });

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(mesocycleId)
  ) {
    return fail(
      "This mesocycle is unavailable. Refresh the page and try again.",
    );
  }

  if (!values.name || values.name.length > 100) {
    return fail(
      "Enter a mesocycle name between 1 and 100 characters.",
    );
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
      "update_client_mesocycle",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_mesocycle_id: mesocycleId,
        p_name: values.name,
        p_starts_on: values.startsOn || null,
      },
    );

    if (error) {
      console.error("Mesocycle update failed", {
        code: error.code,
        message: error.message,
      });

      return fail(structureEditError(error.message));
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message: "Mesocycle updated.",
      values,
    };
  } catch {
    return fail(
      "Could not confirm the update. Check your connection and try again.",
    );
  }
}

export async function assignTrainingTemplate(
  _previousState: TemplateAssignmentState,
  formData: FormData,
): Promise<TemplateAssignmentState> {
  const clientId = String(formData.get("clientId") ?? "");
  const mesocycleId = String(formData.get("mesocycleId") ?? "");
  const programId = String(formData.get("programId") ?? "");

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(mesocycleId) ||
    !uuidPattern.test(programId)
  ) {
    return {
      status: "error",
      message: "Invalid assignment. Refresh the client page and try again.",
    };
  }

  try {
    const admin = await createCoachAdminClient();

    const { error } = await admin.rpc(
      "assign_training_template",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_mesocycle_id: mesocycleId,
        p_program_id: programId,
      },
    );

    if (error) {
      console.error("Training template assignment failed", {
        code: error.code,
        message: error.message,
      });

      return {
        status: "error",
        message: assignmentError(error.message),
      };
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message: "Training template assigned.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Could not confirm the assignment. Check your connection and try again.",
    };
  }
}

export async function unassignTrainingTemplate(
  _previousState: TemplateUnassignmentState,
  formData: FormData,
): Promise<TemplateUnassignmentState> {
  const clientId = String(formData.get("clientId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(assignmentId)
  ) {
    return {
      status: "error",
      message: "Invalid assignment. Refresh the client page and try again.",
    };
  }

  try {
    const admin = await createCoachAdminClient();

    const { error } = await admin.rpc(
      "unassign_training_template",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_assignment_id: assignmentId,
      },
    );

    if (error) {
      console.error("Training template unassignment failed", {
        code: error.code,
        message: error.message,
      });

      const messages: Record<string, string> = {
        ASSIGNMENT_UNAVAILABLE:
          "This assignment is unavailable. Refresh the client page and try again.",
        MESOCYCLE_NOT_DRAFT:
          "Only templates in a draft mesocycle can be unassigned.",
      };

      return {
        status: "error",
        message:
          messages[error.message] ??
          "Could not unassign the training template. Please try again.",
      };
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message: "Training template unassigned.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Could not confirm the change. Check your connection and try again.",
    };
  }
}