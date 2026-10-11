import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { ThreadModel } from "@/lib/models/board";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel, hasAccess } from "@/lib/models/user";
import { FeedAnnounceModel } from "@/lib/models/feed-announce";
import { autoPost } from "@/lib/program/feed";
import { gameOf, type Game } from "@/lib/program/gamification";
import { getProgress } from "@/lib/program/progress";
import { projectById } from "@/lib/program/projects";
import { reactionOf } from "@/lib/program/reactions";
import { standing } from "@/lib/program/ranking";
import { programStats } from "@/lib/program/stats";

export const runtime = "nodejs";

/* share new badges and level milestones on the feed — once each; the very first look just records what they have */
const QUIET = new Set(["kickoff", "first-handin"]); // already covered by the day and hand-in moments
async function announce(uid: string, name: string, g: Game) {
  const earned = g.badges.filter((b) => b.earned && !b.stage).map((b) => `${b.id}:${b.tier}`);
  const doc = await FeedAnnounceModel.findOne({ userId: uid }).lean();
  if (!doc) { await FeedAnnounceModel.updateOne({ userId: uid }, { $setOnInsert: { userId: uid, badges: earned, level: g.level.level } }, { upsert: true }); return; }
  const fresh = g.badges.filter((b) => b.earned && !b.stage && !doc.badges.includes(`${b.id}:${b.tier}`) && !QUIET.has(b.id));
  for (const b of fresh.slice(0, 3)) {
    await autoPost({ id: uid, name }, `badge:${b.id}:${b.tier}`, { event: "badge", icon: b.icon, color: b.color, title: `Earned ${b.name}${b.tiers ? ` · ${["", "Bronze", "Silver", "Gold"][b.tier]}` : ""}`, detail: b.desc, link: "/dashboard/profile" });
  }
  const lv = g.level.level;
  if (lv > (doc.level ?? 0) && (lv % 5 === 0 || g.titles.some((t) => t.kind === "level" && t.id === `level-${lv}`))) {
    await autoPost({ id: uid, name }, `level:${lv}`, { event: "level", icon: "trending_up", color: "#e91e63", title: `Reached level ${lv} — ${g.title}`, detail: `${g.xp.toLocaleString("en-US")} XP so far.`, link: "/dashboard/leaderboard" });
  }
  await FeedAnnounceModel.updateOne({ userId: uid }, { $set: { badges: [...new Set([...doc.badges, ...earned])], level: Math.max(lv, doc.level ?? 0) } });
}

/* the sidebar's counts — for admins, work waiting for review; for trainees, work sent back to fix — and a trainee's
   level, title and badges, so the sidebar can show them and celebrate anything new */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ reviews: 0, fixes: 0, game: null });
  await connectToDatabase();
  const uid = session.user.id;
  const isAdmin = session.user.role === "admin";
  const [user, count, stats, progress, st, decided] = await Promise.all([
    UserModel.findById(uid, { role: 1, paymentStatus: 1 }).lean(),
    SubmissionModel.countDocuments(isAdmin ? { status: "submitted" } : { userId: uid, status: "changes" }),
    isAdmin ? null : programStats(uid).catch(() => null),
    isAdmin ? null : getProgress(uid),
    isAdmin ? null : standing(uid).catch(() => null),
    isAdmin ? [] : SubmissionModel.find({ userId: uid, status: { $in: ["approved", "changes"] } }, { key: 1, artifact: 1, lessonTitle: 1, toRole: 1, "history.kind": 1, "history.comment": 1, "history.grade": 1, "history.at": 1 }).sort({ reviewedAt: -1 }).limit(8).lean(),
  ]);
  if (user?.role === "admin") return NextResponse.json({ reviews: count, fixes: 0, openQuestions: await ThreadModel.countDocuments({ kind: "question", answerId: "" }), game: null });
  const g = stats && user && hasAccess(user) ? gameOf(stats, progress?.prefs, st?.season ?? null) : null;
  if (g) await announce(uid, session.user.name || "Trainee", g);
  /* the client's reactions to recent decisions on their work, newest first */
  const project = projectById(progress?.projectId);
  const reactions = (decided ?? []).flatMap((s) => (s.history ?? []).filter((h) => h.kind === "approved" || h.kind === "changes").map((h) => {
    const at = h.at ? new Date(h.at).toISOString() : "";
    const artifact = s.key === "work" && s.lessonTitle ? `${s.lessonTitle} — your work` : s.artifact;
    const r = reactionOf({ project, role: s.toRole, kind: h.kind as "approved" | "changes", artifact, pct: (h.grade as { pct?: number } | null)?.pct ?? null, comment: h.comment ?? "", seed: `${s.key}|${at}` });
    return { id: `${String(s._id)}|${at}`, at, person: r.person, role: r.role, text: r.text, kind: r.kind, artifact };
  })).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  return NextResponse.json({
    reviews: 0,
    fixes: count,
    game: g ? { uid, xp: g.xp, level: g.level.level, pct: g.level.pct, toNext: g.level.to - g.xp, title: g.title, titleFx: g.titleFx, ring: g.frame.ring, animated: !!g.frame.animated, streak: g.streak, earned: g.badges.filter((b) => b.earned).map((b) => ({ id: `${b.id}:${b.tier}`, name: b.tier && b.tiers ? `${b.name} · ${["", "Bronze", "Silver", "Gold"][b.tier]}` : b.name, icon: b.icon })), reactions } : null,
  });
}
