import { SidebarNav } from "@/components/app/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { UserMenu } from "@/components/app/user-menu";
import type { SessionContext } from "@/lib/workspace";

/**
 * Pencil spec — 240px column on $sidebar-bg with the brand/workspace row on
 * top, the nav in the middle, and the signed-in user pinned to the bottom.
 */
export function SidebarContents({
  session,
  onNavigate,
}: {
  readonly session: SessionContext;
  readonly onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <WorkspaceSwitcher
        activeId={session.workspace.id}
        workspaces={session.memberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          currency: m.workspace.default_currency,
        }))}
      />

      <div className="flex-1 overflow-y-auto pb-4">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <UserMenu
        name={session.profile.full_name}
        email={session.email}
        avatarUrl={session.profile.avatar_url}
      />
    </div>
  );
}

export function Sidebar({ session }: { readonly session: SessionContext }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
      <SidebarContents session={session} />
    </aside>
  );
}
