import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfessorWaitlistModel } from "@/lib/models/professor-waitlist";

export const runtime = "nodejs";

/* The Professor's waitlist — public: how many are waiting (and whether the signed-in person is), and joining it with
   an email (signed in: their account's email) */
export async function GET() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const [count, me] = await Promise.all([ProfessorWaitlistModel.countDocuments({}), email ? ProfessorWaitlistModel.exists({ email }) : null]);
  return NextResponse.json({ count, joined: !!me, signedIn: !!session?.user });
}

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200).optional() });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email." }, { status: 400 });
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase() ?? parsed.data.email;
  if (!email) return NextResponse.json({ error: "Enter your email." }, { status: 400 });
  await connectToDatabase();
  await ProfessorWaitlistModel.updateOne({ email }, { $setOnInsert: { email, userId: session?.user?.id ?? "", name: session?.user?.name ?? "" } }, { upsert: true });
  return NextResponse.json({ count: await ProfessorWaitlistModel.countDocuments({}), joined: true, signedIn: !!session?.user });
}
