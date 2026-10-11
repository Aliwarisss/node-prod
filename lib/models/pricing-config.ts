import { Schema, model, models, type Model } from "mongoose";

import type { PricePackage, Promotion } from "@/lib/pricing";

/* The pricing (packages and promotions) as one document — validated by the admin API before it's written */
const pricingConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    packages: { type: [Schema.Types.Mixed], default: [] },
    promotions: { type: [Schema.Types.Mixed], default: [] },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type PricingConfigDocument = { key: string; packages: PricePackage[]; promotions: Promotion[]; updatedBy: string };
export const PricingConfigModel = (models.PricingConfig as Model<PricingConfigDocument> | undefined) ?? model<PricingConfigDocument>("PricingConfig", pricingConfigSchema);
