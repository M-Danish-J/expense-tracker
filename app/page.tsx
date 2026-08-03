import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";

import { siteOrigin } from "@/lib/site";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";
import { FaqSection } from "@/components/landing/faq-section";
import {
  AccountCardsMockup,
  DashboardMockup,
  InsightsMockup,
  OverviewCardMockup,
  TransactionListMockup,
} from "@/components/landing/mockups";
import {
  FAQS,
  FEATURES,
  FOOTER_COLUMNS,
  PROBLEMS,
  SECURITY_POINTS,
  STEPS,
  TRUST_SIGNALS,
} from "@/lib/landing-content";

const TITLE = "Expensio — Expense Tracker for Clear, Confident Money Decisions";
const DESCRIPTION =
  "Track expenses, manage accounts, and understand your spending in one simple app. Record income and expenses, transfer between accounts, and see your full financial picture. Free to get started.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "expense tracker",
    "personal finance app",
    "budget tracker",
    "money management",
    "spending tracker",
    "income and expense tracker",
    "multi account finance tracker",
    "shared finance workspace",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Expensio",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Structured data.
 *
 * The FAQ entries come from the same constant the page renders, so the markup
 * and the schema can never disagree — mismatched FAQPage data is treated as
 * spam, not just ignored.
 */
const SITE_URL = siteOrigin();

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Expensio",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to get started. No credit card required.",
      },
      featureList: FEATURES.map((feature) => feature.title),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Expensio",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Expensio",
      url: SITE_URL,
      description: "A simpler way to understand your money.",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

const COPYRIGHT_YEAR = 2026;

const TONE_CHIP = {
  brand: "bg-brand-50 text-brand-900",
  info: "bg-info-light text-info",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
} as const;

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Content is authored by us, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-svh bg-surface">
        <LandingNav />

        <main id="main">
          <HeroSection />
          <TrustStrip />
          <ProblemSection />
          <SolutionSection />
          <FeatureGrid />
          <TransactionShowcase />
          <AccountsShowcase />
          <InsightsShowcase />
          <WorkspaceSection />
          <SecuritySection />
          <HowItWorks />
          <VisualBreak />
          <FaqSection />
          <FinalCta />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function HeroSection() {
  return (
    <section
      id="product"
      className="relative overflow-hidden bg-background px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pb-[60px] lg:pt-20"
    >
      {/* The radial brand glow behind the mockup, from the Pencil design. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] -z-0 h-[520px] w-[min(1100px,110vw)] -translate-x-1/2 rounded-pill bg-brand-100/60 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="inline-block rounded-pill bg-brand-50 px-4 py-1.5 text-overline uppercase text-brand-600">
            Your money. Clearer than ever.
          </p>

          <h1 className="mt-6 text-[32px] font-bold leading-[1.1] tracking-tight text-content sm:text-[42px] lg:text-[56px]">
            Take control of your money, one expense at a time.
          </h1>

          <p className="mx-auto mt-6 max-w-[640px] text-body leading-relaxed text-content-secondary sm:text-h3">
            Track expenses, manage accounts, understand your spending, and see
            your financial picture clearly — all in one beautifully simple
            place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/auth/sign-up">
                Start Tracking Free
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <p className="mt-5 text-label text-content-muted">
            Free to get started · No credit card required
          </p>
        </div>

        <div className="mt-12 sm:mt-14">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section aria-label="Why Expensio" className="bg-surface-secondary">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-8 sm:px-6 sm:gap-x-12 lg:gap-16 lg:px-8 lg:py-0 lg:h-[100px]">
        {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <Icon className="size-5 shrink-0 text-brand-600" aria-hidden />
            <span className="text-body font-medium text-content-secondary">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-[640px] text-center">
          <h2
            id="problem-heading"
            className="text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
          >
            Your money shouldn&apos;t be a mystery.
          </h2>
          <p className="mt-4 text-body leading-relaxed text-content-secondary sm:text-h3">
            Small purchases add up. Multiple accounts make things harder to
            follow. And spreadsheets weren&apos;t built for everyday money
            management.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body, tone }) => (
            <article
              key={title}
              className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-[12px] ${TONE_CHIP[tone]}`}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-h3 font-semibold text-content">
                {title}
              </h3>
              <p className="mt-2 text-body leading-relaxed text-content-secondary">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section
      aria-labelledby="solution-heading"
      className="bg-surface px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-[800px] text-center">
          <h2
            id="solution-heading"
            className="text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
          >
            Everything you need to understand your money.
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-body leading-relaxed text-content-secondary sm:text-h3">
            One app to track expenses, manage accounts, and make sense of your
            spending habits.
          </p>
        </div>

        <div className="mt-10 sm:mt-12">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="features-heading"
            className="text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
          >
            Your finances. Organized.
          </h2>
          <p className="mt-3 text-body leading-relaxed text-content-secondary sm:text-h3">
            Six powerful features that make managing money effortless.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, tone }) => (
            <article
              key={title}
              className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
            >
              <span
                className={`flex size-10 items-center justify-center rounded-pill ${TONE_CHIP[tone]}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-h3 font-semibold text-content">
                {title}
              </h3>
              <p className="mt-2 text-body leading-relaxed text-content-secondary">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TransactionShowcase() {
  return (
    <section
      aria-labelledby="transactions-heading"
      className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2
            id="transactions-heading"
            className="text-[26px] font-bold leading-[1.2] tracking-tight text-content sm:text-[32px] lg:text-[36px]"
          >
            Every transaction.
            <br />
            Right where it belongs.
          </h2>
          <p className="mt-5 text-body leading-relaxed text-content-secondary sm:text-h3">
            Add income, expenses, and transfers in seconds. Search your history,
            filter by account or category, and keep your financial activity
            organized.
          </p>
        </div>
        <TransactionListMockup />
      </div>
    </section>
  );
}

function AccountsShowcase() {
  return (
    <section
      aria-labelledby="accounts-heading"
      className="bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Text first in the DOM so it reads sensibly; the design places the
            cards on the left at wide sizes. */}
        <div className="lg:order-2">
          <h2
            id="accounts-heading"
            className="text-[26px] font-bold leading-[1.2] tracking-tight text-content sm:text-[32px] lg:text-[36px]"
          >
            Know exactly where
            <br />
            your money lives.
          </h2>
          <p className="mt-5 text-body leading-relaxed text-content-secondary sm:text-h3">
            Organize your finances across bank accounts, cash, and mobile
            wallets. See balances at a glance and track every movement between
            them.
          </p>
        </div>
        <div className="lg:order-1">
          <AccountCardsMockup />
        </div>
      </div>
    </section>
  );
}

