import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { VlogLinkModel, VlogVoteModel } from "@/lib/models/vlog";
import { communityFor } from "@/lib/program/book/community-store";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* vote on a link (its id) or on the curated clip of a slot (curated:<slot>); v 0 takes my vote back */
export async function POST(request: Request, { params }: { params: Promise<{ book: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { book } = await params;
  const parsed = z.object({ target: z.string().min(1).max(240), v: z.union([z.literal(1), z.literal(-1), z.literal(0)]) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  const { target, v } = parsed.data;
  if (target.startsWith("curated:")) {
    if (!/^curated:(clip:[\w-]{11}:\d+|sub:[\w.-]+)$/.test(target)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  } else {
    if (!isValidObjectId(target)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const link = await VlogLinkModel.findOne({ _id: target, book }, { userId: 1 }).lean();
    if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (link.userId === c.userId) return NextResponse.json({ error: "You can't vote on your own link." }, { status: 400 });
  }
  if (v === 0) await VlogVoteModel.deleteOne({ book, target, userId: c.userId });
  else await VlogVoteModel.updateOne({ book, target, userId: c.userId }, { $set: { v } }, { upsert: true });
  return NextResponse.json(await communityFor(book, c.userId));
}
