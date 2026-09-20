import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ClientLayoutProps = {
  children: ReactNode;
};

export default async function ClientLayout({
  children,
}: ClientLayoutProps) {
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

  if (profile.role !== "client") {
    redirect("/coach/dashboard");
  }

  return children;
}