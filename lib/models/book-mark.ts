import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/* What a reader keeps from a book: a highlight (a quote from one block, optionally with a note) or a bookmark (a whole
   page). A highlight is anchored by its page, the block it sits in, the quoted text and which occurrence of that text
   in the block it is — so it survives re-renders, and simply stops showing if the text it quoted is rewritten. */
const bookMarkSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    book: { type: String, required: true },
    lang: { type: String, enum: ["en", "ur"], default: "en" },
    page: { type: String, required: true }, // a section id, or ch-<chapter id> for a chapter's opening
    kind: { type: String, enum: ["highlight", "bookmark"], required: true },
    color: { type: String, default: "yellow" },
    quote: { type: String, default: "" },
    note: { type: String, default: "" },
    block: { type: Number, default: -1 },
    occ: { type: Number, default: 0 },
  },
  { timestamps: true },
);
bookMarkSchema.index({ userId: 1, book: 1 });

export type BookMarkDocument = InferSchemaType<typeof bookMarkSchema>;
export const BookMarkModel = (models.BookMark as Model<BookMarkDocument> | undefined) ?? model<BookMarkDocument>("BookMark", bookMarkSchema);
