/* Session time polls, as plain data — trainees see the times and counts (and their own picks); admins also see who
   voted for what. Server code. */
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { SessionPollModel } from "@/lib/models/session-poll";

import { TOTAL_DAYS } from "./index";

/* availability per slot: yes (votes), if needed (maybes) — admins also see who */
export type PollSlot = { id: string; startsAt: string; votes: number; maybes: number; voters?: string[]; maybeVoters?: string[] };
export type PollView = {
  id: string; day: number; title: string; host: string; durationMin: number; note: string; topic: string;
  status: "open" | "closed" | "scheduled"; closesAt: string | null; open: boolean; // open = still taking votes
  chosenSlotId: string; sessionId: string;
  slots: PollSlot[];
  voters: number; // people who answered
  none: number; // of them, how many can't make any time
  mine: string[]; mineMaybe: string[]; mineNone: boolean; voted: boolean; // the viewer's own answer
};

type Raw = {
  _id: unknown; day: number; title: string; host?: string | null; durationMin?: number | null; note?: string | null; topic?: string | null;
  status?: string | null; closesAt?: Date | null; chosenSlotId?: string | null; sessionId?: string | null;
  slots?: { _id?: unknown; startsAt: Date }[]; votes?: { userId?: string | null; name?: string | null; slotIds?: string[]; maybeIds?: string[] | null; none?: boolean | null }[];
};

export function toPollView(p: Raw, viewerId: string, admin = false): PollView {
  const votes = p.votes ?? [];
  const status = (p.status ?? "open") as PollView["status"];
  const open = status === "open" && (!p.closesAt || new Date(p.closesAt).getTime() > Date.now());
  const me = votes.find((v) => v.userId === viewerId);
  return {
    id: String(p._id), day: p.day, title: p.title, host: p.host ?? "", durationMin: p.durationMin ?? 60, note: p.note ?? "", topic: p.topic ?? "",
    status, closesAt: p.closesAt ? new Date(p.closesAt).toISOString() : null, open,
    chosenSlotId: p.chosenSlotId ?? "", sessionId: p.sessionId ?? "",
    slots: (p.slots ?? []).map((s) => {
      const id = String(s._id);
      const by = votes.filter((v) => v.slotIds?.includes(id)), maybe = votes.filter((v) => v.maybeIds?.includes(id));
      return { id, startsAt: new Date(s.startsAt).toISOString(), votes: by.length, maybes: maybe.length, ...(admin ? { voters: by.map((v) => v.name || "Trainee"), maybeVoters: maybe.map((v) => v.name || "Trainee") } : {}) };
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    voters: votes.length,
    none: votes.filter((v) => v.none).length,
    mine: me?.slotIds ?? [], mineMaybe: me?.maybeIds ?? [], mineNone: !!me?.none, voted: !!me,
  };
}

/* the polls for one day, or (for the admin) all of them */
export async function listPolls(viewerId: string, opts: { day?: number; admin?: boolean } = {}): Promise<PollView[]> {
  await connectToDatabase();
  const rows = await SessionPollModel.find(opts.day === undefined ? {} : { day: opts.day }).sort({ day: 1, createdAt: -1 }).lean();
  return rows.map((r) => toPollView(r as unknown as Raw, viewerId, opts.admin));
}

/* open polls across the program — for Home */
export async function openPolls(viewerId: string, limit = 3): Promise<PollView[]> {
  await connectToDatabase();
  const rows = await SessionPollModel.find({ status: "open", $or: [{ closesAt: null }, { closesAt: { $gt: new Date() } }] }).sort({ day: 1 }).limit(limit).lean();
  return rows.map((r) => toPollView(r as unknown as Raw, viewerId));
}

/* what an admin can set on a poll */
export const pollSchema = z.object({
  day: z.number().int().min(0).max(TOTAL_DAYS),
  title: z.string().trim().min(2).max(120),
  host: z.string().trim().max(80).default(""),
  durationMin: z.number().int().min(10).max(480).default(60),
  note: z.string().trim().max(1000).default(""),
  topic: z.string().max(80).regex(/^$|^role:[a-z0-9-]+$/).default(""),
  slots: z.array(z.string().datetime()).min(2, "Offer at least two times.").max(42, "42 times at most."),
  closesAt: z.string().datetime().nullable().default(null),
});
