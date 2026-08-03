"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/dates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Drives the dashboard's date range through the URL, so it is shareable. */
export function PeriodSelector({ value }: { readonly value: PeriodKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "this_month") params.delete("period");
    else params.set("period", next);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <label htmlFor="dashboard-period" className="sr-only">
        Reporting period
      </label>
      <Select value={value} onValueChange={change}>
        <SelectTrigger id="dashboard-period" className="h-10 w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
