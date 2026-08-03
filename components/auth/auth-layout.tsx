import Link from "next/link";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import {
  AuthCarousel,
  type CarouselSlide,
} from "@/components/auth/auth-carousel";

/**
 * Slide copy describes what Expensio actually does.
 *
 * The Pencil design carries placeholder marketing claims — a named testimonial,
 * "50K+ users", a "4.9 rating", a SOC 2 badge and "AI-powered insights". None
 * of those are true of this product, and a fabricated certification or customer
 * is not something to ship, so the structure is reproduced with honest copy.
 */
const SLIDES: readonly CarouselSlide[] = [
  {
    src: "/auth/slide-1.png",
    alt: "A laptop showing a financial dashboard with balances and a performance chart",
    title: "Your whole picture, in one place",
    body: "Cash, bank accounts and mobile wallets together — with balances calculated from the entries you actually recorded.",
  },
  {
    src: "/auth/slide-2.png",
    alt: "A budgeting dashboard showing spending by category and recent transactions",
    title: "See where it actually goes",
    body: "Categorise as you go. Sub-categories roll up automatically, so the dashboard shows the breakdown without extra work.",
  },
  {
    src: "/auth/slide-3.png",
    alt: "A phone displaying a secure finance app screen",
    title: "Private by construction",
    body: "Row-level security means another workspace's data isn't hidden from you — it's genuinely unreachable.",
  },
  {
    src: "/auth/slide-4.png",
    alt: "An analytics screen comparing income against expenses over time",
    title: "Transfers that behave",
    body: "Moving money between your own accounts is never counted as income or expense, so your totals stay honest.",
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Row-level security" },
  { icon: Lock, label: "Private by default" },
  { icon: Sparkles, label: "Free to get started" },
];

/**
 * Pencil spec — a 520px gradient brand panel on the left (logo top, carousel
 * centred, trust badges bottom) with the form on the right. The panel is hidden
 * below `lg`, where the form gets the full screen.
 */
export function AuthLayout({
  children,
  slideIndex = 0,
}: {
  readonly children: React.ReactNode;
  /** Each auth screen opens the carousel on a different slide, as designed. */
  readonly slideIndex?: number;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-brand-1000 via-brand-900 to-brand-800 lg:flex lg:flex-col lg:justify-between lg:gap-8 lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-[15%] size-[460px] rounded-pill bg-brand-500/15 blur-3xl"
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Expensio home"
          >
            <Logo variant="dark" />
          </Link>
        </div>

        <div className="relative">
          <AuthCarousel slides={SLIDES} startIndex={slideIndex} />
        </div>

        <ul className="relative flex items-center justify-center gap-6 text-caption text-white/60">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Expensio home"
            >
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Shared heading block above each auth form. */
export function AuthHeading({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-content sm:text-display">
        {title}
      </h1>
      <p className="text-body text-content-secondary">{description}</p>
    </div>
  );
}
