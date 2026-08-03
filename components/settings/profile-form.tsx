"use client";

import { useForm } from "react-hook-form";

import { updateProfile } from "@/app/actions/workspace";
import { profileSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";

interface FormValues {
  full_name: string;
  timezone: string;
}

/** Timezones the browser knows about, so the greeting matches the user's day. */
function timezoneOptions(): string[] {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  return supported.length > 0 ? supported : ["UTC"];
}

export function ProfileForm({
  email,
  fullName,
  timezone,
}: {
  readonly email: string;
  readonly fullName: string | null;
  readonly timezone: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: { full_name: fullName ?? "", timezone },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    const result = await updateProfile(parsed.data);
    if (result.ok) toast.success("Profile updated");
    else toast.error(result.error);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-lg">
      <div className="grid gap-lg sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(errors.full_name)}
            {...register("full_name")}
          />
          {errors.full_name ? (
            <p className="text-caption text-danger" role="alert">
              {errors.full_name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} readOnly disabled />
          <p className="text-caption text-content-secondary">
            Managed by your sign-in method.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          className="flex h-11 w-full rounded-md border border-border bg-surface px-3.5 text-body text-content transition-colors focus-visible:border-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/15"
          {...register("timezone")}
        >
          {timezoneOptions().map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className="text-caption text-content-secondary">
          Used for the greeting and date grouping.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
