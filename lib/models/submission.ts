import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A deliverable a trainee hands in from a lesson — a snapshot of their workspace document (or a decision brief) submitted
 * to the role that receives it in the workflow (played by an admin), who verifies it and approves it or sends it back.
 * One document per trainee + deliverable; `ticks` are the subtasks they've done on the way. */
export const SUBMISSION_STATUSES = ["draft", "submitted", "changes", "approved"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const eventSchema = new Schema(
  {
    kind: { type: String, enum: ["submitted", "changes", "approved"], required: true },
    by: { type: String, default: "" }, // who acted (trainee name, or the admin)
    role: { type: String, default: "" }, // the role they acted as
    comment: { type: String, default: "" },
    checks: { type: [String], default: [] }, // what the reviewer verified
    scores: { type: Schema.Types.Mixed, default: null }, // the rubric, scored: { criterionId: 0 | 1 | 2 }
    grade: { type: Schema.Types.Mixed, default: null }, // { total, max, pct, pass } at that point
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const submissionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: "" },
    day: { type: Number, required: true },
    fid: { type: String, required: true },
    key: { type: String, required: true },
    kind: { type: String, enum: ["artifact", "decision", "work"], default: "artifact" },
    lessonTitle: { type: String, default: "" },
    artifact: { type: String, required: true },
    template: { type: String, default: "" },
    fmt: { type: String, default: "doc" },
    step: { type: String, default: "" },
    by: { type: String, default: "" }, // the role the trainee plays in the step
    toRole: { type: String, required: true }, // the role it's reported to
    content: { type: String, default: "" }, // the snapshot, as Markdown
    data: { type: Schema.Types.Mixed, default: null }, // the snapshot, structured
    upload: { type: new Schema({ id: String, name: String, mime: String, size: Number }, { _id: false }), default: null },
    ticks: { type: [String], default: [] },
    selfScores: { type: Schema.Types.Mixed, default: {} }, // the trainee's own rubric score: { criterionId: 0 | 1 | 2 }
    grade: { type: Schema.Types.Mixed, default: null }, // the reviewer's latest grade: { total, max, pct, pass }
    status: { type: String, enum: SUBMISSION_STATUSES, default: "draft", index: true },
    version: { type: Number, default: 0 },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    history: { type: [eventSchema], default: [] },
  },
  { timestamps: true },
);
submissionSchema.index({ userId: 1, fid: 1, key: 1 }, { unique: true });

export type SubmissionDocument = InferSchemaType<typeof submissionSchema>;

if (models.Submission && !models.Submission.schema.path("selfScores")) mongoose.deleteModel("Submission");
export const SubmissionModel =
  (models.Submission as Model<SubmissionDocument> | undefined) ?? model<SubmissionDocument>("Submission", submissionSchema);
