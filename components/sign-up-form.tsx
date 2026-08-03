"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading } from "@/components/auth/auth-layout";
import { AuthError } from "@/components/auth/auth-error";

const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const strength = passwordStrength(password);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== repeatPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    // full_name is read by the database's onboarding trigger, which creates the
    // profile, the personal workspace and the default categories.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        data: { full_name: fullName.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    router.push("/auth/sign-up-success");
  };

  return (
    <div className="space-y-xl">
      <AuthHeading
        title="Create your account"
        description="Start tracking your expenses in minutes."
      />

      <form onSubmit={handleSignUp} className="space-y-lg">
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            autoComplete="name"
            placeholder="Danish Javed"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {password ? (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex h-1 flex-1 gap-1" aria-hidden>
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-full flex-1 rounded-pill transition-colors",
                      index < strength.score
                        ? strength.barClass
                        : "bg-surface-tertiary",
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-caption font-medium", strength.textClass)}>
                {strength.label}
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="repeat-password">Confirm password</Label>
          <Input
            id="repeat-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
        </div>

        <AuthError message={error} />

        <Button type="submit" full disabled={isLoading}>
          {isLoading ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-body text-content-secondary">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-brand-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

/** A rough, purely advisory strength hint — the real rule is the length check. */
function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, label: "Weak", barClass: "bg-danger", textClass: "text-danger" };
  }
  if (score === 2) {
    return { score, label: "Fair", barClass: "bg-warning", textClass: "text-warning" };
  }
  if (score === 3) {
    return { score, label: "Good", barClass: "bg-info", textClass: "text-info" };
  }
  return { score, label: "Strong", barClass: "bg-success", textClass: "text-success" };
}
