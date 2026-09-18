"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function usernameToInternalEmail(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return null;
  }

  return `${normalizedUsername}@users.9000.invalid`;
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const email = usernameToInternalEmail(username);

  if (!email || !password) {
    redirect("/login?error=Enter a valid username and password");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Invalid username or password");
  }

  redirect("/client/today");
}