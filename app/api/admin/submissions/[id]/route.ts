import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel } from "@/lib/models/user";
import { autoPost } from "@/lib/program/feed";
import { getLens, getTemplate } from "@/lib/program";
import { deliverablesOf } from "@/lib/program/deliverables";
import { gradeOf, rubricOf, type Score } from "@/lib/program/rubrics";
import { lessonOf, toView } from "@/lib/program/submissions";

export const runtime = "nodejs";

const bodySchema = z.object({ decision: z.enum(["approve", "changes"]), comment: z.string().max(4000).default(""), checks: z.array(z.string().max(400)).max(60).default([]), scores: z.record(z.string().regex(/^c[0-9a-z]{1,12}$/), z.union([z.literal(0), z.literal(1), z.literal(2)])).default({}) });

/* Admin, acting as the role the deliverable is reported to: grade it on its rubric, then approve it or send it back.
 * Approving needs a passing grade (no 0s, at least 80%). Sending it back re-opens the trainee's lesson — they rework
 * it and submit again; its scores show what to fix. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { decision, comment, checks, scores } = parsed.data;
  if (decision === "changes" && !comment.trim()) return NextResponse.json({ error: "Say what needs to change." }, { status: 400 });

  await connectToDatabase();
  const sub = await SubmissionModel.findById(id).lean();
  if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (sub.status !== "submitted") return NextResponse.json({ error: "Only submitted work can be reviewed." }, { status: 409 });

  const lesson = lessonOf(sub.day, sub.fid);
  const all = lesson ? deliverablesOf(lesson) : [];
  const d = all.find((x) => x.key === sub.key);
  const rubric = lesson && d ? rubricOf(lesson, d, all, { template: getTemplate, lens: getLens }) : [];
  const g = gradeOf(rubric, scores as Record<string, Score>);
  if (rubric.length && g.scored < g.count) return NextResponse.json({ error: `Score every rubric criterion first (${g.count - g.scored} left).` }, { status: 400 });
  if (decision === "approve" && rubric.length && !g.pass) return NextResponse.json({ error: `It doesn’t pass yet (${g.pct}%${g.zeros ? `, ${g.zeros} at 0` : ""}) — send it back with what to fix.` }, { status: 400 });
  const grade = rubric.length ? { total: g.total, max: g.max, pct: g.pct, pass: g.pass } : null;
  const status = decision === "approve" ? "approved" : "changes";
  const saved = await SubmissionModel.findByIdAndUpdate(
    id,
    { $set: { status, reviewedAt: new Date(), grade }, $push: { history: { kind: status, by: session.user.name || session.user.email || "Admin", role: sub.toRole, comment: comment.trim(), checks, scores, grade, at: new Date() } } },
    { new: true },
  ).lean();
  if (status === "approved" && g.pct === 100 && rubric.length) {
    const who = await UserModel.findById(sub.userId, { name: 1, email: 1 }).lean();
    await autoPost({ id: sub.userId, name: who?.name || who?.email || "Trainee" }, `perfect:d${sub.day}`, { event: "perfect", icon: "workspace_premium", color: "#c49000", title: `Perfect score on ${sub.key === "work" && sub.lessonTitle ? sub.lessonTitle : sub.artifact}`, detail: `Every rubric criterion met — approved by the ${sub.toRole}.`, link: "/dashboard/progress" });
  }
  if (status === "changes") {
    await ProgramProgressModel.updateOne({ userId: sub.userId, "lessons.fid": sub.fid }, { $set: { "lessons.$.done": false, "lessons.$.updatedAt": new Date() } });
  }
  return NextResponse.json(toView(saved as never));
}
