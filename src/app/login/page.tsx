import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="hal-grid flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground sm:px-6">
      <section className="w-full max-w-md">


        <div className="hal-panel mt-8 rounded-2xl p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-hal-red-bright">
            Welcome back
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Sign in to train
          </h1>

          <p className="mt-3 text-sm text-muted">Summer is coming...</p>

          {error && (
            <div
              role="alert"
              className="mt-6 border-l-2 border-hal-red bg-hal-red-dark/20 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <form action={login} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={3}
                maxLength={30}
                placeholder="Enter your username"
                className="min-h-12 w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-base text-foreground outline-none transition placeholder:text-zinc-700 focus:border-hal-red focus:ring-1 focus:ring-hal-red"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="min-h-12 w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-base text-foreground outline-none transition placeholder:text-zinc-700 focus:border-hal-red focus:ring-1 focus:ring-hal-red"
              />
            </div>

            <p className="text-sm text-muted">
              Forgot your password? Ask your coach.
            </p>

            <button
              type="submit"
              className="min-h-12 w-full rounded-lg bg-hal-red px-6 py-3 font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-hal-red-bright focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98] active:bg-hal-red-dark"
            >
              Sign in
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}