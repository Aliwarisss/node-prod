"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_PRICING, flagshipView, type FlagshipView, type PricingConfig } from "@/lib/pricing";

/* The pricing, handed down from the root layout so client components quote today's price (the admin sets it).
 * Server components read lib/pricing-store directly, or drop in <FlagshipPrice part="price" />. */
type Value = { config: PricingConfig; flagship: FlagshipView; now: number };
const Ctx = createContext<Value | null>(null);
const FALLBACK: Value = { config: DEFAULT_PRICING, flagship: flagshipView(DEFAULT_PRICING, 0), now: 0 };

export function PricingProvider({ value, children }: { value: Value; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const usePricing = () => useContext(Ctx) ?? FALLBACK;
export const useFlagship = () => usePricing().flagship;

/* one part of the flagship's price, for server components: "PKR 5,000", "PKR 10,000", "50% off"… */
export function FlagshipPrice({ part, before = "", after = "" }: { part: keyof Omit<FlagshipView, "endsAt">; before?: string; after?: string }) {
  const value = useFlagship()[part];
  return value ? <>{before}{value}{after}</> : null;
}
