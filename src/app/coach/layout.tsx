import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachShell } from "@/components/navigation/coach-shell";

type CoachLayoutProps = {
  children: ReactNode;
};

export default async function CoachLayout({ children }: CoachLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login?error=Your profile could not be loaded");
  }

  if (profile.role !== "coach") {
    redirect("/client/today");
  }

  return <CoachShell>{children}</CoachShell>;
}
