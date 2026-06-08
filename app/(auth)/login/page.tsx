import { login } from "../actions";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border transition-all duration-300 hover:shadow-brand/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Literary Language Lab
          </h1>
          <p className="text-muted-foreground">Log in to continue your journey</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-background transition-all hover:bg-brand-hover hover:scale-[1.02] active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
