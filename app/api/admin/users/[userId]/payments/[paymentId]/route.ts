import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { feeOf } from "@/lib/referrals";

export const runtime = "nodejs";

/* Admin: remove a payment recorded by mistake. The balance goes back up; an open program stays open (access is never
   taken back — mark them unpaid by hand if that's what's needed). */
export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string; paymentId: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { userId, paymentId } = await params;
  if (!isValidObjectId(userId) || !isValidObjectId(paymentId)) return NextResponse.json({ error: "No such payment." }, { status: 404 });
  await connectToDatabase();
  const res = await UserModel.updateOne({ _id: userId }, { $pull: { payments: { _id: paymentId } } });
  if (!res.matchedCount) return NextResponse.json({ error: "No such person." }, { status: 404 });
  if (!res.modifiedCount) return NextResponse.json({ error: "That payment was already removed." }, { status: 404 });
  return NextResponse.json({ success: true, fee: await feeOf(userId) });
}
