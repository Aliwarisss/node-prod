import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* Links people add to the vlog. Each one sits at a slot:
 *   clip:<videoId>:<start>  — a curated clip, which the link offers an alternate (or a translation) for,
 *   sub:<sectionId>         — a subtopic that has no clip yet, which the link fills,
 * or after a piece (anchor = the piece's key) as an addition. Videos are YouTube links with a start and an end. */
const vlogLinkSchema = new Schema(
  {
    book: { type: String, required: true, index: true },
    slot: { type: String, default: "" },
    anchor: { type: String, default: "" },
    category: { type: String, enum: ["alternate", "translation", "addition"], required: true },
    lang: { type: String, default: "en" },
    kind: { type: String, enum: ["video", "article", "other"], required: true },
    url: { type: String, required: true },
    videoId: { type: String, default: "" },
    start: { type: Number, default: 0 },
    end: { type: Number, default: 0 },
    title: { type: String, required: true },
    note: { type: String, default: "" },
    channel: { type: String, default: "" },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: "" },
  },
  { timestamps: true },
);
export type VlogLinkDocument = InferSchemaType<typeof vlogLinkSchema>;
export const VlogLinkModel = (models.VlogLink as Model<VlogLinkDocument> | undefined) ?? model<VlogLinkDocument>("VlogLink", vlogLinkSchema);

/* one vote per person per target: a link's id, or curated:<slot> for the clip we chose */
const vlogVoteSchema = new Schema(
  {
    book: { type: String, required: true },
    target: { type: String, required: true },
    userId: { type: String, required: true },
    v: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true },
);
vlogVoteSchema.index({ book: 1, target: 1, userId: 1 }, { unique: true });
export type VlogVoteDocument = InferSchemaType<typeof vlogVoteSchema>;
export const VlogVoteModel = (models.VlogVote as Model<VlogVoteDocument> | undefined) ?? model<VlogVoteDocument>("VlogVote", vlogVoteSchema);
