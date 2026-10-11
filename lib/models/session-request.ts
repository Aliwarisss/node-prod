import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* Someone would like a live mentor session about a role ("role:ai-engineer"). Admins see the requests, grouped by
   topic, and can open a time poll for it — the people who asked are the first to hear. */
const sessionRequestSchema = new Schema(
  {
    topic: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);
sessionRequestSchema.index({ topic: 1, userId: 1 }, { unique: true });

export type SessionRequestDocument = InferSchemaType<typeof sessionRequestSchema>;
export const SessionRequestModel = (models.SessionRequest as Model<SessionRequestDocument> | undefined) ?? model<SessionRequestDocument>("SessionRequest", sessionRequestSchema);
