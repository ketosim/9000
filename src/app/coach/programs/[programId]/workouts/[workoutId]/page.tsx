import { ProgramWorkspace } from "../../program-workspace";
export default async function WorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string; workoutId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ programId, workoutId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  return (
    <ProgramWorkspace
      programId={programId}
      workoutId={workoutId}
      initialView={query.view === "progression" ? "progression" : "exercises"}
    />
  );
}
