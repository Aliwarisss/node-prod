import { NextResponse } from "next/server";
import { z } from "zod";

import { WorkspaceDocModel } from "@/lib/models/workspace-doc";
import { isWorkspaceRef } from "@/lib/program";
import { getWorkspaceDocs, toDocView } from "@/lib/program/submissions";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const bodySchema = z.object({
  ref: z.string().min(2).max(200),
  title: z.string().max(200).default(""),
  fmt: z.enum(["doc", "sheet", "form", "canvas", "message", "pack"]).default("doc"),
  data: z.unknown().optional(),
  text: z.string().max(80000).default(""),
});

/* the trainee's workspace: every living document they've started */
export async function GET() {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  return NextResponse.json(await getWorkspaceDocs(c.userId));
}

/* save a workspace document — a template's living document, or a lesson-only one */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  const b = parsed.data;
  if (!isWorkspaceRef(b.ref)) return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  if (b.data !== undefined && JSON.stringify(b.data).length > 300000) return NextResponse.json({ error: "That document is too large." }, { status: 413 });

  const doc = await WorkspaceDocModel.findOneAndUpdate(
    { userId: c.userId, ref: b.ref },
    { $set: { title: b.title, fmt: b.fmt, text: b.text, ...(b.data !== undefined ? { data: b.data } : {}) } },
    { upsert: true, new: true },
  ).lean();
  return NextResponse.json(toDocView(doc as never));
}
