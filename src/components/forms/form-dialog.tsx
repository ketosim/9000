"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function FormDialog({
  title,
  trigger,
  children,
  primary = false,
}: {
  title: string;
  trigger: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [renderContent, setRenderContent] = useState(false);
  const baseline = useRef("");
  function snapshot() {
    return JSON.stringify(
      Array.from(dialog.current?.querySelectorAll("input,textarea") ?? [])
        .filter((node) => (node as HTMLInputElement).type !== "hidden")
        .map((node) => {
          const input = node as HTMLInputElement;
          return [
            input.name,
            input.type === "radio" || input.type === "checkbox"
              ? input.checked
              : input.value,
          ];
        }),
    );
  }
  useEffect(() => {
    if (renderContent) baseline.current = snapshot();
  }, [renderContent]);
  useEffect(() => {
    // Fresh server content follows a successful save/navigation. Action errors
    // update the child form locally and leave the dialog open.
    dialog.current?.close();
  }, [children]);
  function close() {
    if (dialog.current?.querySelector('[aria-busy="true"]')) return;
    const changed = snapshot() !== baseline.current;
    if (changed && !window.confirm("Discard the unsaved changes in this form?"))
      return;
    dialog.current?.close();
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRenderContent(true);
          dialog.current?.showModal();
        }}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${primary ? "bg-hal-red text-white" : "border border-white/15 text-hal-red-bright hover:bg-white/5"}`}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setRenderContent(false)}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[min(48rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-white/20 bg-panel p-5 text-foreground backdrop:bg-black/75 sm:p-7"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-lg border border-white/15 px-4 text-sm"
          >
            Close
          </button>
        </header>
        {renderContent && children}
      </dialog>
    </>
  );
}
