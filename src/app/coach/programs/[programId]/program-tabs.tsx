"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProgramTabs({ programId }: { programId: string }) {
  const pathname = usePathname();
  const base = `/coach/programs/${programId}`;

    const tabs = [
    {
        label: "Workouts",
        href: `${base}/builder`,
        active:
        pathname === base ||
        pathname === `${base}/builder` ||
        pathname.startsWith(`${base}/workouts/`),
    },
    {
        label: "Details",
        href: `${base}/details`,
        active: pathname === `${base}/details`,
    },
    ];

  return (
    <nav
      aria-label="Program sections"
      className="grid grid-cols-2 border-b border-white/10 sm:flex sm:gap-6"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`inline-flex min-h-12 items-center justify-center border-b-2 px-5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-red-400 sm:min-w-32 ${
            tab.active
              ? "border-hal-red text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}