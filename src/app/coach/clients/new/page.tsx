import { createCoachAdminClient } from "@/lib/supabase/admin";
import { ClientForm } from "./client-form";

export default async function NewClientPage() {
  // Check permission before showing account-management UI.
  await createCoachAdminClient();

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Client management
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Add client
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Create a private training account with a username and password.
            No email address needed.
          </p>
        </header>

        <ClientForm />
      </div>
    </main>
  );
}