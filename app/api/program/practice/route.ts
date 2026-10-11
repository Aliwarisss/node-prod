import { NextResponse } from "next/server";
import { z } from "zod";

import { PracticeRepModel } from "@/lib/models/practice-rep";
import { makeRep, REP_XP_PER_CORRECT, REPS_WITH_XP_PER_DAY } from "@/lib/program/practice";
import { currentDay, loadProgress } from "@/lib/program/progress";
import { allTraineeStats } from "@/lib/program/stats";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* a practice rep on a skill: five questions (without their answers) and the seed that made them */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const skill = new URL(request.url).searchParams.get("skill") ?? "";
  const day = currentDay((await loadProgress(c.userId)).completedDays);
  const seed = Math.floor(Math.random() * 2 ** 31);
  const qs = makeRep(skill, day, seed);
  if (!qs.length) return NextResponse.json({ error: "No practice for that skill yet." }, { status: 404 });
  return NextResponse.json({ skill, seed, day, questions: qs.map((q) => ({ q: q.q, options: q.options })) });
}

const bodySchema = z.object({ skill: z.string().min(1).max(40), seed: z.number().int().min(0), day: z.number().int().min(0).max(30), answers: z.array(z.number().int().min(-1).max(3)).max(10) });

/* hand in the answers: the server rebuilds the rep from its seed, scores it and records it (XP for the day's first three) */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { skill, seed, day, answers } = parsed.data;
  const reached = currentDay((await loadProgress(c.userId)).completedDays);
  if (day > Math.max(5, reached)) return NextResponse.json({ error: "That rep isn’t yours." }, { status: 400 });
  const qs = makeRep(skill, day, seed);
  if (!qs.length || answers.length !== qs.length) return NextResponse.json({ error: "That rep doesn’t match." }, { status: 400 });
  const correct = qs.filter((q, i) => answers[i] === q.answer).length;
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const today = await PracticeRepModel.countDocuments({ userId: c.userId, xp: { $gt: 0 }, createdAt: { $gte: since } });
  const xp = today < REPS_WITH_XP_PER_DAY ? correct * REP_XP_PER_CORRECT : 0;
  await PracticeRepModel.create({ userId: c.userId, skill, correct, total: qs.length, xp });
  void allTraineeStats(true);
  return NextResponse.json({ correct, total: qs.length, xp, repsLeftWithXp: Math.max(0, REPS_WITH_XP_PER_DAY - today - (xp ? 1 : 0)), results: qs.map((q, i) => ({ answer: q.answer, chosen: answers[i], why: q.why })) });
}
