import { ProgramWorkspace } from "../../program-workspace";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{
    programId: string;
    workoutId: string;
  }>;
}) {
  const { programId, workoutId } = await params;

  return (
    <ProgramWorkspace
      programId={programId}
      workoutId={workoutId}
    />
  );
}