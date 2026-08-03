import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <AuthLayout
      slideIndex={0}
    >
      {/* LoginForm reads searchParams for the post-login redirect, which is
          dynamic under cacheComponents. */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-xl">
      <div className="space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="space-y-lg">
        <Skeleton className="h-[68px] w-full" />
        <Skeleton className="h-[68px] w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
