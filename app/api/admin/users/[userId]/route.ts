import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { PAYMENT_STATUSES, UserModel } from "@/lib/models/user";
import { FREE_AT, referralSummary, settleReferrals } from "@/lib/referrals";

export const runtime = "nodejs";

const patchSchema = z.union([
  z.object({ paymentStatus: z.enum(PAYMENT_STATUSES) }),
  z.object({ cashbackPaidOut: z.literal(true) }), // the cash back owed has been handed over
]);

/* Admin: mark a person's fee as received (cash on delivery), or undo it */
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId } = await params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  }

  await connectToDatabase();
  if ("cashbackPaidOut" in parsed.data) {
    const s = await referralSummary(userId);
    if (s.cashback.owed > 0) {
      await UserModel.updateOne({ _id: userId }, { $set: { cashbackPaid: s.cashback.earned }, $push: { cashbackLog: { amount: s.cashback.owed, at: new Date(), by: session.user.email ?? session.user.id } } });
    }
    return NextResponse.json({ success: true, cashbackPaid: s.cashback.earned });
  }
  const paid = parsed.data.paymentStatus === "paid";
  /* friends who had already joined came off this fee — friends after this earn cash back */
  const joinedNow = paid ? Math.min(FREE_AT, await UserModel.countDocuments({ referredBy: userId, paymentStatus: "paid" })) : 0;
  const updated = await UserModel.findByIdAndUpdate(
    userId,
    paid
      ? { $set: { paymentStatus: "paid", paidAt: new Date(), paymentMarkedBy: session.user.email ?? session.user.id, paidJoined: joinedNow } }
      : { $set: { paymentStatus: "unpaid", paidJoined: 0 }, $unset: { paidAt: 1, paymentMarkedBy: 1 } },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  /* a paid member counts for whoever referred them — five joined friends make that person's program free */
  if (paid) await settleReferrals(userId);

  return NextResponse.json({ success: true, paymentStatus: updated.paymentStatus });
}
