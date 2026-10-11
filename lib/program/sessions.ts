/* Live sessions, as plain data — for the day pages, Home and the admin's schedule. Server code. */
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { ProgramSessionModel } from "@/lib/models/program-session";

import { TOTAL_DAYS } from "./index";

export type SessionView = { id: string; day: number; title: string; startsAt: string; durationMin: number; link: string; host: string; notes: string; recordingUrl: string };

type Raw = { _id: unknown; day: number; title: string; startsAt: Date; durationMin?: number | null; link?: string | null; host?: string | null; notes?: string | null; recordingUrl?: string | null };
export const toSessionView = (s: Raw): SessionView => ({
  id: String(s._id), day: s.day, title: s.title, startsAt: new Date(s.startsAt).toISOString(), durationMin: s.durationMin ?? 60,
  link: s.link ?? "", host: s.host ?? "", notes: s.notes ?? "", recordingUrl: s.recordingUrl ?? "",
});

/* every session (for the admin), or one day's */
export async function listSessions(day?: number): Promise<SessionView[]> {
  await connectToDatabase();
  const rows = await ProgramSessionModel.find(day === undefined ? {} : { day }).sort({ startsAt: 1 }).lean();
  return rows.map((r) => toSessionView(r as unknown as Raw));
}

/* the next sessions still to come (or under way), soonest first */
export async function upcomingSessions(limit = 3): Promise<SessionView[]> {
  await connectToDatabase();
  const since = new Date(Date.now() - 3 * 60 * 60 * 1000); // still show one that started in the last 3 hours
  const rows = await ProgramSessionModel.find({ startsAt: { $gte: since } }).sort({ startsAt: 1 }).limit(limit + 3).lean();
  return rows.map((r) => toSessionView(r as unknown as Raw)).filter((s) => new Date(s.startsAt).getTime() + s.durationMin * 60000 > Date.now()).slice(0, limit);
}

/* what an admin can set on a session */
const url = z.string().max(500).refine((v) => !v || /^https:\/\/\S+$/i.test(v), "Use a full https:// link.");
export const sessionSchema = z.object({
  day: z.number().int().min(0).max(TOTAL_DAYS),
  title: z.string().trim().min(2).max(120),
  startsAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(480).default(60),
  link: url.default(""),
  host: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(2000).default(""),
  recordingUrl: url.default(""),
});

