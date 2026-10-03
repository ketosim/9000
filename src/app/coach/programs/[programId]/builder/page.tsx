import { ProgramWorkspace } from "../program-workspace";

type Props = {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ week?: string | string[] }>;
};

export default async function ProgramBuilderPage({
  params,
  searchParams,
}: Props) {
  const [{ programId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const weekId =
    typeof query.week === "string" ? query.week : undefined;

  return (
    <ProgramWorkspace
      programId={programId}
      weekId={weekId}
    />
  );
}