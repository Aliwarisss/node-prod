import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { exists, type Kind } from "@/lib/explore";
import { connectToDatabase } from "@/lib/mongodb";
import { ExploreMapModel } from "@/lib/models/explore-map";

export const runtime = "nodejs";

/* My map — any signed-in member (no fee needed: exploring is free) */
async function me() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? { id: session.user.id, name: session.user.name ?? "" } : null;
}
const view = (doc: { items?: Map<string, string> | Record<string, string> | null; target?: string | null } | null) => ({
  signedIn: true,
  items: doc?.items ? (doc.items instanceof Map ? Object.fromEntries(doc.items) : doc.items) : {},
  target: doc?.target ?? "",
});

export async function GET() {
  const user = await me();
  if (!user) return NextResponse.json({ signedIn: false, items: {}, target: "" });
  await connectToDatabase();
  return NextResponse.json(view(await ExploreMapModel.findOne({ userId: user.id }).lean()));
}

const key = z.string().regex(/^(skill|subject):[a-z0-9-]+$/);
const bodySchema = z.union([
  z.object({ key, status: z.enum(["know", "learning", "want"]).nullable() }),
  z.object({ target: z.string().max(60) }),
  z.object({ many: z.record(key, z.enum(["know", "learning", "want"])) }), // mark several at once (e.g. from a roadmap)
]);

export async function PUT(request: Request) {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Sign in to save your map." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid change." }, { status: 400 });
  const d = parsed.data;
  const real = (k: string) => { const [kind, id] = k.split(":"); return exists(kind as Kind, id); };
  await connectToDatabase();

  let update: Record<string, unknown>;
  if ("key" in d) {
    if (!real(d.key)) return NextResponse.json({ error: "Unknown item." }, { status: 400 });
    update = d.status ? { $set: { [`items.${d.key}`]: d.status } } : { $unset: { [`items.${d.key}`]: 1 } };
  } else if ("target" in d) {
    if (d.target && !exists("role", d.target)) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    update = { $set: { target: d.target } };
  } else {
    const entries = Object.entries(d.many).filter(([k]) => real(k)).slice(0, 200);
    update = { $set: Object.fromEntries(entries.map(([k, v]) => [`items.${k}`, v])) };
  }
  const doc = await ExploreMapModel.findOneAndUpdate({ userId: user.id }, update, { upsert: true, new: true }).lean();
  return NextResponse.json(view(doc));
}
