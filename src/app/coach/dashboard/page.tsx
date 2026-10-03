import Link from "next/link";
import { logout } from "@/app/logout/actions";
import { createCoachAdminClient } from "@/lib/supabase/admin";

type ClientProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export default async function CoachDashboard() {
  const admin = await createCoachAdminClient();

  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [clientsResult, recentCountResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, display_name", { count: "exact" })
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .limit(5),

    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "client")
      .gte("created_at", sevenDaysAgo),
  ]);

  const clients: ClientProfile[] = clientsResult.data ?? [];

  const totalClients = clientsResult.error
    ? null
    : clientsResult.count;

  const newClients = recentCountResult.error
    ? null
    : recentCountResult.count;

  const today = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Australia/Sydney",
  }).format(now);

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {today}
          </p>

          <form action={logout}>
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-white/15 bg-panel px-4 py-2 text-sm font-medium text-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              Log out
            </button>
          </form>
        </header>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Your coaching
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Coach overview
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Your clients and their training, all in one place.
          </p>
        </section>

        <section
          aria-label="Client summary"
          className="mt-8 grid gap-3 sm:grid-cols-2"
        >
          <article className="hal-panel relative overflow-hidden rounded-2xl p-6">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-hal-red"
            />

            <p className="text-sm text-muted">Client accounts</p>

            <p className="mt-3 text-4xl font-semibold tabular-nums">
              {totalClients ?? "—"}
            </p>
          </article>

          <article className="hal-panel rounded-2xl p-6">
            <p className="text-sm text-muted">Added in the last 7 days</p>

            <p className="mt-3 text-4xl font-semibold tabular-nums">
              {newClients ?? "—"}
            </p>
          </article>
        </section>

        {(clientsResult.error || recentCountResult.error) && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-white/15 p-4 text-sm leading-6"
          >
            Some client information could not be loaded. Refresh the page
            to try again.
          </p>
        )}

        <section className="mt-10" aria-labelledby="clients-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
                Clients
              </p>

              <h2
                id="clients-heading"
                className="mt-2 text-2xl font-semibold"
              >
                Recently added
              </h2>
            </div>

            <Link
              href="/coach/clients/new"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-hal-red px-5 font-medium text-white transition hover:bg-hal-red-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Add client
            </Link>
          </div>

          {clientsResult.error ? (
            <div className="hal-panel mt-5 rounded-xl p-6 text-sm text-muted">
              Your client list is temporarily unavailable.
            </div>
          ) : clients.length === 0 ? (
            <div className="hal-panel mt-5 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-semibold">No clients yet</h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                Create your first client account to get started.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {clients.map((client) => {
                const name =
                  client.display_name?.trim() ||
                  client.username ||
                  "Unnamed client";

                const initials = name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase();

                return (
                  <Link
                    key={client.id}
                    href={`/coach/clients/${client.id}`}
                    className="hal-panel flex min-h-20 items-center gap-4 rounded-xl p-4 transition hover:border-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hal-red-bright sm:p-5"
                  >
                    <div
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-panel-light font-semibold"
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-medium">
                        {name}
                      </h3>

                      <p className="mt-1 break-words text-sm text-muted">
                        {client.username
                          ? `@${client.username}`
                          : "Username not set"}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xl text-hal-red-bright"
                    >
                      ›
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/coach/clients"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg text-sm text-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            View all clients →
          </Link>
        </section>
      </div>
    </main>
  );
}