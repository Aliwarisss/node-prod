import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { referralSummary } from "@/lib/referrals";

export const runtime = "nodejs";

/* your referral code, who you've referred, and what your fee comes to — open to every signed-in member, paid or not */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json(await referralSummary(session.user.id));
}
