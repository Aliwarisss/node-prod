import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* What the feed has already shared for a trainee: badge ids (with tier) and the level it last posted. Created the first
   time the program looks — quietly recording what they already have, so only what's new gets posted. */
const feedAnnounceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    badges: { type: [String], default: [] },
    level: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const FeedAnnounceModel = (models.FeedAnnounce as Model<InferSchemaType<typeof feedAnnounceSchema>> | undefined) ?? model("FeedAnnounce", feedAnnounceSchema);
