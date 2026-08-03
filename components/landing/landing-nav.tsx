"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/landing-content";

/**
 * Pencil spec — 72px bar on $surface with a 1px bottom border, links centred,
 * "Sign in" and a primary CTA on the right.
 *
 * Below `lg` the links collapse into a disclosure panel. It is a small client
 * island: the rest of the landing page stays a static Server Component so it
 * ships as HTML for crawlers.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  // A resize past the breakpoint would otherwise leave the panel stuck open.
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, [open]);

  // Don't let the page scroll behind the open panel.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Expensio home"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-8 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-body font-medium text-content-secondary transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-4 lg:ml-0">
          <Link
            href="/auth/login"
            className="hidden rounded-sm text-body font-medium text-content-secondary transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-block"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="h-10 px-5">
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-1 flex size-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        id="landing-mobile-nav"
        hidden={!open}
        className={cn(
          "border-t border-border-light bg-surface lg:hidden",
          open && "animate-fade-in",
        )}
      >
        <nav aria-label="Primary" className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <ul className="divide-y divide-border-light">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-body font-medium text-content"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="block py-3.5 text-body font-medium text-content"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
