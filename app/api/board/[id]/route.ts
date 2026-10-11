import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { ReplyModel, ThreadModel } from "@/lib/models/board";
import { REACTIONS } from "@/lib/models/feed";
import { getThread, toReplyView } from "@/lib/program/board";
import { autoPost } from "@/lib/program/feed";
import { allTraineeStats } from "@/lib/program/stats";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* a thread with its replies */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const t = await getThread((await params).id, c.userId);
  return t ? NextResponse.json(t) : NextResponse.json({ error: "Not found." }, { status: 404 });
}

/* reply to it — or to a reply (?parentId); a reply to a reply joins the same thread */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.object({ body: z.string().trim().min(2, "Write a reply first.").max(8000), parentId: z.string().default("") }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reply." }, { status: 400 });
  const thread = await ThreadModel.findById(id, { answerId: 1 }).lean();
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let parentId = "";
  if (parsed.data.parentId) {
    const parent = isValidObjectId(parsed.data.parentId) ? await ReplyModel.findOne({ _id: parsed.data.parentId, threadId: id }, { parentId: 1 }).lean() : null;
    if (!parent) return NextResponse.json({ error: "That reply is gone." }, { status: 404 });
    parentId = parent.parentId || String(parent._id);
  }
  const reply = await ReplyModel.create({ threadId: id, parentId, body: parsed.data.body, authorId: c.userId, authorName: c.name, authorRole: c.isAdmin ? "admin" : "student" });
  await ThreadModel.updateOne({ _id: id }, { $inc: { replyCount: 1 }, $set: { lastActivityAt: new Date() } });
  return NextResponse.json(toReplyView(reply.toObject() as never, c.userId, thread.answerId ?? ""));
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("vote") }),
  z.object({ action: z.literal("accept"), replyId: z.string() }), // "" to un-accept
  z.object({ action: z.literal("pin"), pinned: z.boolean() }),
  z.object({ action: z.literal("vote-reply"), replyId: z.string() }),
  z.object({ action: z.literal("react-reply"), replyId: z.string(), emoji: z.enum(REACTIONS).nullable() }),
]);

/* upvote the thread or a reply; the author (or an admin) accepts an answer; admins pin */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const b = parsed.data;
  const thread = await ThreadModel.findById(id).lean();
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (b.action === "vote") {
    const on = !(thread.upvotes ?? []).includes(c.userId);
    await ThreadModel.updateOne({ _id: id }, on ? { $addToSet: { upvotes: c.userId } } : { $pull: { upvotes: c.userId } });
  } else if (b.action === "vote-reply") {
    if (!isValidObjectId(b.replyId)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const r = await ReplyModel.findOne({ _id: b.replyId, threadId: id }, { upvotes: 1, authorId: 1 }).lean();
    if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (r.authorId === c.userId) return NextResponse.json({ error: "You can’t upvote your own reply." }, { status: 400 });
    const on = !(r.upvotes ?? []).includes(c.userId);
    await ReplyModel.updateOne({ _id: b.replyId }, on ? { $addToSet: { upvotes: c.userId } } : { $pull: { upvotes: c.userId } });
  } else if (b.action === "react-reply") {
    if (!isValidObjectId(b.replyId) || !(await ReplyModel.exists({ _id: b.replyId, threadId: id }))) return NextResponse.json({ error: "That reply is gone." }, { status: 404 });
    await ReplyModel.updateOne({ _id: b.replyId }, { $pull: { reactions: { userId: c.userId } } });
    if (b.emoji) await ReplyModel.updateOne({ _id: b.replyId }, { $push: { reactions: { userId: c.userId, emoji: b.emoji } } });
  } else if (b.action === "accept") {
    if (thread.authorId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "Only the person who asked can accept an answer." }, { status: 403 });
    if (b.replyId && !(await ReplyModel.exists({ _id: b.replyId, threadId: id }))) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await ThreadModel.updateOne({ _id: id }, { $set: { answerId: b.replyId } });
    if (b.replyId) {
      const r = await ReplyModel.findById(b.replyId, { authorId: 1, authorName: 1, authorRole: 1 }).lean();
      if (r && r.authorId !== thread.authorId && r.authorRole !== "admin") await autoPost({ id: r.authorId, name: r.authorName ?? "Trainee" }, `answer:${id}`, { event: "answer", icon: "volunteer_activism", color: "#0f766e", title: `Helped with “${thread.title}”`, detail: `Their answer was accepted on the board.`, link: `/dashboard/board/${id}` });
    }
    void allTraineeStats(true); // an accepted answer is worth XP to whoever wrote it
  } else if (b.action === "pin") {
    if (!c.isAdmin) return NextResponse.json({ error: "Only admins can pin." }, { status: 403 });
    await ThreadModel.updateOne({ _id: id }, { $set: { pinned: b.pinned } });
  }
  const t = await getThread(id, c.userId);
  return NextResponse.json(t);
}

/* remove the thread (its author or an admin), or one reply (?reply=id — its author or an admin) */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const replyId = new URL(request.url).searchParams.get("reply");
  if (replyId) {
    if (!isValidObjectId(replyId)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const r = await ReplyModel.findOne({ _id: replyId, threadId: id }, { authorId: 1 }).lean();
    if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (r.authorId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "You can only remove your own replies." }, { status: 403 });
    /* the reply and any replies to it */
    const gone = await ReplyModel.find({ threadId: id, $or: [{ _id: replyId }, { parentId: replyId }] }, { _id: 1 }).lean();
    await ReplyModel.deleteMany({ _id: { $in: gone.map((x) => x._id) } });
    await ThreadModel.updateOne({ _id: id }, { $inc: { replyCount: -gone.length } });
    await ThreadModel.updateOne({ _id: id, answerId: { $in: gone.map((x) => String(x._id)) } }, { $set: { answerId: "" } });
    return NextResponse.json({ ok: true });
  }
  const t = await ThreadModel.findById(id, { authorId: 1 }).lean();
  if (!t) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (t.authorId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "You can only remove your own threads." }, { status: 403 });
  await Promise.all([ThreadModel.deleteOne({ _id: id }), ReplyModel.deleteMany({ threadId: id })]);
  return NextResponse.json({ ok: true });
}
