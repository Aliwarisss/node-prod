import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* A trainee's living document — one per template (a log, a register, a canvas, a brief…), built up across steps and
 * lessons and always open in their workspace. Lesson-only work (a decision brief, kick-off notes) is keyed to the lesson.
 * `data` holds the structured content for its format; `text` is the same content as readable Markdown. */
const docSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    ref: { type: String, required: true }, // a template id, or "lesson:<fid>|<key>"
    title: { type: String, default: "" },
    fmt: { type: String, default: "doc" },
    data: { type: Schema.Types.Mixed, default: null },
    text: { type: String, default: "" },
    upload: { type: new Schema({ id: String, name: String, mime: String, size: Number }, { _id: false }), default: null },
  },
  { timestamps: true },
);
docSchema.index({ userId: 1, ref: 1 }, { unique: true });

export type WorkspaceDocDocument = InferSchemaType<typeof docSchema>;
export const WorkspaceDocModel = (models.WorkspaceDoc as Model<WorkspaceDocDocument> | undefined) ?? model<WorkspaceDocDocument>("WorkspaceDoc", docSchema);
