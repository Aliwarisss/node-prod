import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { VlogPlayer } from "@/components/program/vlog-player";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { ACT_COLORS } from "@/lib/program";
import { bookFor } from "@/lib/program/book/books";
import { communityFor } from "@/lib/program/book/community-store";
import { buildReel } from "@/lib/program/book/reel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "The vlog — Node" };

const WORDS = {
  en: { reel: { introduction: "Introduction", closing: "Closing", inShort: "In short", topic: (n: string) => `Topic ${n}` }, title: (t: string) => `${t}, in one programme`, intro: "Discover's full outline as one running programme: the introduction, every topic and every subtopic in order — each subtopic's questions, its key points, how to do it, the case, the mistakes and the way back — with the important parts of the talks (or, where there are none, the articles) placed where they belong." },
  ur: { reel: { introduction: "Taaruf", closing: "Ikhtitaam", inShort: "Mukhtasar mein", topic: (n: string) => `Topic ${n}` }, title: (t: string) => `${t}, ek programme mein`, intro: "Discover ka poora outline ek chalte programme mein: taaruf, har topic aur har subtopic tarteeb se — har subtopic ke sawal, ahem nukaat, kaise karein, case, ghaltiyan aur wapsi ka raasta — aur talks ke ahem hisse (ya jahan woh nahi, articles) apni jagah par." },
} as const;

/* the vlog: a programme curated from the book's talks, reading and sections — separate from the book itself */
export default async function VlogPage({ params, searchParams }: { params: Promise<{ book: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { book: id } = await params;
  const found = await bookFor(id, (await searchParams).lang);
  if (!found) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/vlog/${id}`);
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="vlog" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);
  const { book, lang } = found;
  const w = WORDS[lang];
  const community = await communityFor(book.id, session.user.id);
  return chrome(<VlogPlayer key={lang} base={buildReel(book, w.reel)} community={community} me={session.user.id} isAdmin={dbUser.role === "admin"} bookId={book.id} lang={lang} color={ACT_COLORS[book.act] ?? "#6d48d8"} bookPath={`/dashboard/book/${book.id}`} title={w.title(book.title)} intro={w.intro} />);
}
