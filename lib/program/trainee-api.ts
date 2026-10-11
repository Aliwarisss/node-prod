import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";

/* the signed-in trainee for a program API route — or the response to send instead */
export async function traineeContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  await connectToDatabase();
  const user = await UserModel.findById(session.user.id, { role: 1, paymentStatus: 1, name: 1, email: 1 }).lean();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!hasAccess(user)) return { error: NextResponse.json({ error: "Your program unlocks once your fee is confirmed." }, { status: 402 }) };
  return { userId: session.user.id, isAdmin: user.role === "admin", name: user.name || user.email || "Trainee" };
}
