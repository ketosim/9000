import Link from "next/link";
import { notFound } from "next/navigation";
import { createCoachAdminClient } from "@/lib/supabase/admin";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const admin = await createCoachAdminClient();
  const { clientId } = await params;

  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!validId.test(clientId)) {
    notFound();
  }

  const { data: client, error } = await admin
    .from("profiles")
    .select("id, username, display_name, created_at")
    .eq("id", clientId)
    .eq("role", "client")
    .maybeSingle();

  if (error) {
    throw new Error("Could not load this client. Please try again.");
  }

  if (!client) {
    notFound();
  }

  const name =
    client.display_name?.trim() ||
    client.username ||
    "Unnamed client";

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0))
    .join("")
    .toUpperCase();

  const joined = client.created_at
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Australia/Sydney",
      }).format(new Date(client.created_at))
    : "Not available";

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/coach/clients"
          className="inline-flex min-h-11 items-center rounded-lg text-sm text-muted transition hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          ← Back to clients
        </Link>

        <header className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Client profile
          </p>

          <div className="mt-5 flex items-center gap-4 sm:gap-5">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-panel-light text-xl font-semibold"
            >
              {initials}
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {name}
              </h1>

              <p className="mt-2 break-words text-sm text-muted">
                {client.username
                  ? `@${client.username}`
                  : "Username not set"}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-2xl font-semibold">
            Account details
          </h2>

          <dl className="hal-panel mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl">
            <div className="p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Display name
              </dt>
              <dd className="mt-2 break-words">
                {client.display_name?.trim() || "Not set"}
              </dd>
            </div>

            <div className="p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Username
              </dt>
              <dd className="mt-2 break-words">
                {client.username || "Not set"}
              </dd>
            </div>

            <div className="p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Account type
              </dt>
              <dd className="mt-2">Client</dd>
            </div>

            <div className="p-5 sm:p-6">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                Joined
              </dt>
              <dd className="mt-2">{joined}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}