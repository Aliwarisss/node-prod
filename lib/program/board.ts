/* The program board, as plain data — threads and replies for the list and the thread pages. Server code. */
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { ReplyModel, ThreadModel } from "@/lib/models/board";

import { tally, type Reaction } from "./feed";

export type ThreadKind = "question" | "discussion" | "share";
export type ThreadView = {
  id: string; kind: ThreadKind; title: string; body: string; authorId: string; authorName: string; authorRole: string;
  day: number | null; lessonFid: string; lessonTitle: string; pinned: boolean; answered: boolean; answerId: string;
  votes: number; voted: boolean; replies: number; createdAt: string; lastActivityAt: string; mine: boolean;
};
export type ReplyView = { id: string; parentId: string; body: string; authorId: string; authorName: string; authorRole: string; votes: number; voted: boolean; accepted: boolean; createdAt: string; mine: boolean; reactions: Record<Reaction, number>; myReaction: Reaction | null };

type RawThread = { _id: unknown; kind?: string; title: string; body?: string; authorId: string; authorName?: string; authorRole?: string; day?: number | null; lessonFid?: string; lessonTitle?: string; pinned?: boolean; answerId?: string; upvotes?: string[]; replyCount?: number; createdAt?: Date; lastActivityAt?: Date };
type RawReply = { _id: unknown; parentId?: string; body: string; authorId: string; authorName?: string; authorRole?: string; upvotes?: string[]; reactions?: { userId: string; emoji: string }[]; createdAt?: Date };
const iso = (d?: Date) => (d ? new Date(d).toISOString() : "");

export const toThreadView = (t: RawThread, viewer: string): ThreadView => ({
  id: String(t._id), kind: (t.kind ?? "question") as ThreadKind, title: t.title, body: t.body ?? "", authorId: t.authorId, authorName: t.authorName || "Trainee", authorRole: t.authorRole ?? "student",
  day: typeof t.day === "number" ? t.day : null, lessonFid: t.lessonFid ?? "", lessonTitle: t.lessonTitle ?? "", pinned: !!t.pinned, answered: !!t.answerId, answerId: t.answerId ?? "",
  votes: t.upvotes?.length ?? 0, voted: !!t.upvotes?.includes(viewer), replies: t.replyCount ?? 0, createdAt: iso(t.createdAt), lastActivityAt: iso(t.lastActivityAt ?? t.createdAt), mine: t.authorId === viewer,
});
export const toReplyView = (r: RawReply, viewer: string, answerId: string): ReplyView => ({
  id: String(r._id), parentId: r.parentId ?? "", ...(({ reactions, mine }) => ({ reactions, myReaction: mine }))(tally(r.reactions, viewer)), body: r.body, authorId: r.authorId, authorName: r.authorName || "Trainee", authorRole: r.authorRole ?? "student",
  votes: r.upvotes?.length ?? 0, voted: !!r.upvotes?.includes(viewer), accepted: String(r._id) === answerId, createdAt: iso(r.createdAt), mine: r.authorId === viewer,
});

export type BoardFilter = "all" | "unanswered" | "mine" | "question" | "discussion" | "share";
/* threads: pinned first, then the most recently active */
export async function listThreads(viewer: string, opts: { filter?: BoardFilter; day?: number | null; q?: string; limit?: number } = {}): Promise<ThreadView[]> {
  await connectToDatabase();
  const where: Record<string, unknown> = {};
  if (opts.filter === "unanswered") Object.assign(where, { kind: "question", answerId: "" });
  if (opts.filter === "mine") where.authorId = viewer;
  if (opts.filter === "question" || opts.filter === "discussion" || opts.filter === "share") where.kind = opts.filter;
  if (typeof opts.day === "number") where.day = opts.day;
  if (opts.q?.trim()) { const rx = new RegExp(opts.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); where.$or = [{ title: rx }, { body: rx }]; }
  const rows = await ThreadModel.find(where).sort({ pinned: -1, lastActivityAt: -1 }).limit(opts.limit ?? 100).lean();
  return rows.map((r) => toThreadView(r as unknown as RawThread, viewer));
}

export async function getThread(id: string, viewer: string): Promise<{ thread: ThreadView; replies: ReplyView[] } | null> {
  if (!isValidObjectId(id)) return null;
  await connectToDatabase();
  const t = (await ThreadModel.findById(id).lean()) as unknown as RawThread | null;
  if (!t) return null;
  const rows = (await ReplyModel.find({ threadId: id }).sort({ createdAt: 1 }).lean()) as unknown as RawReply[];
  const thread = toThreadView(t, viewer);
  return { thread, replies: rows.map((r) => toReplyView(r, viewer, thread.answerId)) };
}

/* how many threads each day has, and how many questions are waiting for an answer */
export async function boardCounts(): Promise<{ byDay: Record<number, number>; unanswered: number }> {
  await connectToDatabase();
  const [byDay, unanswered] = await Promise.all([
    ThreadModel.aggregate<{ _id: number; n: number }>([{ $match: { day: { $ne: null } } }, { $group: { _id: "$day", n: { $sum: 1 } } }]),
    ThreadModel.countDocuments({ kind: "question", answerId: "" }),
  ]);
  return { byDay: Object.fromEntries(byDay.map((x) => [x._id, x.n])), unanswered };
}
