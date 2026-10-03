import { notFound } from "next/navigation";
import { createCoachAdminClient } from "@/lib/supabase/admin";
import { EditProgramForm } from "../edit-form";
import { loadRemovalCounts } from "@/lib/programs/server";

type Props = {
  params: Promise<{ programId: string }>;
};

export default async function ProgramDetailsPage({ params }: Props) {
  const { programId } = await params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(programId)) {
    notFound();
  }

  const supabase = await createCoachAdminClient();

  const { data: program, error } = await supabase
    .from("programs")
    .select(
      "id, name, goal, description, duration_weeks, sessions_per_week, status, template_version, template_revision",
    )
    .eq("id", programId)
    .eq("created_by", process.env.COACH_USER_ID!)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load program details. Please try again.");
  }

  if (!program) {
    notFound();
  }

  const initialValues = {
    name: program.name ?? "",
    goal: program.goal ?? "",
    description: program.description ?? "",
    sessionsPerWeek: String(program.sessions_per_week),
    status: program.status,
  };

  const removalCounts = await loadRemovalCounts(programId);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
      <section className="mx-auto w-full max-w-3xl py-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Program details
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {program.name}
          </h1>

          <p className="mt-3 text-sm text-muted">
            Update the name, goal, schedule and status of your program.
          </p>
        </header>

        <EditProgramForm
          key={`${programId}-${program.template_revision}-${JSON.stringify(initialValues)}`}
          programId={programId}
          initialValues={initialValues}
          revision={program.template_revision}
          fixedStructure={program.template_version === 2}
          removalCounts={removalCounts}
        />
      </section>
    </div>
  );
}
