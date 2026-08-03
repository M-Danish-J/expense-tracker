import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/update-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Set a new password" };

export default function Page() {
  return (
    <AuthLayout
      slideIndex={2}
    >
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
