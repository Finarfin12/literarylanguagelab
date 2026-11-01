import { signup } from "../actions";
import Link from "next/link";
import AuthAlert from "@/components/ui/AuthAlert";
import SubmitButton from "@/components/ui/SubmitButton";
import OAuthButtons from "@/components/ui/OAuthButtons";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <AuthAlert error={error} />
      <div className="w-full max-w-md rounded-card bg-card p-4 md:p-8 border border-border transition-all duration-500">
        <div className="text-center mb-8">
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground mb-3">
            Begin Journey
          </h1>
          <p className="text-muted-foreground">Create an account to build your vocabulary bank.</p>
        </div>

        <form action={signup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-control border border-border bg-background px-4 py-3 text-foreground focus:border-border focus:outline-none focus:ring-1 focus:ring-border transition-colors"
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
              className="w-full rounded-control border border-border bg-background px-4 py-3 text-foreground focus:border-border focus:outline-none focus:ring-1 focus:ring-border transition-colors"
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
              className="w-full rounded-control border border-border bg-background px-4 py-3 text-foreground focus:border-border focus:outline-none focus:ring-1 focus:ring-border transition-colors"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton
            className="w-full rounded-control bg-brand-solid px-4 py-3.5 text-sm font-bold text-on-brand transition-all hover:bg-brand-hover active:scale-95 "
          >
            Create Account
          </SubmitButton>
        </form>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-ink hover:underline transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
