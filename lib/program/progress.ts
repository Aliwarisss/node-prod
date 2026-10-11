import { cache } from "react";

import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";

export type LessonState = { done: boolean; work: string; updatedAt: string | null };
export type Prefs = { title: string; featured: string[]; hideRank: boolean; frame?: string };
export type Progress = { lessons: Record<string, LessonState>; completedDays: number[]; projectId: string; startedAt?: string | null; prefs?: Prefs };

/* a trainee's progress, as plain data */
export async function loadProgress(userId: string): Promise<Progress> {
  await connectToDatabase();
  const doc = await ProgramProgressModel.findOne({ userId }).lean();
  const lessons: Record<string, LessonState> = {};
  for (const l of doc?.lessons ?? []) {
    lessons[l.fid] = { done: Boolean(l.done), work: l.work ?? "", updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : null };
  }
  const created = (doc as { createdAt?: Date } | null)?.createdAt;
  const prefs = { title: doc?.title ?? "", featured: doc?.featured ?? [], hideRank: !!doc?.hideRank, frame: doc?.frame ?? "" };
  return { lessons, completedDays: [...new Set(doc?.completedDays ?? [])].sort((a, b) => a - b), projectId: doc?.projectId ?? "", startedAt: created ? new Date(created).toISOString() : null, prefs };
}
/* the same, shared by everything that asks for it while a page renders (one query per page) — API routes that write
   use loadProgress, so they never read a stale copy */
export const getProgress = cache(loadProgress);

/* days open one after another: day 0 is always open; day n opens when day n−1 is complete. Admins see everything. */
export function isDayOpen(day: number, completedDays: number[], isAdmin = false) {
  return isAdmin || day === 0 || completedDays.includes(day - 1);
}

/* the day to continue: the first open day that isn't finished */
export function currentDay(completedDays: number[], total = 30) {
  for (let d = 0; d <= total; d++) if (!completedDays.includes(d)) return d;
  return total;
}
