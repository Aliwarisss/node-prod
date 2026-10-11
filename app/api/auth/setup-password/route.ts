import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/schemas";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: registerSchema.shape.password,
});

/* First sign-in for an account an admin added: the person creates their password.
 * Only works while the account has no password yet — after that, this endpoint can't change it. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });
  }

  await connectToDatabase();
  const passwordHash = await hashPassword(parsed.data.password);
  const updated = await UserModel.findOneAndUpdate(
    { email: parsed.data.email, passwordSetupRequired: true, passwordHash: { $in: ["", null] } },
    { $set: { passwordHash, passwordSetupRequired: false } },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "This account already has a password. Sign in instead." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
