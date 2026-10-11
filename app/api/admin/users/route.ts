import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRouteSession } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the person’s name."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.enum(["student", "admin"]).default("student"),
  paid: z.boolean().default(false),
});

/* Admin: add a person. They get no password — they create one the first time they sign in. */
export async function POST(request: Request) {
  const session = await requireAdminRouteSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });
  }

  await connectToDatabase();
  const { name, email, role, paid } = parsed.data;

  if (await UserModel.exists({ email })) {
    return NextResponse.json({ error: "Someone with that email already has an account." }, { status: 409 });
  }

  const actor = session.user.email ?? session.user.id;
  const user = await UserModel.create({
    name,
    email,
    role,
    passwordHash: "",
    passwordSetupRequired: true,
    paymentStatus: role === "admin" || paid ? "paid" : "unpaid",
    ...(role !== "admin" && paid ? { paidAt: new Date(), paymentMarkedBy: actor } : {}),
    invitedBy: actor,
  });

  return NextResponse.json({ success: true, id: user._id.toString() }, { status: 201 });
}
