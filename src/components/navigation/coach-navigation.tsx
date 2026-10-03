"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/coach/dashboard",
    label: "Overview",
    number: "01",
  },
  {
    href: "/coach/clients",
    label: "Clients",
    number: "02",
  },
  {
    href: "/coach/programs",
    label: "Programs",
    number: "03",
  },
  {
    href: "/coach/reviews",
    label: "Reviews",
    number: "04",
  },
];

export function CoachNavigation({
  sidebarVisible = true,
}: {
  sidebarVisible?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/coach/dashboard" && pathname.startsWith(`${href}/`))
    );
  }

  return (
    <>
      {/* Tablet and desktop sidebar */}
      <aside
        id="coach-sidebar"
        className={`sticky top-0 hidden h-dvh border-r border-white/10 bg-black ${sidebarVisible ? "md:flex md:flex-col md:p-6" : ""}`}
      >
        <p className="text-xl font-bold tracking-[0.16em] text-white">9000</p>

        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
          Coach
        </p>

        <nav className="mt-12 space-y-2" aria-label="Coach navigation">
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 items-center gap-4 rounded-lg px-4 transition ${
                  active
                    ? "bg-panel-light text-white"
                    : "text-muted hover:bg-panel hover:text-white"
                }`}
              >
                <span
                  className={`font-mono text-xs ${
                    active ? "text-hal-red-bright" : ""
                  }`}
                >
                  {item.number}
                </span>

                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Phone bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Coach navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] transition ${
                  active ? "text-white" : "text-muted"
                }`}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 bg-hal-red" />
                )}

                <span
                  className={`font-mono text-[9px] ${
                    active ? "text-hal-red-bright" : ""
                  }`}
                >
                  {item.number}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
