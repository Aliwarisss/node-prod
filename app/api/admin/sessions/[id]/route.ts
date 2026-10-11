import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramSessionModel } from "@/lib/models/program-session";
import { sessionSchema, toSessionView } from "@/lib/program/sessions";

export const runtime = "nodejs";

/* Admin: change a session (time, link, recording…) or remove it */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const raw = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const parsed = sessionSchema.partial().safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid session." }, { status: 400 });
  await connectToDatabase();
  /* only what was sent — the schema's defaults would otherwise blank the fields left out */
  const set: Record<string, unknown> = Object.fromEntries(Object.entries(parsed.data).filter(([k]) => k in raw));
  if (parsed.data.startsAt) set.startsAt = new Date(parsed.data.startsAt);
  const doc = await ProgramSessionModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(toSessionView(doc as never));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await connectToDatabase();
  await ProgramSessionModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
