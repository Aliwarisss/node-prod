import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionPollModel } from "@/lib/models/session-poll";
import { pollSchema, toPollView } from "@/lib/program/session-polls";

export const runtime = "nodejs";

const patchSchema = z.union([
  z.object({ action: z.enum(["close", "reopen"]) }),
  pollSchema.partial(),
]);

/* Admin: change a poll (times, title, closing time), close or reopen it — or remove it */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const raw = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid poll." }, { status: 400 });
  await connectToDatabase();
  const poll = await SessionPollModel.findById(id);
  if (!poll) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if ("action" in parsed.data) {
    if (poll.status === "scheduled") return NextResponse.json({ error: "This poll already has its session." }, { status: 409 });
    poll.status = parsed.data.action === "close" ? "closed" : "open";
    if (parsed.data.action === "reopen" && poll.closesAt && poll.closesAt.getTime() < Date.now()) poll.set("closesAt", null);
  } else {
    const { slots, closesAt, ...rest } = parsed.data;
    /* only what was sent — the schema's defaults would otherwise blank the fields left out */
    for (const [k, v] of Object.entries(rest)) if (k in raw) poll.set(k, v);
    if ("closesAt" in raw) poll.set("closesAt", closesAt ? new Date(closesAt) : null);
    if (slots) {
      /* times that stay keep their votes; votes for removed times go */
      const times = [...new Set(slots)].sort();
      if (times.length < 2) return NextResponse.json({ error: "Offer at least two different times." }, { status: 400 });
      const kept = new Map(poll.slots.map((s) => [s.startsAt.toISOString(), s]));
      poll.set("slots", times.map((t) => { const old = kept.get(new Date(t).toISOString()); return old ? { _id: old._id, startsAt: old.startsAt } : { startsAt: new Date(t) }; }));
      const ids = new Set(poll.slots.map((s) => String(s._id)));
      poll.set("votes", poll.votes.map((v) => ({ userId: v.userId, name: v.name, at: v.at, slotIds: (v.slotIds ?? []).filter((x) => ids.has(x)) })));
    }
  }
  await poll.save();
  return NextResponse.json(toPollView(poll.toObject() as never, session.user.id, true));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await connectToDatabase();
  await SessionPollModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
