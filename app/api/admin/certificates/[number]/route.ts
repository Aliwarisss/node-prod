import { NextResponse } from "next/server";
import { z } from "zod";

import { setRevoked } from "@/lib/certificate";
import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";

/* Admin: withdraw a certificate, or restore it */
export async function PATCH(request: Request, { params }: { params: Promise<{ number: string }> }) {
  if (!(await requireAdminRouteSession())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = z.object({ revoked: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Say whether to withdraw or restore." }, { status: 400 });
  const c = await setRevoked((await params).number, parsed.data.revoked);
  return c ? NextResponse.json(c) : NextResponse.json({ error: "No certificate with that number." }, { status: 404 });
}
