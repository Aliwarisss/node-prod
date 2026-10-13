import { NextResponse } from "next/server";
import { z } from "zod";

import { BookMarkModel } from "@/lib/models/book-mark";
import { HIGHLIGHT_COLORS, marksOf, toMark } from "@/lib/program/book/marks";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const LIMIT = 3000; // per reader, per book

/* your highlights, notes and bookmarks in a book */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const book = new URL(request.url).searchParams.get("book") ?? "";
  if (!book) return NextResponse.json({ error: "Which book?" }, { status: 400 });
  return NextResponse.json({ marks: await marksOf(c.userId, book) });
}

const createSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("highlight"),
    book: z.string().min(1).max(60),
    lang: z.enum(["en", "ur"]).default("en"),
    page: z.string().min(1).max(160),
    color: z.enum(HIGHLIGHT_COLORS).default("yellow"),
    quote: z.string().trim().min(1, "Select some text first.").max(2000, "That selection is too long to keep."),
    note: z.string().trim().max(4000, "Keep the note under 4,000 characters.").default(""),
    block: z.number().int().min(0).max(10000),
    occ: z.number().int().min(0).max(1000).default(0),
  }),
  z.object({
    kind: z.literal("bookmark"),
    book: z.string().min(1).max(60),
    lang: z.enum(["en", "ur"]).default("en"),
    page: z.string().min(1).max(160),
  }),
]);

/* keep a highlight (with or without a note) or bookmark a page — bookmarking a page twice returns the one you have */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid mark." }, { status: 400 });
  const m = parsed.data;
  if (m.kind === "bookmark") {
    const have = await BookMarkModel.findOne({ userId: c.userId, book: m.book, page: m.page, kind: "bookmark" }).lean();
    if (have) return NextResponse.json({ mark: toMark(have) });
  }
  if ((await BookMarkModel.countDocuments({ userId: c.userId, book: m.book })) >= LIMIT) {
    return NextResponse.json({ error: "You’ve kept a lot in this book — remove some old marks first." }, { status: 409 });
  }
  const doc = await BookMarkModel.create({ ...m, userId: c.userId });
  return NextResponse.json({ mark: toMark(doc.toObject()) }, { status: 201 });
}
