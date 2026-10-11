/* The program feed, as plain data — and the automatic updates the program shares for a trainee (unless they've
   turned auto-sharing off). Server code. */
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { FeedCommentModel, FeedPostModel, REACTIONS } from "@/lib/models/feed";
import { ProgramProgressModel } from "@/lib/models/program-progress";

export type Reaction = (typeof REACTIONS)[number];
export type FeedAuto = { event: string; icon: string; color: string; title: string; detail: string; link: string };
export type FeedPostView = {
  id: string; kind: "post" | "collab" | "auto"; authorId: string; authorName: string; authorRole: string; body: string;
  image: { id: string; name: string } | null; day: number | null; auto: FeedAuto | null; pinned: boolean;
  reactions: Record<Reaction, number>; mine: Reaction | null; joiners: number; joined: boolean; comments: number; createdAt: string; isMine: boolean;
};
export type FeedCommentView = { id: string; postId: string; parentId: string; body: string; authorId: string; authorName: string; authorRole: string; createdAt: string; isMine: boolean; reactions: Record<Reaction, number>; mine: Reaction | null };
/* reactions as counts, and the viewer's own */
export function tally(list: { userId: string; emoji: string }[] | undefined, viewer: string) {
  const reactions = Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<Reaction, number>;
  for (const r of list ?? []) if (r.emoji in reactions) reactions[r.emoji as Reaction]++;
  return { reactions, mine: ((list ?? []).find((r) => r.userId === viewer)?.emoji as Reaction) ?? null };
}

type RawPost = { _id: unknown; kind?: string; authorId: string; authorName?: string; authorRole?: string; body?: string; image?: { id?: string; name?: string } | null; day?: number | null; auto?: FeedAuto | null; pinned?: boolean; reactions?: { userId: string; emoji: string }[]; joiners?: string[]; commentCount?: number; createdAt?: Date };
type RawComment = { _id: unknown; postId: string; parentId?: string; body: string; authorId: string; authorName?: string; authorRole?: string; reactions?: { userId: string; emoji: string }[]; createdAt?: Date };

export function toPostView(p: RawPost, viewer: string): FeedPostView {
  const reactions = Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<Reaction, number>;
  for (const r of p.reactions ?? []) if (r.emoji in reactions) reactions[r.emoji as Reaction]++;
  return {
    id: String(p._id), kind: (p.kind ?? "post") as FeedPostView["kind"], authorId: p.authorId, authorName: p.authorName || "Trainee", authorRole: p.authorRole ?? "student", body: p.body ?? "",
    image: p.image?.id ? { id: p.image.id, name: p.image.name ?? "image" } : null, day: typeof p.day === "number" ? p.day : null, auto: p.auto ?? null, pinned: !!p.pinned,
    reactions, mine: ((p.reactions ?? []).find((r) => r.userId === viewer)?.emoji as Reaction) ?? null, joiners: p.joiners?.length ?? 0, joined: !!p.joiners?.includes(viewer),
    comments: p.commentCount ?? 0, createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "", isMine: p.authorId === viewer,
  };
}
export const toCommentView = (c: RawComment, viewer: string): FeedCommentView => ({ id: String(c._id), postId: c.postId, parentId: c.parentId ?? "", ...tally(c.reactions, viewer), body: c.body, authorId: c.authorId, authorName: c.authorName || "Trainee", authorRole: c.authorRole ?? "student", createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : "", isMine: c.authorId === viewer });

export type FeedFilter = "all" | "posts" | "updates" | "collab" | "mine";
export const PAGE = 15;
/* a page of the feed — pinned first on the first page, then newest; `before` continues from the last post seen */
export async function listFeed(viewer: string, opts: { filter?: FeedFilter; before?: string; author?: string } = {}): Promise<{ posts: FeedPostView[]; more: boolean }> {
  await connectToDatabase();
  const where: Record<string, unknown> = {};
  if (opts.filter === "posts") where.kind = "post";
  if (opts.filter === "updates") where.kind = "auto";
  if (opts.filter === "collab") where.kind = "collab";
  if (opts.filter === "mine") where.authorId = viewer;
  if (opts.author) where.authorId = opts.author;
  if (opts.before) where.createdAt = { $lt: new Date(opts.before) };
  const rows = await FeedPostModel.find(where).sort(opts.before ? { createdAt: -1 } : { pinned: -1, createdAt: -1 }).limit(PAGE + 1).lean();
  return { posts: rows.slice(0, PAGE).map((r) => toPostView(r as unknown as RawPost, viewer)), more: rows.length > PAGE };
}

export async function commentsOf(postId: string, viewer: string): Promise<FeedCommentView[]> {
  if (!isValidObjectId(postId)) return [];
  await connectToDatabase();
  const rows = await FeedCommentModel.find({ postId }).sort({ createdAt: 1 }).limit(200).lean();
  return rows.map((r) => toCommentView(r as unknown as RawComment, viewer));
}

/* share an update for a trainee — once per `key`, and only if they share automatically */
export async function autoPost(user: { id: string; name: string; role?: string }, key: string, auto: FeedAuto, body = "") {
  try {
    await connectToDatabase();
    const prefs = await ProgramProgressModel.findOne({ userId: user.id }, { shareAuto: 1 }).lean();
    if ((prefs as { shareAuto?: boolean } | null)?.shareAuto === false) return;
    await FeedPostModel.updateOne(
      { authorId: user.id, autoKey: key },
      { $setOnInsert: { kind: "auto", authorId: user.id, authorName: user.name, authorRole: user.role ?? "student", autoKey: key, auto, body } },
      { upsert: true },
    );
  } catch { /* an update that doesn't post never blocks the work itself */ }
}
