import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientNavigation } from "@/components/navigation/client-navigation";

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

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <ClientNavigation />

      <div className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
    </div>
  );
}