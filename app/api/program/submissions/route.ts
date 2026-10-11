import { NextResponse } from "next/server";
import { z } from "zod";

import { SubmissionModel } from "@/lib/models/submission";
import { WorkspaceDocModel } from "@/lib/models/workspace-doc";
import { getLens, getTemplate } from "@/lib/program";
import { deliverablesOf } from "@/lib/program/deliverables";
import { loadProgress, isDayOpen } from "@/lib/program/progress";
import { gradeOf, rubricOf } from "@/lib/program/rubrics";
import { getSubmissions, lessonOf, toView } from "@/lib/program/submissions";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submit"), day: z.number().int().min(0).max(30), fid: z.string().min(3), key: z.string().min(1) }),
  z.object({ action: z.literal("tick"), day: z.number().int().min(0).max(30), fid: z.string().min(3), key: z.string().min(1), item: z.string().min(1).max(300), on: z.boolean() }),
  z.object({ action: z.literal("score"), day: z.number().int().min(0).max(30), fid: z.string().min(3), key: z.string().min(1), criterion: z.string().regex(/^c[0-9a-z]{1,12}$/), score: z.union([z.literal(0), z.literal(1), z.literal(2), z.null()]) }),
]);

/* a trainee's deliverables for a day */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const day = Number(new URL(request.url).searchParams.get("day"));
  if (!Number.isInteger(day)) return NextResponse.json({ error: "Which day?" }, { status: 400 });
  return NextResponse.json(await getSubmissions(c.userId, day));
}

/* tick a subtask on the way, self-score the rubric, or submit the deliverable — a snapshot of its workspace document — to its role */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;

  const progress = await loadProgress(c.userId);
  if (!isDayOpen(body.day, progress.completedDays, c.isAdmin)) return NextResponse.json({ error: "Finish the previous day first." }, { status: 403 });
  const lesson = lessonOf(body.day, body.fid);
  if (!lesson) return NextResponse.json({ error: "That lesson isn’t part of this day." }, { status: 400 });
  const all = deliverablesOf(lesson);
  const d = all.find((x) => x.key === body.key);
  if (!d) return NextResponse.json({ error: "That deliverable isn’t part of this lesson." }, { status: 400 });

  const existing = await SubmissionModel.findOne({ userId: c.userId, fid: body.fid, key: body.key }).lean();
  const base = { projectId: progress.projectId, day: body.day, kind: d.kind, lessonTitle: lesson.title, artifact: d.artifact, template: d.template ?? "", step: d.step, by: d.by, toRole: d.to };

  if (body.action === "tick") {
    const update = body.on ? { $addToSet: { ticks: body.item } } : { $pull: { ticks: body.item } };
    const saved = await SubmissionModel.findOneAndUpdate({ userId: c.userId, fid: body.fid, key: body.key }, { ...update, $setOnInsert: { ...base, status: "draft" } }, { upsert: true, new: true }).lean();
    return NextResponse.json(toView(saved as never));
  }

  const locked = existing && (existing.status === "submitted" || existing.status === "approved");
  const rubric = rubricOf(lesson, d, all, { template: getTemplate, lens: getLens });

  if (body.action === "score") {
    if (locked) return NextResponse.json({ error: "It’s with the reviewer — scores are locked." }, { status: 409 });
    if (!rubric.some((c) => c.id === body.criterion)) return NextResponse.json({ error: "That criterion isn’t on this rubric." }, { status: 400 });
    const update = body.score === null ? { $unset: { [`selfScores.${body.criterion}`]: "" } } : { $set: { [`selfScores.${body.criterion}`]: body.score } };
    const saved = await SubmissionModel.findOneAndUpdate({ userId: c.userId, fid: body.fid, key: body.key }, { ...update, $setOnInsert: { ...base, status: "draft" } }, { upsert: true, new: true }).lean();
    return NextResponse.json(toView(saved as never));
  }

  if (locked && existing) {
    return NextResponse.json({ error: existing.status === "approved" ? "Already approved." : `Waiting for the ${existing.toRole}’s review.` }, { status: 409 });
  }
  const doc = await WorkspaceDocModel.findOne({ userId: c.userId, ref: d.ref }).lean();
  if (!doc || ((doc.text ?? "").trim().length < 20 && !doc.upload?.id)) return NextResponse.json({ error: "Write (or attach) the work before you submit it." }, { status: 400 });

  /* the book's rule: score it yourself against the rubric first — every criterion, and no 0s */
  const self = gradeOf(rubric, (existing?.selfScores ?? {}) as never);
  if (self.scored < self.count) return NextResponse.json({ error: `Score yourself on every rubric criterion first (${self.count - self.scored} left).` }, { status: 400 });
  if (self.zeros) return NextResponse.json({ error: `Fix what you scored 0 before you submit (${self.zeros}).` }, { status: 400 });

  const saved = await SubmissionModel.findOneAndUpdate(
    { userId: c.userId, fid: body.fid, key: body.key },
    {
      $set: { ...base, fmt: doc.fmt ?? "doc", content: doc.text ?? "", data: doc.data ?? null, upload: doc.upload ?? null, status: "submitted", submittedAt: new Date() },
      $inc: { version: 1 },
      $push: { history: { kind: "submitted", by: c.name, role: d.by, comment: "", checks: [], scores: existing?.selfScores ?? {}, grade: { total: self.total, max: self.max, pct: self.pct, pass: self.pass }, at: new Date() } },
    },
    { upsert: true, new: true },
  ).lean();
  return NextResponse.json(toView(saved as never));
}
