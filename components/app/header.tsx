import { MobileNav } from "@/components/app/mobile-nav";
import { SidebarContents } from "@/components/app/sidebar";
import { HeaderSearch } from "@/components/app/header-search";
import type { SessionContext } from "@/lib/workspace";

/**
 * Pencil spec — page title on the left, search and the primary action on the
 * right. Below `lg` the sidebar trigger takes the leading position.
 */
export function Header({
  session,
  title,
  subtitle,
  actions,
}: {
  readonly session: SessionContext;
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-lg lg:gap-lg">
        <MobileNav>
          <SidebarContents session={session} />
        </MobileNav>

        <div className="min-w-0 flex-1">
          {/* Narrow phones can't fit a 20px title next to the actions without
              clipping it, so the type steps up rather than truncating. */}
          <h1 className="truncate text-h3 font-semibold text-content sm:text-h2 lg:text-h1">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 hidden truncate text-body text-content-secondary sm:block">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HeaderSearch />
          {actions}
        </div>
      </div>
    </header>
  );
}
