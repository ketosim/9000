import Link from "next/link";
import { createCoachAdminClient } from "@/lib/supabase/admin";

import { ProgramList, type ProgramCard } from "./program-list";

export default async function ProgramsPage() {
  const admin = await createCoachAdminClient();

  const { data, error } = await admin
    .from("programs")
    .select(
      "id, name, goal, description, duration_weeks, sessions_per_week, status, template_version, template_revision",
    )
    .eq("created_by", process.env.COACH_USER_ID!)
    .order("created_at", { ascending: false });

  const programs: ProgramCard[] = data ?? [];

  return (
    <main className="hal-grid min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
              Training library
            </p>

            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Programs
            </h1>

            <p className="mt-3 text-muted">Your saved training programs.</p>
          </div>

          <Link
            href="/coach/programs/new"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-hal-red px-5 py-3 font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:bg-hal-red-dark"
          >
            Create program
          </Link>
        </header>

        {error ? (
          <p
            role="alert"
            className="mt-8 rounded-xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200"
          >
            Could not load programs. Please reload this page.
          </p>
        ) : (
          <ProgramList programs={programs} />
        )}
      </div>
    </main>
  );
}
