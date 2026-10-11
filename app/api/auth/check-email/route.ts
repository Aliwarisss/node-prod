import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export const runtime = "nodejs";

const bodySchema = z.object({ email: z.email().trim().toLowerCase() });

/* Sign-in step 1: does this email still need to create a password?
 * Unknown emails answer "password" like any other, so this can't be used to discover who has an account. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email }, { passwordHash: 1, passwordSetupRequired: 1 }).lean();
  const needsSetup = Boolean(user && user.passwordSetupRequired && !user.passwordHash);

  return NextResponse.json({ next: needsSetup ? "setup" : "password" });
}
