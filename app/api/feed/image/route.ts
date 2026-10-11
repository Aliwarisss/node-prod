import { NextResponse } from "next/server";

import { UploadModel } from "@/lib/models/upload";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const MAX = 4 * 1024 * 1024;
const TYPES = /^image\/(png|jpe?g|gif|webp)$/i;

/* a picture for a feed post — shared with everyone in the program */
export async function POST(request: Request) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a picture." }, { status: 400 });
  if (!TYPES.test(file.type)) return NextResponse.json({ error: "Pictures only — PNG, JPG, GIF or WebP." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Pictures up to 4 MB." }, { status: 413 });
  const saved = await UploadModel.create({ userId: c.userId, name: file.name, type: file.type, size: file.size, data: Buffer.from(await file.arrayBuffer()), public: true });
  return NextResponse.json({ id: String(saved._id), name: file.name });
}
