import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { BookGlossary } from "@/components/program/book-glossary";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { ACT_COLORS } from "@/lib/program";
import { bookFor } from "@/lib/program/book/books";
import { glossaryOf } from "@/lib/program/book/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Glossary — the book — Node" };

/* the book's key terms, A–Z */
export default async function BookGlossaryPage({ params, searchParams }: { params: Promise<{ book: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { book: id } = await params;
  const found = await bookFor(id, (await searchParams).lang);
  if (!found) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/book/${id}/glossary`);
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="book" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);

  const { book, lang } = found;
  const titles = Object.fromEntries(book.chapters.flatMap((c) => [[`ch-${c.id}`, c.title], ...c.sections.map((s) => [s.id, s.title])]));
  return chrome(<BookGlossary bookId={book.id} bookTitle={book.title} entries={glossaryOf(book)} titles={titles} lang={lang} color={ACT_COLORS[book.act] ?? "#6d48d8"} />);
}
