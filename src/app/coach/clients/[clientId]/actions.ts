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
  durationWeeks: string;
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

export type TrainingStatusState = {
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
    BLOCK_UNAVAILABLE:
      "This training block is unavailable. Refresh the page and try again.",
    BLOCK_NAME_INVALID:
      "Enter a training block name between 1 and 100 characters.",
    BLOCK_DESCRIPTION_INVALID:
      "Keep the description under 2,000 characters.",
    BLOCK_START_DATE_INVALID:
      "Choose a valid training block start date.",
    MESOCYCLE_COUNT_INVALID:
      "Choose between one and six mesocycles.",
    BLOCK_MESOCYCLES_IN_USE:
      "Remove the assigned templates from the final mesocycles before reducing the number of mesocycles.",
    MESOCYCLE_UNAVAILABLE:
      "This mesocycle is unavailable. Refresh the page and try again.",
    MESOCYCLE_NAME_INVALID:
      "Enter a mesocycle name between 1 and 100 characters.",
    MESOCYCLE_DURATION_INVALID:
      "Choose a valid mesocycle duration.",
    MESOCYCLE_START_DATE_INVALID:
      "Choose a valid mesocycle start date.",
    MESOCYCLE_DURATION_MISMATCH:
      "This duration does not match the templates already assigned to the mesocycle.",
    ACTIVE_BLOCK_STRUCTURE_LOCKED:
      "An active training block cannot be restructured. Return it to draft before editing its structure.",
    ACTIVE_MESOCYCLE_STRUCTURE_LOCKED:
      "An active mesocycle cannot be restructured. Return it to draft before editing it.",
  };

  return (
    errors[message] ??
    "Could not save the training structure. Please try again."
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
    MESOCYCLE_NOT_DRAFT:
      "Templates can only be assigned while the mesocycle is in draft.",
  };

  return (
    errors[message] ??
    "Could not assign the training template. Please try again."
  );
}

function trainingStatusError(message: string) {
  const errors: Record<string, string> = {
    INVALID_STATUS:
      "Choose a valid status.",
    COACH_UNAVAILABLE:
      "Your coach account could not be verified.",
    CLIENT_UNAVAILABLE:
      "This client is unavailable. Return to Clients and try again.",
    BLOCK_UNAVAILABLE:
      "This training block is unavailable. Refresh the page and try again.",
    BLOCK_ARCHIVED:
      "An archived training block cannot be activated.",
    BLOCK_ALREADY_STARTED:
      "This training block has already started and cannot return to draft.",
    BLOCK_START_DATE_REQUIRED:
      "Add a start date before activating this training block.",
    BLOCK_HAS_NO_MESOCYCLES:
      "Add at least one mesocycle before activating this training block.",
    BLOCK_MESOCYCLES_NOT_ACTIVE:
      "Every mesocycle must be active before the training block can be activated.",
    BLOCK_START_MISMATCH:
      "The training block start date must match the first mesocycle start date.",
    ACTIVE_BLOCK_STRUCTURE_LOCKED:
      "This training block is active. Change it to draft before changing its structure.",
    CLIENT_ALREADY_HAS_ACTIVE_BLOCK:
      "This client already has an active training block. Archive or complete it before activating another.",
    MESOCYCLE_UNAVAILABLE:
      "This mesocycle is unavailable. Refresh the page and try again.",
    MESOCYCLE_START_DATE_REQUIRED:
      "Add a start date before activating this mesocycle.",
    MESOCYCLE_DURATION_REQUIRED:
      "Set the mesocycle duration before activating it.",
    MESOCYCLE_TEMPLATE_REQUIRED:
      "Assign at least one training template before activating this mesocycle.",
    MESOCYCLE_DURATION_MISMATCH:
      "Every assigned template must match the mesocycle duration.",
    MESOCYCLE_BEFORE_BLOCK:
      "The mesocycle cannot start before its training block.",
    MESOCYCLE_DATE_OVERLAP:
      "This mesocycle overlaps another mesocycle in the training block.",
  };

  return (
    errors[message] ??
    "Could not change the training status. Please try again."
  );
}

function validTrainingStatus(
  status: string,
): status is "draft" | "active" | "archived" {
  return ["draft", "active", "archived"].includes(status);
}

export async function createTrainingBlock(
  _previousState: TrainingBlockState,
  formData: FormData,
): Promise<TrainingBlockState> {
  const clientId = String(formData.get("clientId") ?? "");

  const values: TrainingBlockValues = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    mesocycleCount: String(formData.get("mesocycleCount") ?? "3"),
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
    mesocycleCount: String(formData.get("mesocycleCount") ?? ""),
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
      "Could not confirm the save. Check your connection and try again.",
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
    durationWeeks: String(formData.get("durationWeeks") ?? ""),
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

  const durationWeeks = Number(values.durationWeeks);

  if (
    !Number.isInteger(durationWeeks) ||
    durationWeeks < 1 ||
    durationWeeks > 52
  ) {
    return fail("Choose a duration between 1 and 52 weeks.");
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
        p_duration_weeks: durationWeeks,
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
      "Could not confirm the save. Check your connection and try again.",
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
      message:
        "Invalid assignment. Refresh the client page and try again.",
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
  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  );

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(assignmentId)
  ) {
    return {
      status: "error",
      message:
        "Invalid assignment. Refresh the client page and try again.",
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

export async function setTrainingBlockStatus(
  _previousState: TrainingStatusState,
  formData: FormData,
): Promise<TrainingStatusState> {
  const clientId = String(formData.get("clientId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(blockId) ||
    !validTrainingStatus(nextStatus)
  ) {
    return {
      status: "error",
      message:
        "Invalid status change. Refresh the client page and try again.",
    };
  }

  try {
    const admin = await createCoachAdminClient();

    const { error } = await admin.rpc(
      "set_client_training_block_status",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_block_id: blockId,
        p_status: nextStatus,
      },
    );

    if (error) {
      console.error("Training block status update failed", {
        code: error.code,
        message: error.message,
      });

      return {
        status: "error",
        message: trainingStatusError(error.message),
      };
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message:
        nextStatus === "active"
          ? "Training block activated."
          : nextStatus === "archived"
            ? "Training block archived."
            : "Training block returned to draft.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Could not confirm the status change. Check your connection and try again.",
    };
  }
}

export async function setMesocycleStatus(
  _previousState: TrainingStatusState,
  formData: FormData,
): Promise<TrainingStatusState> {
  const clientId = String(formData.get("clientId") ?? "");
  const mesocycleId = String(
    formData.get("mesocycleId") ?? "",
  );
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (
    !uuidPattern.test(clientId) ||
    !uuidPattern.test(mesocycleId) ||
    !validTrainingStatus(nextStatus)
  ) {
    return {
      status: "error",
      message:
        "Invalid status change. Refresh the client page and try again.",
    };
  }

  try {
    const admin = await createCoachAdminClient();

    const { error } = await admin.rpc(
      "set_client_mesocycle_status",
      {
        p_coach_id: process.env.COACH_USER_ID!,
        p_mesocycle_id: mesocycleId,
        p_status: nextStatus,
      },
    );

    if (error) {
      console.error("Mesocycle status update failed", {
        code: error.code,
        message: error.message,
      });

      return {
        status: "error",
        message: trainingStatusError(error.message),
      };
    }

    revalidatePath(`/coach/clients/${clientId}`);

    return {
      status: "success",
      message:
        nextStatus === "active"
          ? "Mesocycle activated."
          : nextStatus === "archived"
            ? "Mesocycle archived."
            : "Mesocycle returned to draft.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Could not confirm the status change. Check your connection and try again.",
    };
  }
}