import Link from "next/link";
import AuthAlert from "@/components/ui/AuthAlert";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/20 via-background to-background">
      <AuthAlert error={error} />
      <div className="w-full max-w-md rounded-3xl bg-card/80 backdrop-blur-xl p-8 shadow-2xl border border-white/10 transition-all duration-500 hover:shadow-blue-500/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
            Begin Journey
          </h1>
          <p className="text-muted-foreground">Create an account to build your vocabulary bank.</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors backdrop-blur-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors backdrop-blur-sm"
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
              className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors backdrop-blur-sm"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton
            formAction={signup}
            className="w-full rounded-xl bg-blue-500 px-4 py-3.5 text-sm font-bold text-background transition-all hover:bg-blue-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
          >
            Create Account
          </SubmitButton>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-400 hover:underline transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
