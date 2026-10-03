"use server";

import { revalidatePath } from "next/cache";
import { createCoachAdminClient } from "@/lib/supabase/admin";

export type CreateClientState = {
  status: "idle" | "error" | "success" | "needs-check";
  message: string;
};

export async function createClientAccount(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  let creationStarted = false;
  let accountCreated = false;

  try {
    // Verifies your signed-in account against COACH_USER_ID.
    const admin = await createCoachAdminClient();

    const displayName = String(formData.get("displayName") ?? "").trim();
    const username = String(formData.get("username") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (displayName.length < 1 || displayName.length > 80) {
      return {
        status: "error",
        message: "Enter a name between 1 and 80 characters.",
      };
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return {
        status: "error",
        message:
          "Username must be 3–30 characters: letters, numbers, dots, underscores or hyphens.",
      };
    }

    if (
      password.length < 12 ||
      password.length > 64 ||
      new TextEncoder().encode(password).length > 72
    ) {
      return {
        status: "error",
        message:
          "Use a password of 12–64 characters. Some symbols count toward an additional size limit.",
      };
    }

    const { data: existingProfile, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) {
      return {
        status: "error",
        message: "Could not check username availability. No account was created.",
      };
    }

    if (existingProfile) {
      return {
        status: "error",
        message: "That username is already taken.",
      };
    }

    creationStarted = true;

    const { data, error: createError } =
      await admin.auth.admin.createUser({
        email: `${username}@users.9000.invalid`,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          username,
        },
      });

    if (createError || !data.user) {
      return {
        status: "needs-check",
        message:
          "Account creation could not be confirmed. Check Supabase → Authentication → Users before trying again. The username may already exist, or the password may not meet your project's requirements.",
      };
    }

    accountCreated = true;

    // Updates the profile made by your existing signup trigger,
    // or creates it if the trigger did not create one.
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        username,
        display_name: displayName,
        role: "client",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return {
        status: "needs-check",
        message:
          "The login account was created, but saving its profile failed. Do not create it again—check the account and profiles table in Supabase.",
      };
    }

    revalidatePath("/coach/clients");

    return {
      status: "success",
      message: `${displayName}'s account is ready. They can sign in as ${username} using the password you entered.`,
    };
  } catch {
    if (accountCreated || creationStarted) {
      return {
        status: "needs-check",
        message:
          "The request was interrupted and the account may already exist. Check Supabase → Authentication → Users before retrying.",
      };
    }

    return {
      status: "error",
      message:
        "Unable to access account management. Check that you are signed in as the coach and that the server settings are configured.",
    };
  }
}