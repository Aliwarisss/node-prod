import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionPollModel } from "@/lib/models/session-poll";
import { listPolls, pollSchema, toPollView } from "@/lib/program/session-polls";

export const runtime = "nodejs";

/* Admin: every time poll, and opening a new one */
export async function GET() {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json(await listPolls(session.user.id, { admin: true }));
}

export async function POST(request: Request) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = pollSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid poll." }, { status: 400 });
  const { slots, closesAt, ...rest } = parsed.data;
  const times = [...new Set(slots)].sort();
  if (times.length < 2) return NextResponse.json({ error: "Offer at least two different times." }, { status: 400 });
  await connectToDatabase();
  const doc = await SessionPollModel.create({ ...rest, slots: times.map((t) => ({ startsAt: new Date(t) })), closesAt: closesAt ? new Date(closesAt) : null, createdBy: session.user.id });
  return NextResponse.json(toPollView(doc.toObject() as never, session.user.id, true));
}
