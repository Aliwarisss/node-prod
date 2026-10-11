import { NextResponse } from "next/server";

import { referrerByCode } from "@/lib/referrals";

export const runtime = "nodejs";

/* whose referral code this is — only a first name, for "Invited by …" on the sign-up form */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const r = await referrerByCode(code);
  if (!r) return NextResponse.json({ name: "" }, { status: 404 });
  const first = r.name?.trim() ? r.name.trim().split(/\s+/)[0] : "a Node member";
  return NextResponse.json({ name: first });
}
