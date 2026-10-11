import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";
import { UserModel, hasAccess } from "@/lib/models/user";
import { daySummaries, getDay, lessonIdsOf } from "@/lib/program";
import { loadProgress, isDayOpen } from "@/lib/program/progress";
import { SubmissionModel } from "@/lib/models/submission";
import { autoPost } from "@/lib/program/feed";
import { deliverablesOf } from "@/lib/program/deliverables";
import { HANDED_IN, lessonOf } from "@/lib/program/submissions";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("work"), day: z.number().int().min(0).max(30), fid: z.string().min(3), work: z.string().max(20000) }),
  z.object({ action: z.literal("lesson"), day: z.number().int().min(0).max(30), fid: z.string().min(3), done: z.boolean() }),
  z.object({ action: z.literal("day"), day: z.number().int().min(0).max(30) }),
]);

async function context() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  await connectToDatabase();
  const user = await UserModel.findById(session.user.id, { role: 1, paymentStatus: 1, name: 1, email: 1 }).lean();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  /* fees are cash on delivery: nothing in the program until the fee is received */
  if (!hasAccess(user)) return { error: NextResponse.json({ error: "Your program unlocks once your fee is confirmed." }, { status: 402 }) };
  return { userId: session.user.id, isAdmin: user.role === "admin", name: user.name || user.email || "Trainee" };
}

export async function GET() {
  const c = await context();
  if ("error" in c) return c.error;
  return NextResponse.json(await loadProgress(c.userId));
}

/* save written work, tick a lesson, or complete a day (only when every lesson in it is done) */
export async function POST(request: Request) {
  const c = await context();
  if ("error" in c) return c.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;

  const day = getDay(body.day);
  if (!day) return NextResponse.json({ error: "No such day." }, { status: 404 });
  const progress = await loadProgress(c.userId);
  if (!isDayOpen(body.day, progress.completedDays, c.isAdmin)) {
    return NextResponse.json({ error: "Finish the previous day first." }, { status: 403 });
  }

  const ids = lessonIdsOf(day);
  if (body.action !== "day" && !ids.includes(body.fid)) {
    return NextResponse.json({ error: "That lesson isn’t part of this day." }, { status: 400 });
  }

  /* a lesson is complete only once every deliverable in it has been handed in to the role it reports to */
  if (body.action === "lesson" && body.done) {
    const lesson = lessonOf(body.day, body.fid);
    const keys = lesson ? deliverablesOf(lesson).map((d) => d.key) : [];
    const handed = await SubmissionModel.countDocuments({ userId: c.userId, fid: body.fid, key: { $in: keys }, status: { $in: HANDED_IN } });
    if (handed < keys.length) {
      return NextResponse.json({ error: `Submit every deliverable first (${keys.length - handed} left).` }, { status: 409 });
    }
  }

  await ProgramProgressModel.updateOne({ userId: c.userId }, { $setOnInsert: { userId: c.userId, lessons: [], completedDays: [] } }, { upsert: true });

  if (body.action === "work" || body.action === "lesson") {
    const set = body.action === "work" ? { "lessons.$.work": body.work, "lessons.$.updatedAt": new Date() } : { "lessons.$.done": body.done, "lessons.$.updatedAt": new Date() };
    const res = await ProgramProgressModel.updateOne({ userId: c.userId, "lessons.fid": body.fid }, { $set: set });
    if (res.matchedCount === 0) {
      await ProgramProgressModel.updateOne(
        { userId: c.userId },
        { $push: { lessons: { fid: body.fid, done: body.action === "lesson" ? body.done : false, work: body.action === "work" ? body.work : "", updatedAt: new Date() } } },
      );
    }
    /* un-ticking a lesson re-opens its day */
    if (body.action === "lesson" && !body.done) {
      await ProgramProgressModel.updateOne({ userId: c.userId }, { $pull: { completedDays: body.day } });
    }
  } else {
    const missing = ids.filter((id) => !progress.lessons[id]?.done);
    if (missing.length) {
      return NextResponse.json({ error: `Finish every lesson first (${missing.length} left).` }, { status: 409 });
    }
    const fresh = !progress.completedDays.includes(body.day);
    await ProgramProgressModel.updateOne({ userId: c.userId }, { $addToSet: { completedDays: body.day } });
    /* share it on the feed (once, and only if they share automatically) */
    if (fresh && !c.isAdmin) {
      const who = { id: c.userId, name: c.name };
      await autoPost(who, `day:${body.day}`, { event: "day", icon: "event_available", color: "#007373", title: `Completed Day ${body.day} · ${day.title}`, detail: day.kind === "act" ? `Stage ${day.act.n} · ${day.act.name}` : day.act.name, link: `/dashboard/roadmap/day/${body.day}` });
      const stageDays = daySummaries().filter((d) => d.act.id === day.act.id).map((d) => d.day);
      const done = new Set([...progress.completedDays, body.day]);
      if (day.act.id !== "kickoff" && stageDays.every((d) => done.has(d))) {
        await autoPost(who, `stage:${day.act.id}`, { event: "stage", icon: "military_tech", color: "#6d48d8", title: `Cleared Stage ${day.act.n} · ${day.act.name}`, detail: `All ${stageDays.length} days of ${day.act.name} — the ${day.act.gate} is behind them.`, link: "/dashboard/progress" });
      }
    }
  }

  return NextResponse.json(await loadProgress(c.userId));
}
