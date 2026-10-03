import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";

export default async function ClientProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, role")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name?.trim() ||
    profile?.username ||
    "Client";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="hal-grid min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Profile
          </h1>

          <p className="mt-3 text-sm text-muted">
            Manage your training account and preferences.
          </p>
        </header>

        <section className="hal-panel mt-8 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-hal-red/50 bg-hal-red-dark/30 text-2xl font-semibold text-hal-red-bright">
              {initial}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold">
                {displayName}
              </h2>

              <p className="mt-1 truncate text-sm text-muted">
                @{profile?.username ?? "username"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.18em] text-hal-red-bright">
            Account details
          </p>

          <div className="hal-panel mt-4 overflow-hidden rounded-2xl">
            <div className="border-b border-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Display name
              </p>
              <p className="mt-2">{displayName}</p>
            </div>

            <div className="border-b border-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Username
              </p>
              <p className="mt-2">
                {profile?.username ?? "Not set"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                Account type
              </p>
              <p className="mt-2 capitalize">
                {profile?.role ?? "Client"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Preferences</h2>

          <div className="hal-panel mt-5 overflow-hidden rounded-2xl">
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between border-b border-white/10 px-5 text-left active:bg-white/5"
            >
              <span>Notifications</span>
              <span className="text-sm text-muted">On</span>
            </button>

            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between border-b border-white/10 px-5 text-left active:bg-white/5"
            >
              <span>Units</span>
              <span className="text-sm text-muted">Metric</span>
            </button>

            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between px-5 text-left active:bg-white/5"
            >
              <span>Offline storage</span>
              <span className="text-sm text-muted">Enabled</span>
            </button>
          </div>
        </section>

        <form action={logout} className="mt-10">
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl border border-hal-red/50 px-5 font-medium text-hal-red-bright transition active:scale-[0.98] active:bg-hal-red-dark/20"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}