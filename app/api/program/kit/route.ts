import { NextResponse } from "next/server";

import { kitFile, kitStages } from "@/lib/program/kit";
import { loadProgress } from "@/lib/program/progress";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* the agent kit, one file at a time (?act&path&scale). Bulk downloads are not offered — the kit stays on the site for
   members. A stage's kit opens when the trainee reaches its first day. */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const q = new URL(request.url).searchParams;
  const act = q.get("act") ?? "", scale = q.get("scale") || "solo";
  const stage = kitStages((await loadProgress(c.userId)).completedDays, c.isAdmin).find((s) => s.id === act);
  if (!stage) return NextResponse.json({ error: "No such stage." }, { status: 404 });
  if (!stage.unlocked) return NextResponse.json({ error: `The ${stage.name} kit unlocks on Day ${stage.firstDay}.` }, { status: 403 });

  if (q.get("zip")) return NextResponse.json({ error: "Kit downloads aren't available — open the files in the Agent kit." }, { status: 403 });

  const file = kitFile(act, q.get("path") ?? "", scale);
  if (!file) return NextResponse.json({ error: "No such file." }, { status: 404 });
  return NextResponse.json(file);
}
