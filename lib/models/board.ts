import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* The program's board: threads (a question, a discussion, something to share) and their replies. A thread can be tied
   to a day or a lesson; a question is answered when its author (or an admin) accepts a reply. Admins can pin. */
export const THREAD_KINDS = ["question", "discussion", "share"] as const;

const threadSchema = new Schema(
  {
    kind: { type: String, enum: THREAD_KINDS, default: "question", index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, default: "" },
    authorRole: { type: String, default: "student" },
    day: { type: Number, default: null, index: true },
    lessonFid: { type: String, default: "" },
    lessonTitle: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    answerId: { type: String, default: "" }, // the accepted reply
    upvotes: { type: [String], default: [] },
    replyCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

const replySchema = new Schema(
  {
    threadId: { type: String, required: true, index: true },
    parentId: { type: String, default: "" }, // a reply to another reply (threads are one level deep)
    reactions: { type: [new Schema({ userId: String, emoji: String }, { _id: false })], default: [] },
    body: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, default: "" },
    authorRole: { type: String, default: "student" },
    upvotes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type ThreadDocument = InferSchemaType<typeof threadSchema>;
export type ReplyDocument = InferSchemaType<typeof replySchema>;
export const ThreadModel = (models.BoardThread as Model<ThreadDocument> | undefined) ?? model<ThreadDocument>("BoardThread", threadSchema);
if (models.BoardReply && !models.BoardReply.schema.path("parentId")) mongoose.deleteModel("BoardReply");
export const ReplyModel = (models.BoardReply as Model<ReplyDocument> | undefined) ?? model<ReplyDocument>("BoardReply", replySchema);
