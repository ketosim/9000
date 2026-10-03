"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createClientAccount,
  type CreateClientState,
} from "./actions";

const initialState: CreateClientState = {
  status: "idle",
  message: "",
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-base text-foreground outline-none placeholder:text-muted focus:border-hal-red-bright focus:ring-1 focus:ring-hal-red-bright";

export function ClientForm() {
  const [state, formAction, pending] = useActionState(
    createClientAccount,
    initialState,
  );

  const locked =
    pending ||
    state.status === "success" ||
    state.status === "needs-check";

  return (
    <form action={formAction} className="hal-panel mt-8 rounded-2xl p-5 sm:p-8">
      <fieldset disabled={locked} className="space-y-6">
        <legend className="sr-only">New client account</legend>

        <div>
          <label htmlFor="displayName" className="text-sm font-medium">
            Client name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="off"
            required
            maxLength={80}
            placeholder="Maya Chen"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={30}
            placeholder="maya.chen"
            aria-describedby="username-help"
            className={inputClass}
          />
          <p id="username-help" className="mt-2 text-xs leading-5 text-muted">
            3–30 characters. Letters, numbers, dots, underscores or hyphens.
            Usernames are saved in lowercase.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={64}
            aria-describedby="password-help"
            className={inputClass}
          />
          <p id="password-help" className="mt-2 text-xs leading-5 text-muted">
            Use a unique password of at least 12 characters. Share it privately
            with your client—it will not be displayed after creation.
          </p>
        </div>

        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-hal-red px-5 py-3 font-semibold text-white transition hover:bg-hal-red-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating account…"
            : state.status === "success"
              ? "Account created"
              : "Create client"}
        </button>
      </fieldset>

      {state.message && (
        <p
          role={state.status === "success" ? "status" : "alert"}
          className="mt-5 rounded-xl border border-white/15 bg-black/40 p-4 text-sm leading-6 text-foreground"
        >
          {state.message}
        </p>
      )}

      <Link
        href="/coach/clients"
        className="mt-4 flex min-h-12 items-center justify-center rounded-lg text-sm text-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        Back to clients
      </Link>
    </form>
  );
}