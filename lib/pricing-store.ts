import { unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/mongodb";
import { PricingConfigModel } from "@/lib/models/pricing-config";
import { DEFAULT_PRICING, flagshipView, type PricingConfig } from "@/lib/pricing";

/* Pricing from the database, through the cache (it's read by the root layout and the home page); the admin's save
 * clears the tag. Until an admin first saves, the defaults in lib/pricing.ts are the prices. */
export const PRICING_TAG = "pricing";
const KEY = "pricing";

export async function readPricing(): Promise<PricingConfig> {
  await connectToDatabase();
  const doc = await PricingConfigModel.findOne({ key: KEY }).lean();
  if (!doc) return DEFAULT_PRICING;
  return { packages: doc.packages ?? [], promotions: doc.promotions ?? [] };
}

export async function writePricing(c: PricingConfig, by: string) {
  await connectToDatabase();
  await PricingConfigModel.updateOne({ key: KEY }, { $set: { packages: c.packages, promotions: c.promotions, updatedBy: by }, $setOnInsert: { key: KEY } }, { upsert: true });
}

const cached = unstable_cache(readPricing, [KEY], { tags: [PRICING_TAG], revalidate: 300 });

/* never lets a database hiccup take a page down: the defaults stand in */
export async function getPricing(): Promise<PricingConfig> {
  try {
    return await cached();
  } catch {
    return DEFAULT_PRICING;
  }
}

/* the pricing as of this render, and the flagship's price in words */
export async function loadPricingView() {
  const config = await getPricing();
  const now = Date.now();
  return { config, now, flagship: flagshipView(config, now) };
}
