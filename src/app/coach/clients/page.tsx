import Link from "next/link";
import { createCoachAdminClient } from "@/lib/supabase/admin";

type Client = {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
};

export default async function CoachClientsPage() {
  const admin = await createCoachAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clients: Client[] = data ?? [];

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
              Client management
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Clients
            </h1>

            <p className="mt-3 text-sm text-muted">
              Manage clients, training blocks and assigned templates.
            </p>
          </div>

          <Link
            href="/coach/clients/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-hal-red px-5 py-3 font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:scale-[0.98] active:bg-hal-red-dark"
          >
            Add client
          </Link>
        </header>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">All clients</h2>

            {!error && (
              <span className="text-sm text-muted">
                {clients.length}
              </span>
            )}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200"
            >
              Could not load clients. Check the profiles table and reload
              this page.
            </div>
          ) : clients.length === 0 ? (
            <div className="hal-panel mt-5 rounded-xl p-6">
              <h3 className="text-lg font-semibold">
                No clients yet
              </h3>

              <p className="mt-2 text-sm text-muted">
                Add your first client to begin assigning training blocks.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {clients.map((client) => {
                const name =
                  client.display_name?.trim() || client.username;

                return (
                  <Link
                    key={client.id}
                    href={`/coach/clients/${client.id}`}
                    className="hal-panel group min-h-36 rounded-xl p-5 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-semibold transition group-hover:text-hal-red-bright">
                          {name}
                        </h3>

                        <p className="mt-2 break-words text-sm text-muted">
                          @{client.username}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xl text-muted transition group-hover:translate-x-1 group-hover:text-foreground"
                      >
                        ›
                      </span>
                    </div>

                    <p className="mt-6 text-sm text-muted">
                      View training blocks and client details
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}