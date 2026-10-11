import { NextResponse } from "next/server";
import { z } from "zod";

import { ThreadModel, THREAD_KINDS } from "@/lib/models/board";
import { getDay, TOTAL_DAYS } from "@/lib/program";
import { listThreads, toThreadView, type BoardFilter } from "@/lib/program/board";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* the board's threads (?filter, ?day, ?q) */
export async function GET(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const q = new URL(request.url).searchParams;
  const day = q.get("day") ? Number(q.get("day")) : null;
  return NextResponse.json(await listThreads(c.userId, { filter: (q.get("filter") ?? "all") as BoardFilter, day: Number.isInteger(day) ? day : null, q: q.get("q") ?? "" }));
}

const bodySchema = z.object({
  kind: z.enum(THREAD_KINDS).default("question"),
  title: z.string().trim().min(5, "Give it a title of a few words.").max(160),
  body: z.string().trim().max(8000).default(""),
  day: z.number().int().min(0).max(TOTAL_DAYS).nullable().default(null),
  lessonFid: z.string().max(120).default(""),
});

/* start a thread — a question, a discussion, or something to share */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid thread." }, { status: 400 });
  const b = parsed.data;
  const lesson = b.lessonFid && b.day !== null ? getDay(b.day)?.processes.flatMap((p) => p.lessons).find((l) => l.fid === b.lessonFid) : null;
  const doc = await ThreadModel.create({ ...b, lessonFid: lesson?.fid ?? "", lessonTitle: lesson ? `${lesson.code} ${lesson.title}` : "", authorId: c.userId, authorName: c.name, authorRole: c.isAdmin ? "admin" : "student", lastActivityAt: new Date() });
  return NextResponse.json(toThreadView(doc.toObject() as never, c.userId));
}
