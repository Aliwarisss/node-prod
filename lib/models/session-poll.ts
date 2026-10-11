import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A time poll for a live session — an admin offers a few times, trainees tick every one that suits them, and the
   admin turns the winning time into the day's session. */
const sessionPollSchema = new Schema(
  {
    day: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    host: { type: String, default: "" }, // the mentor
    durationMin: { type: Number, default: 60 },
    note: { type: String, default: "" },
    topic: { type: String, default: "", index: true }, // what it's about, e.g. "role:ai-engineer" (from Explore's session requests)
    slots: { type: [{ startsAt: { type: Date, required: true } }], default: [] },
    /* one entry per voter: their availability — the slots that work (slotIds), the ones that work if needed
       (maybeIds), or none at all (none) */
    votes: { type: [{ userId: String, name: String, slotIds: [String], maybeIds: { type: [String], default: [] }, none: { type: Boolean, default: false }, at: Date, _id: false }], default: [] },
    status: { type: String, enum: ["open", "closed", "scheduled"], default: "open", index: true },
    closesAt: { type: Date, default: null },
    chosenSlotId: { type: String, default: "" },
    sessionId: { type: String, default: "" }, // the session made from the winning time
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SessionPollDocument = InferSchemaType<typeof sessionPollSchema>;
if (models.SessionPoll && (!models.SessionPoll.schema.path("topic") || !models.SessionPoll.schema.path("votes.maybeIds"))) mongoose.deleteModel("SessionPoll");
export const SessionPollModel = (models.SessionPoll as Model<SessionPollDocument> | undefined) ?? model<SessionPollDocument>("SessionPoll", sessionPollSchema);
