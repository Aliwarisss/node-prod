import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { FeedPostModel } from "@/lib/models/feed";
import { UploadModel } from "@/lib/models/upload";
import { TOTAL_DAYS } from "@/lib/program";
import { listFeed, toPostView, type FeedFilter } from "@/lib/program/feed";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* a page of the feed (?filter, ?before=<iso> for the next page) */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const q = new URL(request.url).searchParams;
  return NextResponse.json(await listFeed(c.userId, { filter: (q.get("filter") ?? "all") as FeedFilter, before: q.get("before") ?? undefined }));
}

const bodySchema = z.object({
  kind: z.enum(["post", "collab"]).default("post"),
  body: z.string().trim().max(5000).default(""),
  imageId: z.string().default(""),
  day: z.number().int().min(0).max(TOTAL_DAYS).nullable().default(null),
});

/* post something — a thought, a win, a question for the cohort, or a call for collaborators */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post." }, { status: 400 });
  const b = parsed.data;
  let image: { id: string; name: string } | null = null;
  if (b.imageId) {
    const f = isValidObjectId(b.imageId) ? await UploadModel.findOne({ _id: b.imageId, userId: c.userId, public: true }, { name: 1 }).lean() : null;
    if (!f) return NextResponse.json({ error: "That image didn’t upload — attach it again." }, { status: 400 });
    image = { id: b.imageId, name: f.name };
  }
  if (!b.body && !image) return NextResponse.json({ error: "Write something (or add a picture) first." }, { status: 400 });
  const doc = await FeedPostModel.create({ kind: b.kind, body: b.body, image, day: b.day, authorId: c.userId, authorName: c.name, authorRole: c.isAdmin ? "admin" : "student", joiners: b.kind === "collab" ? [c.userId] : [] });
  return NextResponse.json(toPostView(doc.toObject() as never, c.userId));
}
