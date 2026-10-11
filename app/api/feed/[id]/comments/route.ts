import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { FeedCommentModel, FeedPostModel, REACTIONS } from "@/lib/models/feed";
import { commentsOf, toCommentView } from "@/lib/program/feed";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* a post's comments, with their replies */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  return NextResponse.json(await commentsOf((await params).id, c.userId));
}

/* comment on it — or reply to a comment (?parentId); a reply to a reply joins the same thread */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.object({ body: z.string().trim().min(1, "Write a comment first.").max(2000), parentId: z.string().default("") }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid comment." }, { status: 400 });
  if (!(await FeedPostModel.exists({ _id: id }))) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
  let parentId = "";
  if (parsed.data.parentId) {
    const parent = isValidObjectId(parsed.data.parentId) ? await FeedCommentModel.findOne({ _id: parsed.data.parentId, postId: id }, { parentId: 1 }).lean() : null;
    if (!parent) return NextResponse.json({ error: "That comment is gone." }, { status: 404 });
    parentId = parent.parentId || String(parent._id);
  }
  const doc = await FeedCommentModel.create({ postId: id, parentId, body: parsed.data.body, authorId: c.userId, authorName: c.name, authorRole: c.isAdmin ? "admin" : "student" });
  await FeedPostModel.updateOne({ _id: id }, { $inc: { commentCount: 1 } });
  return NextResponse.json(toCommentView(doc.toObject() as never, c.userId));
}

/* react to a comment (null takes yours back) */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  const parsed = z.object({ commentId: z.string(), emoji: z.enum(REACTIONS).nullable() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !isValidObjectId(parsed.data.commentId)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { commentId, emoji } = parsed.data;
  if (!(await FeedCommentModel.exists({ _id: commentId, postId: id }))) return NextResponse.json({ error: "That comment is gone." }, { status: 404 });
  await FeedCommentModel.updateOne({ _id: commentId }, { $pull: { reactions: { userId: c.userId } } });
  if (emoji) await FeedCommentModel.updateOne({ _id: commentId }, { $push: { reactions: { userId: c.userId, emoji } } });
  return NextResponse.json(toCommentView((await FeedCommentModel.findById(commentId).lean()) as never, c.userId));
}

/* remove a comment (?comment=id), with its replies — its author or an admin */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  const cid = new URL(request.url).searchParams.get("comment") ?? "";
  if (!isValidObjectId(id) || !isValidObjectId(cid)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const cm = await FeedCommentModel.findOne({ _id: cid, postId: id }, { authorId: 1 }).lean();
  if (!cm) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (cm.authorId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "You can only remove your own comments." }, { status: 403 });
  const removed = await FeedCommentModel.deleteMany({ postId: id, $or: [{ _id: cid }, { parentId: cid }] });
  await FeedPostModel.updateOne({ _id: id }, { $inc: { commentCount: -removed.deletedCount } });
  return NextResponse.json({ ok: true, removed: removed.deletedCount });
}
