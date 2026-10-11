import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/schemas";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { referrerByCode } from "@/lib/referrals";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid registration payload.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const normalizedEmail = parsed.data.email.toLowerCase();

    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const name = `${parsed.data.firstName} ${parsed.data.lastName}`;
    /* who referred them — counts towards that person's discount once this account joins (its fee is confirmed) */
    const referrer = parsed.data.ref ? await referrerByCode(parsed.data.ref) : null;

    await UserModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
      primaryTrack: parsed.data.primaryTrack,
      role: "student",
      ...(referrer ? { referredBy: String(referrer._id) } : {}),
    });

    return NextResponse.json(
      { success: true, message: "Account created successfully." },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    console.error("Registration error", error);

    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
