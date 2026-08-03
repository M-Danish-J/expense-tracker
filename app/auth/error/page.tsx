import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { AuthHeading, AuthLayout } from "@/components/auth/auth-layout";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Something went wrong" };

/** Known error codes get a human explanation; anything else stays generic. */
const MESSAGES: Record<string, string> = {
  "no-workspace":
    "Your account doesn't have an active workspace. Sign in again, or contact the workspace owner if you were removed.",
  access_denied: "That link is no longer valid. Please request a new one.",
  otp_expired: "That link has expired. Please request a new one.",
};

export default function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  return (
    <AuthLayout
      slideIndex={3}
    >
      <div className="space-y-lg text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-pill bg-danger-light">
          <AlertTriangle className="size-5 text-danger" aria-hidden />
        </span>
        <Suspense fallback={<Skeleton className="mx-auto h-20 w-full" />}>
          <ErrorMessage searchParams={searchParams} />
        </Suspense>
        <Link
          href="/auth/login"
          className="inline-block text-body font-medium text-brand-900 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const code = params?.error;

  return (
    <AuthHeading
      title="Something went wrong"
      description={
        (code && MESSAGES[code]) ??
        "We couldn't complete that request. Please try again."
      }
    />
  );
}
