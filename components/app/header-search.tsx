"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Global search. Rather than a separate search surface, it hands the term to
 * the transactions page, which already does server-side searching.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = term.trim();
    router.push(
      query ? `/transactions?q=${encodeURIComponent(query)}` : "/transactions",
    );
  };

  return (
    <form onSubmit={submit} role="search" className="hidden md:block">
      <label htmlFor="global-search" className="sr-only">
        Search transactions
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <input
          id="global-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search…"
          className="h-10 w-44 rounded-md border border-border bg-surface pl-9 pr-3 text-body text-content transition-[width,border-color] placeholder:text-content-muted focus-visible:w-60 focus-visible:border-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900/15 lg:w-56 lg:focus-visible:w-72"
        />
      </div>
    </form>
  );
}
