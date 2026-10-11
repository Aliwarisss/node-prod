import { NextResponse } from "next/server";
import { z } from "zod";

import { ProgramProgressModel } from "@/lib/models/program-progress";
import { gameOf } from "@/lib/program/gamification";
import { loadProgress } from "@/lib/program/progress";
import { standing } from "@/lib/program/ranking";
import { allTraineeStats, programStats } from "@/lib/program/stats";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const bodySchema = z.object({
  title: z.string().max(60).optional(), // a title id they've earned ("" = the one their level gives)
  featured: z.array(z.string().max(60)).max(3).optional(), // up to three badges by their name
  hideRank: z.boolean().optional(),
  frame: z.string().max(40).optional(), // an avatar frame they've unlocked
});

/* how a trainee shows up: the title they wear, the badges by their name, and whether they're on the leaderboard */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;
  /* only what they've actually earned */
  const season = (await standing(c.userId)).season;
  const game = gameOf(await programStats(c.userId), (await loadProgress(c.userId)).prefs, season);
  if (body.title && !game.titles.some((t) => t.id === body.title && t.earned)) return NextResponse.json({ error: "Earn that title first." }, { status: 400 });
  if (body.frame && !game.frames.some((f) => f.id === body.frame && f.unlocked)) return NextResponse.json({ error: "Unlock that frame first." }, { status: 400 });
  if (body.featured && body.featured.some((id) => !game.badges.some((b) => b.id === id && b.earned))) return NextResponse.json({ error: "You can only feature badges you’ve earned." }, { status: 400 });
  const set: Record<string, unknown> = {};
  if (body.title !== undefined) set.title = body.title;
  if (body.featured !== undefined) set.featured = body.featured;
  if (body.hideRank !== undefined) set.hideRank = body.hideRank;
  if (body.frame !== undefined) set.frame = body.frame;
  await ProgramProgressModel.updateOne({ userId: c.userId }, { $set: set }, { upsert: true });
  await allTraineeStats(true); // the leaderboard sees it straight away
  const next = gameOf(await programStats(c.userId), (await loadProgress(c.userId)).prefs, season);
  return NextResponse.json({ title: next.title, featured: next.featured.map((b) => b.id), hideRank: next.hideRank, frame: next.frame.id });
}
