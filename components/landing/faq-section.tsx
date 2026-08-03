import { ChevronDown } from "lucide-react";

import { FAQS } from "@/lib/landing-content";

/**
 * Pencil spec — a stack of questions divided by 1px rules, each with a chevron.
 *
 * Built on native `<details>`/`<summary>`: it needs no JavaScript, is keyboard
 * and screen-reader accessible for free, and — the reason it matters here —
 * every answer is present in the HTML, so crawlers index the content whether or
 * not the item is expanded.
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[100px]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-[640px] text-center">
          <h2
            id="faq-heading"
            className="text-[26px] font-bold leading-tight tracking-tight text-content sm:text-[32px] lg:text-[40px]"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-body leading-relaxed text-content-secondary sm:text-h3">
            Everything you need to know about tracking your finances with
            Expensio.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[760px] sm:mt-14">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              name="faq"
              open={index === 0}
              className="group border-b border-border last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:py-6 [&::-webkit-details-marker]:hidden">
                <h3 className="text-body font-semibold text-content sm:text-h3">
                  {faq.question}
                </h3>
                <ChevronDown
                  className="size-5 shrink-0 text-content-muted transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 pr-8 text-body leading-[1.7] text-content-secondary sm:pb-6">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
