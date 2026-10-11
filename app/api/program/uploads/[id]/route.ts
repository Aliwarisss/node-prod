import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UploadModel } from "@/lib/models/upload";

export const runtime = "nodejs";

/* download an attached file — its owner, an admin reviewing it, or anyone in the program for an image shared on the feed */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await connectToDatabase();
  const f = await UploadModel.findById(id).lean();
  if (!f || (f.userId !== session.user.id && session.user.role !== "admin" && !f.public)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const image = /^image\/(png|jpe?g|gif|webp)$/i.test(f.type || "");
  /* a lean read gives the bytes as a BSON Binary, not a Buffer — take its bytes either way */
  const raw = f.data as unknown as Buffer | { buffer: Uint8Array; value?: () => Uint8Array };
  const bytes = Buffer.isBuffer(raw) ? raw : typeof raw.value === "function" ? raw.value() : raw.buffer;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": f.type || "application/octet-stream",
      "Content-Disposition": `${f.public && image ? "inline" : "attachment"}; filename="${encodeURIComponent(f.name)}"`,
      "Cache-Control": f.public ? "private, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
