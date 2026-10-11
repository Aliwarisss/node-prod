import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";
import { UserModel, hasAccess } from "@/lib/models/user";
import { projectById } from "@/lib/program/projects";

export const runtime = "nodejs";

const bodySchema = z.object({ projectId: z.string().min(1) });

/* pick (or change) the practice project carried through the month */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  await connectToDatabase();
  const user = await UserModel.findById(session.user.id, { role: 1, paymentStatus: 1 }).lean();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!hasAccess(user)) return NextResponse.json({ error: "Your program unlocks once your fee is confirmed." }, { status: 402 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const project = parsed.success ? projectById(parsed.data.projectId) : null;
  if (!project) return NextResponse.json({ error: "Pick one of the listed projects." }, { status: 400 });

  await ProgramProgressModel.updateOne(
    { userId: session.user.id },
    { $set: { projectId: project.id }, $setOnInsert: { userId: session.user.id, lessons: [], completedDays: [] } },
    { upsert: true },
  );
  return NextResponse.json({ projectId: project.id });
}
