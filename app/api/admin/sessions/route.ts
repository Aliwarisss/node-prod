import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramSessionModel } from "@/lib/models/program-session";
import { listSessions, sessionSchema, toSessionView } from "@/lib/program/sessions";

export const runtime = "nodejs";

/* Admin: every session, and adding one */
export async function GET() {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json(await listSessions());
}

export async function POST(request: Request) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = sessionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid session." }, { status: 400 });
  await connectToDatabase();
  const doc = await ProgramSessionModel.create({ ...parsed.data, startsAt: new Date(parsed.data.startsAt), createdBy: session.user.id });
  return NextResponse.json(toSessionView(doc.toObject() as never));
}
