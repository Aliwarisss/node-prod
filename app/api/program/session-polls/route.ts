import { NextResponse } from "next/server";

import { openPolls } from "@/lib/program/session-polls";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* the time polls still taking votes — for the vote card that floats at the bottom right */
export async function GET() {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  if (c.isAdmin) return NextResponse.json([]); // admins run the polls; they don't vote in them
  return NextResponse.json(await openPolls(c.userId, 10));
}
