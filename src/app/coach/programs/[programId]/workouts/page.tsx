import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ programId: string }>;
};

export default async function ProgramWorkoutsPage({ params }: Props) {
  const { programId } = await params;

  redirect(`/coach/programs/${programId}/builder`);
}