function InsightsShowcase() {
  return (
    <section
      aria-labelledby="insights-heading"
      className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-[60px]">
        <div>
          <h2
            id="insights-heading"
            className="text-[26px] font-bold leading-[1.2] tracking-tight text-content sm:text-[32px] lg:text-[36px]"
          >
            Turn transactions into clarity.
          </h2>
          <p className="mt-6 text-body leading-relaxed text-content-secondary sm:text-h3">
            Understand your spending patterns with simple visual insights that
            help you see the bigger picture.
          </p>
        </div>
        <InsightsMockup />
      </div>
    </section>
  );
}

function WorkspaceSection() {
  return (
    <section
      aria-labelledby="workspace-heading"
      className="bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-[640px] text-center">
          <h2
            id="workspace-heading"
            className="text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
          >
            Your money, your workspace.
          </h2>
          <p className="mt-4 text-body leading-relaxed text-content-secondary sm:text-h3">
            Keep personal finances separate or create a shared workspace for the
            people you manage money with.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8">
          <article className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-6 text-center shadow-card sm:p-8">
            <h3 className="text-h2 font-semibold text-content">
              Personal Workspace
            </h3>
            <span className="flex size-14 items-center justify-center rounded-pill bg-brand-900 text-h3 font-semibold text-content-inverse">
              D
            </span>
            <p className="text-body font-medium text-content">Just you</p>
            <span className="rounded-pill bg-brand-50 px-3.5 py-1 text-caption font-semibold text-brand-900">
              Owner
            </span>
          </article>

          <article className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-6 text-center shadow-card sm:p-8">
            <h3 className="text-h2 font-semibold text-content">
              Shared Workspace
            </h3>
            <span className="flex items-center" aria-hidden>
              {["D", "F", "M"].map((initial, index) => (
                <span
                  key={initial}
                  className={`flex size-10 items-center justify-center rounded-pill border-2 border-surface bg-brand-700 text-caption font-semibold text-content-inverse ${
                    index > 0 ? "-ml-3" : ""
                  }`}
                >
                  {initial}
                </span>
              ))}
            </span>
            <p className="text-body font-medium text-content">
              You, and whoever you share with
            </p>
            <span className="rounded-pill bg-brand-50 px-3.5 py-1 text-caption font-semibold text-brand-900">
              Roles &amp; permissions
            </span>
          </article>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section
      aria-labelledby="security-heading"
      className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl text-center">
        <h2
          id="security-heading"
          className="mx-auto max-w-[700px] text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[36px]"
        >
          Your financial data deserves to stay yours.
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-body leading-relaxed text-content-secondary sm:text-h3">
          Built with secure authentication and workspace-level data isolation so
          your financial information stays separated from everyone else&apos;s.
        </p>

        <ul className="mt-10 flex flex-col items-center justify-center gap-8 sm:mt-12 sm:flex-row sm:gap-10 lg:gap-16">
          {SECURITY_POINTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex w-full max-w-[200px] flex-col items-center gap-4"
            >
              <span className="flex size-12 items-center justify-center rounded-pill bg-brand-50">
                <Icon className="size-6 text-brand-900" aria-hidden />
              </span>
              <span className="text-h3 font-semibold text-content">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-heading"
          className="text-center text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
        >
          Start tracking in minutes.
        </h2>

        <ol className="mt-10 grid gap-10 sm:mt-12 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, number, title, body }) => (
            <li
              key={number}
              className="relative flex flex-col items-center gap-4 text-center"
            >
              {/* The connector between steps, only where the row is horizontal. */}
              {number !== "03" ? (
                <span
                  aria-hidden
                  className="absolute left-[calc(50%+56px)] top-7 hidden h-0.5 w-[calc(100%-56px)] bg-brand-200 md:block"
                />
              ) : null}
              <span className="flex size-14 items-center justify-center rounded-pill bg-brand-50">
                <Icon className="size-7 text-brand-900" aria-hidden />
              </span>
              <span className="text-[40px] font-bold leading-none text-brand-200 sm:text-[48px]">
                {number}
              </span>
              <h3 className="text-h2 font-semibold text-content">{title}</h3>
              <p className="max-w-[220px] text-body leading-relaxed text-content-secondary">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function VisualBreak() {
  return (
    <section
      aria-labelledby="clarity-heading"
      className="relative overflow-hidden bg-brand-1000 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 size-[500px] -translate-x-1/2 rounded-pill bg-brand-900/40 blur-[100px]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 sm:gap-12">
        <h2
          id="clarity-heading"
          className="text-center text-[28px] font-bold tracking-tight text-content-inverse sm:text-[36px] lg:text-[44px]"
        >
          Clarity feels good.
        </h2>
        <OverviewCardMockup />
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-gradient-to-b from-brand-1000 via-brand-900 to-brand-800 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:gap-8">
        <h2
          id="cta-heading"
          className="max-w-[700px] text-[28px] font-bold leading-[1.15] tracking-tight text-white sm:text-[36px] lg:text-[44px]"
        >
          Start making sense of your money.
        </h2>
        <p className="max-w-[580px] text-body leading-relaxed text-white/80 sm:text-h3">
          Track your spending, understand your habits, and take control of your
          financial picture.
        </p>

        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className="h-[52px] w-full bg-white px-8 text-brand-900 hover:bg-white/90 sm:w-auto"
          >
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-[52px] w-full border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>

        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-label text-white/60">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" aria-hidden />
            Free to get started
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" aria-hidden />
            No credit card required
          </span>
        </p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-sidebar px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-16">
          <div className="max-w-[300px]">
            <Logo variant="dark" size="sm" />
            <p className="mt-4 text-body leading-relaxed text-white/55">
              A simpler way to understand your money.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-16">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="text-label font-semibold tracking-wide text-white">
                  {column.heading}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-body text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-label text-white/40">
            © {COPYRIGHT_YEAR} Expensio. All rights reserved.
          </p>
          <p className="text-label text-white/40">
            Built with Next.js and Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}
