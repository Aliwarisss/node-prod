import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { exists } from "@/lib/explore";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionPollModel } from "@/lib/models/session-poll";
import { SessionRequestModel } from "@/lib/models/session-request";

export const runtime = "nodejs";

const topicSchema = z.string().regex(/^role:[a-z0-9-]+$/).refine((t) => exists("role", t.slice(5)), "Unknown role.");

/* a role's mentor-session status: how many asked, whether I did, and any poll or session already set up for it */
export async function GET(request: Request) {
  const topic = topicSchema.safeParse(new URL(request.url).searchParams.get("topic") ?? "");
  if (!topic.success) return NextResponse.json({ error: "Unknown topic." }, { status: 400 });
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const [count, mine, poll] = await Promise.all([
    SessionRequestModel.countDocuments({ topic: topic.data }),
    session?.user?.id ? SessionRequestModel.exists({ topic: topic.data, userId: session.user.id }) : null,
    SessionPollModel.findOne({ topic: topic.data, status: { $in: ["open", "scheduled"] } }, { status: 1, day: 1, closesAt: 1 }).sort({ createdAt: -1 }).lean(),
  ]);
  const open = !!poll && poll.status === "open" && (!poll.closesAt || new Date(poll.closesAt).getTime() > Date.now());
  return NextResponse.json({ signedIn: !!session?.user?.id, count, mine: !!mine, poll: poll ? { id: String(poll._id), status: poll.status, open, day: poll.day } : null });
}

/* ask for one — or take the request back */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to ask for a session." }, { status: 401 });
  const parsed = z.object({ topic: topicSchema, note: z.string().trim().max(300).default(""), withdraw: z.boolean().default(false) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  await connectToDatabase();
  const { topic, note, withdraw } = parsed.data;
  if (withdraw) await SessionRequestModel.deleteOne({ topic, userId: session.user.id });
  else await SessionRequestModel.updateOne({ topic, userId: session.user.id }, { $set: { name: session.user.name ?? "", note } }, { upsert: true });
  const count = await SessionRequestModel.countDocuments({ topic });
  return NextResponse.json({ count, mine: !withdraw });
}
