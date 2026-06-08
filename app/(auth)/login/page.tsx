import Link from "next/link";
import AuthAlert from "@/components/ui/AuthAlert";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/20 via-background to-background">
      <AuthAlert error={error} />
      <div className="w-full max-w-md rounded-3xl bg-card/80 backdrop-blur-xl p-8 shadow-2xl border border-white/10 transition-all duration-500 hover:shadow-brand/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
            Literary Lab
          </h1>
          <p className="text-muted-foreground">Welcome back. Please log in to continue your journey.</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors backdrop-blur-sm"
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
              className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors backdrop-blur-sm"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton
            formAction={login}
            className="w-full rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-background transition-all hover:bg-brand-hover hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand/20"
          >
            Sign In
          </SubmitButton>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
