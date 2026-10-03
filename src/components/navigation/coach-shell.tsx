"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { CoachNavigation } from "./coach-navigation";

const MenuContext = createContext({ open: true, toggle: () => {} });

export function CoachShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const insideProgram = /^\/coach\/programs\/[0-9a-f-]{36}(?:\/|$)/i.test(
    pathname,
  );
  const visible = !insideProgram || open;
  const lastScroll = useRef(0);
  return (
    <MenuContext.Provider
      value={{ open: visible, toggle: () => setOpen((value) => !value) }}
    >
      <div
        className={`min-h-dvh bg-background text-foreground md:grid ${visible ? "md:grid-cols-[15rem_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)]"}`}
        onScrollCapture={(event) => {
          const target = event.target as HTMLElement;
          if (!target.matches("[data-workspace-scroll]")) return;
          const next = target.scrollTop;
          if (next > 40 && next - lastScroll.current > 6) setOpen(false);
          lastScroll.current = next;
        }}
      >
        <CoachNavigation sidebarVisible={visible} />
        <div className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
      </div>
    </MenuContext.Provider>
  );
}

export function CoachMenuButton() {
  const { open, toggle } = useContext(MenuContext);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="coach-sidebar"
      className="hidden min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-muted hover:text-white focus-visible:outline-2 focus-visible:outline-red-400 md:inline-flex"
    >
      <span aria-hidden="true">☰</span> Menu
    </button>
  );
}
