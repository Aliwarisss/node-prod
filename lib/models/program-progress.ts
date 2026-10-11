import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A trainee's progress through the 30-day program: their written work and completion per lesson, and finished days */
const lessonSchema = new Schema(
  {
    fid: { type: String, required: true },
    done: { type: Boolean, default: false },
    work: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const progressSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    lessons: { type: [lessonSchema], default: [] },
    completedDays: { type: [Number], default: [] },
    projectId: { type: String, default: "" }, // the practice project they picked on day 0
    /* gamification: how they show up — the title they chose, up to three badges by their name, off the leaderboard */
    title: { type: String, default: "" },
    featured: { type: [String], default: [] },
    hideRank: { type: Boolean, default: false },
    frame: { type: String, default: "" }, // the avatar frame they chose (a reward)
    /* the feed: whether their milestones are shared automatically */
    shareAuto: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ProgressDocument = InferSchemaType<typeof progressSchema>;

if (models.ProgramProgress && !models.ProgramProgress.schema.path("shareAuto")) {
  mongoose.deleteModel("ProgramProgress");
}

export const ProgramProgressModel =
  (models.ProgramProgress as Model<ProgressDocument> | undefined) ??
  model<ProgressDocument>("ProgramProgress", progressSchema);
