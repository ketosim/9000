"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

const NavigationContext = createContext<() => boolean>(() => true);

// Compare editable values only: generated hidden IDs and move buttons are not edits.
function formSnapshot(form: HTMLFormElement) {
  return JSON.stringify(
    Array.from(form.elements).flatMap((element) => {
      if (element instanceof HTMLInputElement) {
        if (
          !element.name ||
          ["hidden", "submit", "button", "reset"].includes(element.type)
        )
          return [];
        return [
          [
            element.name,
            element.type,
            element.type === "checkbox" || element.type === "radio"
              ? String(element.checked)
              : element.value,
          ],
        ];
      }
      if (element instanceof HTMLTextAreaElement)
        return [[element.name, "textarea", element.value]];
      if (element instanceof HTMLSelectElement)
        return [
          [
            element.name,
            "select",
            JSON.stringify(
              Array.from(element.selectedOptions, (option) => option.value),
            ),
          ],
        ];
      return [];
    }),
  );
}

export function ProgramNavigationGuard({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const baselines = useRef(new Map<HTMLFormElement, string>());

  const hasChanges = useCallback((except?: HTMLFormElement) => {
    let dirty = false;
    for (const [form, baseline] of baselines.current) {
      if (!form.isConnected || !root.current?.contains(form))
        baselines.current.delete(form);
      else if (form !== except && formSnapshot(form) !== baseline) dirty = true;
    }
    return dirty;
  }, []);

  const confirmNavigation = useCallback(
    () =>
      !hasChanges() ||
      window.confirm(
        "You have unsaved changes. Leave this section and discard them?",
      ),
    [hasChanges],
  );

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const baselinesForThisMount = baselines.current;
    const collect = () => {
      for (const form of container.querySelectorAll("form")) {
        if (!baselinesForThisMount.has(form))
          baselinesForThisMount.set(form, formSnapshot(form));
      }
      for (const form of baselinesForThisMount.keys()) {
        if (!container.contains(form)) baselinesForThisMount.delete(form);
      }
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(container, { childList: true, subtree: true });

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    // Capture normal link navigation before Next's Link handles the click.
    // This also covers the coach navigation outside this program's layout.
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(destination.protocol)) return;
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target;
      if (
        !(form instanceof HTMLFormElement) ||
        !container.contains(form) ||
        !hasChanges(form)
      )
        return;
      if (
        !window.confirm(
          "Another form has unsaved changes. Continue? Those changes may be discarded.",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      observer.disconnect();
      baselinesForThisMount.clear();
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
    };
  }, [confirmNavigation, hasChanges]);

  return (
    <NavigationContext.Provider value={confirmNavigation}>
      <div ref={root} className="h-full min-h-0 min-w-0">
        {children}
      </div>
    </NavigationContext.Provider>
  );
}

export function useProgramNavigation() {
  return useContext(NavigationContext);
}
