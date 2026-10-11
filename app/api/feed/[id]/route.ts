import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { FeedCommentModel, FeedPostModel, REACTIONS } from "@/lib/models/feed";
import { toPostView } from "@/lib/program/feed";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("react"), emoji: z.enum(REACTIONS).nullable() }), // null takes yours back
  z.object({ action: z.literal("join") }), // a collab: I'm in (or out)
  z.object({ action: z.literal("pin"), pinned: z.boolean() }),
]);

/* react to a post, join a collab, or (admins) pin it */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const b = parsed.data;
  const post = await FeedPostModel.findById(id, { joiners: 1, kind: 1 }).lean();
  if (!post) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
  if (b.action === "react") {
    await FeedPostModel.updateOne({ _id: id }, { $pull: { reactions: { userId: c.userId } } });
    if (b.emoji) await FeedPostModel.updateOne({ _id: id }, { $push: { reactions: { userId: c.userId, emoji: b.emoji } } });
  } else if (b.action === "join") {
    if (post.kind !== "collab") return NextResponse.json({ error: "Only collab posts can be joined." }, { status: 400 });
    const on = !(post.joiners ?? []).includes(c.userId);
    await FeedPostModel.updateOne({ _id: id }, on ? { $addToSet: { joiners: c.userId } } : { $pull: { joiners: c.userId } });
  } else {
    if (!c.isAdmin) return NextResponse.json({ error: "Only admins can pin." }, { status: 403 });
    await FeedPostModel.updateOne({ _id: id }, { $set: { pinned: b.pinned } });
  }
  return NextResponse.json(toPostView((await FeedPostModel.findById(id).lean()) as never, c.userId));
}

/* remove a post — its author or an admin */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const post = await FeedPostModel.findById(id, { authorId: 1 }).lean();
  if (!post) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
  if (post.authorId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "You can only remove your own posts." }, { status: 403 });
  await Promise.all([FeedPostModel.deleteOne({ _id: id }), FeedCommentModel.deleteMany({ postId: id })]);
  return NextResponse.json({ ok: true });
}
