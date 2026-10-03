import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function createCoachAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const coachUserId = process.env.COACH_USER_ID;

  if (!url || !secretKey || !coachUserId) {
    throw new Error("Missing server account-management settings.");
  }

  // Verify the signed-in user before granting admin access.
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.id !== coachUserId) {
    throw new Error("You do not have permission to manage clients.");
  }

  // This separate client must never be sent to the browser.
  return createSupabaseClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}