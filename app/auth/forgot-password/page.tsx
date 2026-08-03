import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <AuthLayout
      slideIndex={2}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
