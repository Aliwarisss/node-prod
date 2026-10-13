import { NextResponse } from "next/server";
import { z } from "zod";

import { VlogLinkModel } from "@/lib/models/vlog";
import { LANGS, youTubeOf } from "@/lib/program/book/community";
import { communityFor } from "@/lib/program/book/community-store";
import { traineeContext } from "@/lib/program/trainee-api";

export const runtime = "nodejs";

const BOOKS = new Set(["discover"]);
const PER_DAY = 20;

/* everyone's links for the vlog, with scores and my votes */
export async function GET(_request: Request, { params }: { params: Promise<{ book: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { book } = await params;
  if (!BOOKS.has(book)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(await communityFor(book, c.userId));
}

const schema = z.object({
  slot: z.string().max(200).default(""),
  anchor: z.string().max(200).default(""),
  category: z.enum(["alternate", "translation", "addition"]),
  lang: z.string().refine((l) => l in LANGS, "Pick a language from the list.").default("en"),
  kind: z.enum(["video", "article", "other"]),
  url: z.string().trim().url("That doesn't look like a link.").max(800).refine((u) => /^https?:\/\//i.test(u), "Links must start with http(s)://"),
  start: z.number().int().min(0).max(36000).optional(),
  end: z.number().int().min(1).max(36000).optional(),
  title: z.string().trim().max(160).default(""),
  note: z.string().trim().max(400).default(""),
});

/* add a link at a place in the vlog */
export async function POST(request: Request, { params }: { params: Promise<{ book: string }> }) {
  const c = await traineeContext();
  if ("error" in c) return c.error;
  const { book } = await params;
  if (!BOOKS.has(book)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid link." }, { status: 400 });
  const d = parsed.data;
  if (d.category === "addition" ? !d.anchor : !/^(clip:[\w-]{11}:\d+|sub:[\w.-]+)$/.test(d.slot)) return NextResponse.json({ error: "Choose where in the vlog the link belongs." }, { status: 400 });
  if (d.category !== "addition" && d.kind !== "video") return NextResponse.json({ error: "Alternates and translations must be videos." }, { status: 400 });
  if (await VlogLinkModel.countDocuments({ userId: c.userId, createdAt: { $gt: new Date(Date.now() - 864e5) } }) >= PER_DAY) return NextResponse.json({ error: "That's a lot of links for one day — try again tomorrow." }, { status: 429 });

  const end = d.end ?? 0;
  let videoId = "", channel = "", title = d.title, start = d.start ?? 0;
  if (d.kind === "video") {
    const yt = youTubeOf(d.url);
    if (!yt) return NextResponse.json({ error: "Videos must be YouTube links." }, { status: 400 });
    videoId = yt.id;
    if (d.start === undefined && yt.t !== undefined) start = yt.t;
    if (!end || end <= start) return NextResponse.json({ error: "Give the part's end time, after its start." }, { status: 400 });
    if (end - start > 20 * 60) return NextResponse.json({ error: "Keep a part to 20 minutes or less." }, { status: 400 });
    /* the video must exist and be embeddable */
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`).catch(() => null);
    if (!r || !r.ok) return NextResponse.json({ error: "YouTube couldn't find that video, or it can't be embedded." }, { status: 400 });
    const j = (await r.json()) as { title?: string; author_name?: string };
    channel = j.author_name ?? "";
    if (!title) title = j.title ?? "";
  }
  if (!title) return NextResponse.json({ error: "Give the link a title." }, { status: 400 });
  const doc = await VlogLinkModel.create({ book, slot: d.category === "addition" ? "" : d.slot, anchor: d.category === "addition" ? d.anchor : "", category: d.category, lang: d.lang, kind: d.kind, url: d.url, videoId, start, end, title, note: d.note, channel, userId: c.userId, userName: c.name });
  return NextResponse.json({ id: String(doc._id), ...(await communityFor(book, c.userId)) }, { status: 201 });
}
