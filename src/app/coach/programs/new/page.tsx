import { randomUUID } from "node:crypto";
import { createCoachAdminClient } from "@/lib/supabase/admin";
import { ProgramForm } from "./program-form";

export default async function NewProgramPage() {
  await createCoachAdminClient();

  return (
    <main className="hal-grid min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
            Training programs
          </p>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Create program
          </h1>

          <p className="mt-3 text-muted">
            Set the goal and weekly schedule for your four-week template.
          </p>
        </header>

        <ProgramForm programId={randomUUID()} />
      </div>
    </main>
  );
}
