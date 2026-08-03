import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import { AuthHeading, AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Confirm your email" };

export default function Page() {
  return (
    <AuthLayout
      slideIndex={1}
    >
      <div className="space-y-lg text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-pill bg-success-light">
          <MailCheck className="size-5 text-success" aria-hidden />
        </span>
        <AuthHeading
          title="Check your email"
          description="We've sent you a confirmation link. Open it to activate your account and sign in."
        />
        <p className="text-body text-content-secondary">
          Already confirmed?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-brand-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
