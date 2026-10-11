import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { revokeSessions } from "@/lib/auth/sessions";
import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";

/* Admin: sign an account out on every device (a lost or shared device holding it) — it can then sign in anywhere */
export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await requireAdminRouteSession())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const { userId } = await params;
  if (!isValidObjectId(userId)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await revokeSessions(userId);
  return NextResponse.json({ ok: true });
}
