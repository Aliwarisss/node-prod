import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { BookMarkModel } from "@/lib/models/book-mark";
import { HIGHLIGHT_COLORS, toMark } from "@/lib/program/book/marks";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const patchSchema = z.object({
  note: z.string().trim().max(4000, "Keep the note under 4,000 characters.").optional(),
  color: z.enum(HIGHLIGHT_COLORS).optional(),
});

/* change a highlight's note or colour */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid change." }, { status: 400 });
  const doc = await BookMarkModel.findOneAndUpdate({ _id: id, userId: c.userId, kind: "highlight" }, { $set: parsed.data }, { new: true }).lean();
  return doc ? NextResponse.json({ mark: toMark(doc) }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}

/* remove a highlight, a note or a bookmark */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const r = await BookMarkModel.deleteOne({ _id: id, userId: c.userId });
  return r.deletedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
