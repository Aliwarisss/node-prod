import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A person's own map of computer science: what they know, are learning or want to learn (skills and subjects, keyed
   "skill:rust" / "subject:dsa"), and the role they're aiming for. */
const exploreMapSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: { type: Map, of: { type: String, enum: ["know", "learning", "want"] }, default: {} },
    target: { type: String, default: "" }, // a role id
  },
  { timestamps: true },
);

export type ExploreMapDocument = InferSchemaType<typeof exploreMapSchema>;
export const ExploreMapModel = (models.ExploreMap as Model<ExploreMapDocument> | undefined) ?? model<ExploreMapDocument>("ExploreMap", exploreMapSchema);
