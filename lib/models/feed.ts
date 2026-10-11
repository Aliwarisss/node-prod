import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* The program feed: posts by trainees and mentors (a thought, a win, a call for collaborators) and the updates the
   program shares for them automatically (a day done, a stage cleared, a badge, a level, a perfect score, an answer
   that helped). Anyone can react and comment. `autoKey` keeps each automatic update to one post. */
export const FEED_KINDS = ["post", "collab", "auto"] as const;
export const REACTIONS = ["like", "love", "celebrate", "insight", "funny"] as const;

const feedPostSchema = new Schema(
  {
    kind: { type: String, enum: FEED_KINDS, default: "post", index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, default: "" },
    authorRole: { type: String, default: "student" },
    body: { type: String, default: "" },
    image: { type: new Schema({ id: String, name: String }, { _id: false }), default: null },
    day: { type: Number, default: null },
    /* an automatic update: what happened */
    auto: { type: new Schema({ event: String, icon: String, color: String, title: String, detail: String, link: String }, { _id: false }), default: null },
    autoKey: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
    reactions: { type: [new Schema({ userId: String, emoji: String }, { _id: false })], default: [] },
    joiners: { type: [String], default: [] }, // for a collab: who's in
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
feedPostSchema.index({ authorId: 1, autoKey: 1 }, { unique: true, partialFilterExpression: { autoKey: { $gt: "" } } });
feedPostSchema.index({ pinned: -1, createdAt: -1 });

const feedCommentSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    parentId: { type: String, default: "" }, // a reply to another comment (threads are one level deep)
    reactions: { type: [new Schema({ userId: String, emoji: String }, { _id: false })], default: [] },
    body: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, default: "" },
    authorRole: { type: String, default: "student" },
  },
  { timestamps: true },
);

export type FeedPostDocument = InferSchemaType<typeof feedPostSchema>;
export const FeedPostModel = (models.FeedPost as Model<FeedPostDocument> | undefined) ?? model<FeedPostDocument>("FeedPost", feedPostSchema);
if (models.FeedComment && !models.FeedComment.schema.path("parentId")) mongoose.deleteModel("FeedComment");
export const FeedCommentModel = (models.FeedComment as Model<InferSchemaType<typeof feedCommentSchema>> | undefined) ?? model("FeedComment", feedCommentSchema);
