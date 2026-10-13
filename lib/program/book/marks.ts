import { BookMarkModel } from "@/lib/models/book-mark";

import { HIGHLIGHT_COLORS, type BookMark, type HighlightColor } from "./mark-types";

export { HIGHLIGHT_COLORS };
export type { BookMark, HighlightColor };

type Doc = { _id: unknown; book: string; lang?: string | null; page: string; kind: string; color?: string | null; quote?: string | null; note?: string | null; block?: number | null; occ?: number | null; updatedAt?: Date | null; createdAt?: Date | null };
export function toMark(d: Doc): BookMark {
  return {
    id: String(d._id),
    book: d.book,
    lang: d.lang === "ur" ? "ur" : "en",
    page: d.page,
    kind: d.kind === "bookmark" ? "bookmark" : "highlight",
    color: (HIGHLIGHT_COLORS as readonly string[]).includes(d.color ?? "") ? (d.color as HighlightColor) : "yellow",
    quote: d.quote ?? "",
    note: d.note ?? "",
    block: d.block ?? -1,
    occ: d.occ ?? 0,
    at: (d.updatedAt ?? d.createdAt ?? new Date()).toISOString(),
  };
}

export async function marksOf(userId: string, book: string): Promise<BookMark[]> {
  const docs = await BookMarkModel.find({ userId, book }).sort({ createdAt: 1 }).lean();
  return docs.map((d) => toMark(d as Doc));
}
