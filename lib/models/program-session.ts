import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A live session for a day of the program — set by an admin: when it starts, how long, where to join, and (after) the
   recording. A day can have more than one (a kick-off call, office hours). */
const programSessionSchema = new Schema(
  {
    day: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    durationMin: { type: Number, default: 60 },
    link: { type: String, default: "" }, // the meeting link (Zoom, Meet, Teams…)
    host: { type: String, default: "" },
    notes: { type: String, default: "" }, // what to prepare, the agenda
    recordingUrl: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ProgramSessionDocument = InferSchemaType<typeof programSessionSchema>;
export const ProgramSessionModel = (models.ProgramSession as Model<ProgramSessionDocument> | undefined) ?? model<ProgramSessionDocument>("ProgramSession", programSessionSchema);
