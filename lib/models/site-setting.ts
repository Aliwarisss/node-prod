import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* Site-wide switches, one document per key (e.g. "dev-banner") — set from the admin panel */
const siteSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    message: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SiteSettingDocument = InferSchemaType<typeof siteSettingSchema>;
export const SiteSettingModel = (models.SiteSetting as Model<SiteSettingDocument> | undefined) ?? model<SiteSettingDocument>("SiteSetting", siteSettingSchema);
