import { NextResponse } from "next/server";
import { z } from "zod";

import { ProgramProgressModel } from "@/lib/models/program-progress";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* whether the program shares your milestones on the feed for you */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = z.object({ shareAuto: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await ProgramProgressModel.updateOne({ userId: c.userId }, { $set: { shareAuto: parsed.data.shareAuto } }, { upsert: true });
  return NextResponse.json({ shareAuto: parsed.data.shareAuto });
}
