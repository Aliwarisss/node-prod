/* Pricing — the packages on sale and the promotions running on them. Admins edit it (/dashboard/pricing); the pricing
 * section on the home page and every "PKR …" around the site come from it. This file is the pure part (types,
 * defaults, the maths) and is safe on both server and client; lib/pricing-store.ts reads and writes the database. */
import { programIncludes } from "@/lib/platform-data";

export type PackageStatus = "open" | "soon" | "hidden";
export type PricePackage = {
  id: string;
  name: string;
  tagline: string;
  price: number | null; // null: no price yet ("Soon")
  compareAt: number | null; // the full price it's shown against, struck through
  currency: string;
  suffix: string; // "one-time", "per month"…
  features: string[];
  badge: string; // "Most popular", "Live now"… (empty for none)
  status: PackageStatus;
  ctaLabel: string;
  ctaHref: string;
  featured: boolean; // the big card
  flagship: boolean; // its price is "the" price quoted around the site (one package)
  color: string;
};
export type Promotion = {
  id: string;
  label: string; // "Launch offer"
  kind: "percent" | "amount";
  value: number;
  packageIds: string[]; // empty: every package
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO — shows a countdown
  active: boolean;
};
export type PricingConfig = { packages: PricePackage[]; promotions: Promotion[] };

export const DEFAULT_PRICING: PricingConfig = {
  packages: [
    {
      id: "copy-paste-go", name: "Copy, Paste, Go", tagline: "The 30-day flagship program — one real project, requirements to production.",
      price: 5000, compareAt: 10000, currency: "PKR", suffix: "one-time", features: programIncludes, badge: "Live now", status: "open",
      ctaLabel: "Enroll now", ctaHref: "/register", featured: true, flagship: true, color: "#e91e63",
    },
    {
      id: "teams", name: "Teams & organisations", tagline: "Node for a whole team — longer journeys and kits built around your stack.",
      price: null, compareAt: null, currency: "PKR", suffix: "", features: ["Dots — My Team for ‘X’ · 1 month", "The NODE · a 3-month journey", "Nano Degree · 6 months", "Custom kits for your stack"],
      badge: "", status: "soon", ctaLabel: "Tell me when it opens", ctaHref: "/register?interest=teams", featured: false, flagship: false, color: "#6d48d8",
    },
  ],
  promotions: [],
};

export const money = (n: number, currency = "PKR") => (n === 0 ? "Free" : `${currency} ${n.toLocaleString("en-US")}`);

export type Offer = {
  pkg: PricePackage;
  final: number | null;
  was: number | null; // struck through
  offPct: number;
  save: number;
  promo: Promotion | null;
};

const live = (p: Promotion, now: number) => p.active && (!p.startsAt || now >= Date.parse(p.startsAt)) && (!p.endsAt || now < Date.parse(p.endsAt));
const cut = (p: Promotion, base: number) => Math.min(base, p.kind === "percent" ? Math.round((base * Math.min(100, Math.max(0, p.value))) / 100) : Math.max(0, p.value));

/* a package's price today: the best running promotion on it, against its full price */
export function offerFor(pkg: PricePackage, promos: Promotion[], now: number): Offer {
  if (pkg.price === null) return { pkg, final: null, was: null, offPct: 0, save: 0, promo: null };
  const base = pkg.price;
  const running = promos.filter((p) => live(p, now) && (!p.packageIds.length || p.packageIds.includes(pkg.id)));
  const promo = running.sort((a, b) => cut(b, base) - cut(a, base))[0] ?? null;
  const final = promo ? base - cut(promo, base) : base;
  const was = pkg.compareAt && pkg.compareAt > final ? pkg.compareAt : promo && final < base ? base : null;
  return { pkg, final, was, offPct: was ? Math.round((1 - final / was) * 100) : 0, save: was ? was - final : 0, promo };
}

export const visiblePackages = (c: PricingConfig) => c.packages.filter((p) => p.status !== "hidden");

/* the flagship's price as words, for the many places that quote it */
export type FlagshipView = { name: string; price: string; was: string; off: string; suffix: string; promo: string; endsAt: string | null };
export function flagshipView(c: PricingConfig, now: number): FlagshipView {
  const pkg = c.packages.find((p) => p.flagship) ?? c.packages[0] ?? DEFAULT_PRICING.packages[0];
  const o = offerFor(pkg, c.promotions, now);
  return {
    name: pkg.name,
    price: o.final === null ? "Soon" : money(o.final, pkg.currency),
    was: o.was ? money(o.was, pkg.currency) : "",
    off: o.offPct ? `${o.offPct}% off` : "",
    suffix: pkg.suffix,
    promo: o.promo?.label ?? "",
    endsAt: o.promo?.endsAt ?? null,
  };
}
