import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramSessionModel } from "@/lib/models/program-session";
import { SessionPollModel } from "@/lib/models/session-poll";
import { toPollView } from "@/lib/program/session-polls";
import { toSessionView } from "@/lib/program/sessions";

export const runtime = "nodejs";

const bodySchema = z.object({
  slotId: z.string().min(1),
  link: z.string().max(500).refine((v) => !v || /^https:\/\/\S+$/i.test(v), "Use a full https:// link.").default(""),
});

/* Admin: pick the time — the poll closes and the day's session is scheduled at that time */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  await connectToDatabase();
  const poll = await SessionPollModel.findById(id);
  if (!poll) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (poll.status === "scheduled") return NextResponse.json({ error: "This poll already has its session." }, { status: 409 });
  const slot = poll.slots.find((s) => String(s._id) === parsed.data.slotId);
  if (!slot) return NextResponse.json({ error: "That time isn’t in the poll." }, { status: 400 });

  const doc = await ProgramSessionModel.create({
    day: poll.day, title: poll.title, startsAt: slot.startsAt, durationMin: poll.durationMin, host: poll.host,
    notes: poll.note, link: parsed.data.link, createdBy: session.user.id,
  });
  poll.status = "scheduled";
  poll.chosenSlotId = String(slot._id);
  poll.sessionId = String(doc._id);
  await poll.save();
  return NextResponse.json({ poll: toPollView(poll.toObject() as never, session.user.id, true), session: toSessionView(doc.toObject() as never) });
}
