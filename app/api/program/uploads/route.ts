import { NextResponse } from "next/server";

import { MAX_UPLOAD, UploadModel } from "@/lib/models/upload";
import { WorkspaceDocModel } from "@/lib/models/workspace-doc";
import { isWorkspaceRef } from "@/lib/program";
import { toDocView } from "@/lib/program/submissions";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const OK = /\.(pdf|pptx?|key|docx?|odt|odp|xlsx?|csv|png|jpe?g)$/i;

/* attach a file (a deck, a PDF, a Word file) to a workspace document */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const ref = String(form?.get("ref") ?? "");
  const title = String(form?.get("title") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  if (!ref || !isWorkspaceRef(ref)) return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: "Files up to 5 MB." }, { status: 413 });
  if (!OK.test(file.name)) return NextResponse.json({ error: "Upload a PDF, PowerPoint, Word, Excel or image file." }, { status: 400 });

  const saved = await UploadModel.create({ userId: c.userId, name: file.name, type: file.type || "application/octet-stream", size: file.size, data: Buffer.from(await file.arrayBuffer()) });
  const doc = await WorkspaceDocModel.findOneAndUpdate(
    { userId: c.userId, ref },
    { $set: { upload: { id: String(saved._id), name: file.name, mime: file.type, size: file.size } }, $setOnInsert: { title, fmt: "doc", text: "" } },
    { upsert: true, new: true },
  ).lean();
  return NextResponse.json(toDocView(doc as never));
}
