import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { SessionPollModel } from "@/lib/models/session-poll";
import { toPollView } from "@/lib/program/session-polls";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const ids = z.array(z.string().min(1).max(40)).max(42);
const bodySchema = z.object({ slotIds: ids, maybeIds: ids.default([]), none: z.boolean().default(false) });

/* a trainee's availability: the times that suit them, the ones that would do if needed, or none at all — nothing
   at all clears it; they can change it while the poll is open */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  const poll = await SessionPollModel.findById(id, { slots: 1, status: 1, closesAt: 1 }).lean();
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  if (poll.status !== "open" || (poll.closesAt && poll.closesAt.getTime() <= Date.now())) return NextResponse.json({ error: "Voting has closed for this session." }, { status: 409 });
  const ids = new Set(poll.slots.map((s) => String(s._id)));
  const slotIds = [...new Set(parsed.data.slotIds)].filter((x) => ids.has(x));
  const maybeIds = [...new Set(parsed.data.maybeIds)].filter((x) => ids.has(x) && !slotIds.includes(x));
  const none = parsed.data.none && !slotIds.length && !maybeIds.length;

  /* replace this person's vote in one step */
  await SessionPollModel.updateOne({ _id: id }, { $pull: { votes: { userId: c.userId } } });
  const updated = slotIds.length || maybeIds.length || none
    ? await SessionPollModel.findByIdAndUpdate(id, { $push: { votes: { userId: c.userId, name: c.name, slotIds, maybeIds, none, at: new Date() } } }, { new: true }).lean()
    : await SessionPollModel.findById(id).lean();
  return NextResponse.json(toPollView(updated as never, c.userId, c.isAdmin));
}
