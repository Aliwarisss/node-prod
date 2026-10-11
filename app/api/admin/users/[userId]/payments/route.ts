import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { PAY_METHODS } from "@/lib/fee-types";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { feeOf, settleFee } from "@/lib/referrals";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const paymentSchema = z.object({
  amount: z.number().int("Whole rupees only.").min(1, "Enter the amount received.").max(10_000_000, "That amount looks wrong."),
  at: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Pick the date it was received.").refine((s) => Date.parse(s) <= Date.now() + DAY, "That date is in the future.").optional(),
  method: z.enum(PAY_METHODS.map(([id]) => id) as [string, ...string[]]),
  note: z.string().trim().max(200, "Keep the note under 200 characters.").default(""),
});

/* Admin: record a payment towards a trainee's fee. When payments (with referral discounts) cover it, the program
   unlocks on its own. Returns where the fee stands now. */
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { userId } = await params;
  if (!isValidObjectId(userId)) return NextResponse.json({ error: "No such person." }, { status: 404 });
  const parsed = paymentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment." }, { status: 400 });

  await connectToDatabase();
  const who = await UserModel.findById(userId, { role: 1 }).lean();
  if (!who) return NextResponse.json({ error: "No such person." }, { status: 404 });
  if (who.role === "admin") return NextResponse.json({ error: "Admins don’t pay a fee." }, { status: 400 });

  const by = session.user.email ?? session.user.id;
  const { amount, at, method, note } = parsed.data;
  await UserModel.updateOne({ _id: userId }, { $push: { payments: { amount, at: at ? new Date(at) : new Date(), method, note, by } } });
  const unlocked = await settleFee(userId, by);
  return NextResponse.json({ success: true, unlocked, fee: await feeOf(userId) });
}
