import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { BookNotes, type NotesPage } from "@/components/program/book-notes";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { bookFor } from "@/lib/program/book/books";
import { marksOf } from "@/lib/program/book/marks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My notes — the book — Node" };

/* everything you kept in a book: highlights, notes and bookmarks */
export default async function BookNotesPage({ params, searchParams }: { params: Promise<{ book: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { book: id } = await params;
  const found = await bookFor(id, (await searchParams).lang);
  if (!found) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/book/${id}/notes`);
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="book" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);

  const { book, lang } = found;
  /* grouped as the book is: the introduction, topics 1.1 … 1.5, the closing */
  const groupOf = (c: (typeof book.chapters)[number]) => (c.day ? `${book.number ?? "1"}.${c.day} · ${c.title}` : c.title);
  const pages: NotesPage[] = [{ key: "index", title: book.title, chapter: book.title }, ...book.chapters.flatMap((c) => [
    { key: `ch-${c.id}`, title: c.title, chapter: groupOf(c) },
    ...c.sections.map((s) => ({ key: s.id, title: s.title, chapter: groupOf(c), code: s.code })),
  ])];
  return chrome(<BookNotes bookId={book.id} bookTitle={book.title} marks={await marksOf(session.user.id, book.id)} pages={pages} lang={lang} />);
}
