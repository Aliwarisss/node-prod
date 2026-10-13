import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { BookReader, type BookFigures } from "@/components/program/book-reader";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { ACT_COLORS, daySummaries, getDay, getModel, getTemplate, type KnowledgeEntry, type Lesson } from "@/lib/program";
import { BOOKS, bookFor } from "@/lib/program/book/books";
import { marksOf } from "@/lib/program/book/marks";
import { figuresOf } from "@/lib/program/book/types";
import knowledgeAll from "@/lib/program/data/knowledge.json";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }): Promise<Metadata> {
  const { book } = await params;
  const b = BOOKS[book]?.en;
  return { title: b ? `${b.title} — the book — Node` : "Book — Node" };
}

/* A book to read: chapters by day, a section per lesson, with the act's own diagrams in the text and the index on
   the right. Open to everyone with access to the program; reading ahead is fine. */
export default async function BookPage({ params, searchParams }: { params: Promise<{ book: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { book: id } = await params;
  const found = await bookFor(id, (await searchParams).lang);
  if (!found) notFound();
  const { book, langs } = found;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/book/${id}`);
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="book" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);

  /* only the data the book's figures use */
  const need = figuresOf(book);
  const days = daySummaries().filter((d) => d.act.id === book.act);
  const lessons: Record<string, Lesson> = {};
  for (const d of days) for (const l of getDay(d.day)?.processes.flatMap((p) => p.lessons) ?? []) if (need.fids.includes(l.fid)) lessons[l.fid] = l;
  const byName = new Map(Object.values(knowledgeAll as Record<string, KnowledgeEntry>).map((k) => [k.name, k]));
  const figures: BookFigures = {
    lessons,
    knowledge: Object.fromEntries(need.knowledge.flatMap((n) => (byName.get(n) ? [[n, byName.get(n)!]] : []))),
    templates: Object.fromEntries(need.templates.flatMap((t) => { const x = getTemplate(t); return x ? [[t, x]] : []; })),
    routes: getModel().routes,
    days: days.map((d) => ({ day: d.day, title: d.title })),
  };
  const marks = await marksOf(session.user.id, book.id);
  return chrome(<BookReader key={book.lang} book={book} figures={figures} color={ACT_COLORS[book.act] ?? "#6d48d8"} marks={marks} langs={langs} />);
}
