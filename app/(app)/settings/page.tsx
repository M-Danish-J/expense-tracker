import { Suspense } from "react";
import type { Metadata } from "next";

import { getSessionContext } from "@/lib/workspace";
import { canAdmin, type WorkspaceRole } from "@/lib/db/types";
import { Header } from "@/components/app/header";
import { ProfileForm } from "@/components/settings/profile-form";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const session = await getSessionContext();

  return (
    <>
      <Header
        session={session}
        title="Settings"
        subtitle="Your profile and this workspace."
      />

      <main className="mx-auto max-w-3xl space-y-lg px-4 py-lg sm:px-lg">
        <section
          aria-labelledby="profile-heading"
          className="rounded-lg border border-border bg-surface p-lg shadow-card"
        >
          <h2 id="profile-heading" className="text-h3 font-medium text-content">
            Profile
          </h2>
          <p className="mt-1 text-body text-content-secondary">
            How you appear across Expensio.
          </p>
          <div className="mt-lg">
            <ProfileForm
              email={session.email}
              fullName={session.profile.full_name}
              timezone={session.profile.timezone}
            />
          </div>
        </section>

        <section
          aria-labelledby="workspace-heading"
          className="rounded-lg border border-border bg-surface p-lg shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="workspace-heading"
                className="text-h3 font-medium text-content"
              >
                Workspace
              </h2>
              <p className="mt-1 text-body text-content-secondary">
                Financial data belongs to a workspace, not to you directly.
              </p>
            </div>
            <Badge variant="category">{roleLabel(session.role)}</Badge>
          </div>

          <dl className="mt-lg grid gap-md sm:grid-cols-2">
            <div>
              <dt className="text-label font-medium text-content-secondary">
                Currency
              </dt>
              <dd className="mt-1 text-body text-content">
                {session.workspace.default_currency}
              </dd>
            </div>
            <div>
              <dt className="text-label font-medium text-content-secondary">
                Members
              </dt>
              <dd className="mt-1 text-body text-content">
                {session.memberships.length === 1
                  ? "Just you"
                  : `${session.memberships.length} workspaces available`}
              </dd>
            </div>
          </dl>

          {canAdmin(session.role) ? (
            <div className="mt-lg border-t border-border-light pt-lg">
              <WorkspaceForm name={session.workspace.name} />
            </div>
          ) : (
            <p className="mt-lg border-t border-border-light pt-lg text-body text-content-secondary">
              Only owners and admins can change workspace settings.
            </p>
          )}
        </section>
      </main>
    </>
  );
}

function roleLabel(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function SettingsSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3.5 sm:px-lg">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="mx-auto max-w-3xl space-y-lg px-4 py-lg sm:px-lg">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </>
  );
}
