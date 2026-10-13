import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { VlogLinkModel, VlogVoteModel } from "@/lib/models/vlog";
import { communityFor } from "@/lib/program/book/community-store";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

/* take a link down — the person who added it, or an admin */
export async function DELETE(_request: Request, { params }: { params: Promise<{ book: string; id: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { book, id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const link = await VlogLinkModel.findOne({ _id: id, book }, { userId: 1 }).lean();
  if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (link.userId !== c.userId && !c.isAdmin) return NextResponse.json({ error: "Only the person who added it can remove it." }, { status: 403 });
  await Promise.all([VlogLinkModel.deleteOne({ _id: id }), VlogVoteModel.deleteMany({ book, target: id })]);
  return NextResponse.json(await communityFor(book, c.userId));
}
