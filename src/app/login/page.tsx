import Link from "next/link";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-12 text-white">
      <div className="absolute left-[-100px] top-[-100px] h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-100px] h-80 w-80 rounded-full bg-lime-400/20 blur-3xl" />

      <section className="relative w-full max-w-md">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-lime-400"
        >
          9000
        </Link>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
            Welcome back
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Sign in to train
          </h1>

          <p className="mt-3 text-zinc-400">
            Summer is coming 
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

        <form action={login} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-zinc-300"
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
                placeholder="simonanana"
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-300"
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
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 accent-lime-400"
                />
                Remember me
              </label>

              <button
                type="button"
                className="text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                Forgot password? Ask around.
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-lime-400 py-4 font-bold text-black transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              Sign in
            </button>
        </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            New accounts? Invite only. 
          </p>
        </div>
      </section>
    </main>
  );
}