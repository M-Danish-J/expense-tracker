"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/app/nav-items";

/**
 * Pencil spec — NavItem/Active and NavItem/Inactive: padding [10, 12],
 * gap 10, radius-md, 18px icon, 14px label. Active fills with $accent and
 * flips the text to white.
 */
export function SidebarNav({ onNavigate }: { readonly onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-text-active/40",
              isActive
                ? "bg-sidebar-active font-medium text-sidebar-text-active"
                : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
