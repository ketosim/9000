import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ programId: string }>;
};

export default async function ProgramPage({ params }: Props) {
  const { programId } = await params;

  redirect(`/coach/programs/${programId}/builder`);
}