import type { Metadata } from "next";

import { SignUpForm } from "@/components/sign-up-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <AuthLayout
      slideIndex={1}
    >
      <SignUpForm />
    </AuthLayout>
  );
}
