import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A practice rep: one short drill a trainee ran on a skill of the rubric (lenses, evidence, traceability…) and how many
   they got right. Reps fill in their skill tree's practice track and earn a little XP. */
const practiceRepSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    skill: { type: String, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    xp: { type: Number, default: 0 }, // what it earned (none after the day's first three reps)
  },
  { timestamps: true },
);

export type PracticeRepDocument = InferSchemaType<typeof practiceRepSchema>;
export const PracticeRepModel = (models.PracticeRep as Model<PracticeRepDocument> | undefined) ?? model<PracticeRepDocument>("PracticeRep", practiceRepSchema);
