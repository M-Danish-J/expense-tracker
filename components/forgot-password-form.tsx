"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading } from "@/components/auth/auth-layout";
import { AuthError } from "@/components/auth/auth-error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/update-password` },
    );

    if (resetError) setError(resetError.message);
    else setSent(true);

    setIsLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-lg text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-pill bg-success-light">
          <MailCheck className="size-5 text-success" aria-hidden />
        </span>
        <AuthHeading
          title="Check your email"
          description={`If an account exists for ${email}, a reset link is on its way.`}
        />
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-body font-medium text-brand-900 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="space-y-lg text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-pill bg-brand-50">
          <KeyRound className="size-5 text-brand-900" aria-hidden />
        </span>
        <AuthHeading
          title="Reset password"
          description="Enter your email address and we'll send you a link to reset your password."
        />
      </div>

      <form onSubmit={handleForgotPassword} className="space-y-lg">
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

        <AuthError message={error} />

        <Button type="submit" full disabled={isLoading}>
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-body font-medium text-brand-900 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
