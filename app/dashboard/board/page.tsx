import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { BoardView } from "@/components/program/board-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { daySummaries, getDay } from "@/lib/program";
import { boardCounts, listThreads, type BoardFilter } from "@/lib/program/board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Board — Node" };

/* the board — ?new=1 opens a new thread (with ?day and ?lesson filled in from where they came) */
export default async function BoardPage({ searchParams }: { searchParams: Promise<{ new?: string; day?: string; lesson?: string; filter?: string; title?: string; body?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const q = await searchParams;
  const day = q.day !== undefined && Number.isInteger(Number(q.day)) ? Number(q.day) : null;
  const filter = (["all", "unanswered", "mine", "question", "discussion", "share"].includes(q.filter ?? "") ? q.filter : "all") as BoardFilter;
  const [dbUser, threads, counts] = await Promise.all([UserModel.findById(session.user.id).lean(), listThreads(session.user.id, { filter, day: q.new ? null : day }), boardCounts()]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const days = daySummaries().map((s) => ({ day: s.day, title: s.title, lessons: (getDay(s.day)?.processes.flatMap((p) => p.lessons) ?? []).map((l) => ({ fid: l.fid, code: l.code, title: l.title })) }));
  return (
    <DashboardChrome activeSection="board" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      {hasAccess(dbUser) ? <BoardView initial={threads} days={days} isAdmin={dbUser.role === "admin"} preset={{ open: !!q.new, day, lesson: q.lesson ?? "", filter, title: (q.title ?? "").slice(0, 140), body: (q.body ?? "").slice(0, 2000) }} counts={{ unanswered: counts.unanswered }} /> : <FeesPending />}
    </DashboardChrome>
  );
}
