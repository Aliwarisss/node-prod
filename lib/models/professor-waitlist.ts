import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* People waiting for the Professor (Node's coming advisor agent) — anyone, signed in or not, by email */
const professorWaitlistSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ProfessorWaitlistDocument = InferSchemaType<typeof professorWaitlistSchema>;
export const ProfessorWaitlistModel = (models.ProfessorWaitlist as Model<ProfessorWaitlistDocument> | undefined) ?? model<ProfessorWaitlistDocument>("ProfessorWaitlist", professorWaitlistSchema);
