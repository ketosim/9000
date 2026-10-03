import type { ReactNode } from "react";
import Link from "next/link";
import { CoachMenuButton } from "@/components/navigation/coach-shell";
import { ProgramTabs } from "./program-tabs";
import { ProgramNavigationGuard } from "./program-navigation-guard";

export default async function ProgramLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return (
    <div className="h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] md:h-dvh">
      <ProgramNavigationGuard key={programId}>
        <div className="hal-grid flex h-full min-h-0 flex-col bg-background text-foreground">
          <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-background px-3 sm:px-5">
            <CoachMenuButton />
            <Link
              href="/coach/programs"
              className="inline-flex min-h-12 items-center rounded-md px-2 text-sm text-muted focus-visible:outline-2 focus-visible:outline-red-400"
            >
              ← Programs
            </Link>
            <div className="ml-auto">
              <ProgramTabs programId={programId} />
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </ProgramNavigationGuard>
    </div>
  );
}
