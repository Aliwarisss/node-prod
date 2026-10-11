import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { DayPlayer } from "@/components/program/day-player";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { dayLinks, getDay, getModel, lessonIdsOf, lookupsFor, TOTAL_DAYS } from "@/lib/program";
import { currentDay, getProgress, isDayOpen } from "@/lib/program/progress";
import { deliverablesOf } from "@/lib/program/deliverables";
import { boardCounts } from "@/lib/program/board";
import { lessonKits } from "@/lib/program/kit";
import { listPolls } from "@/lib/program/session-polls";
import { listSessions } from "@/lib/program/sessions";
import { getSubmissions, getWorkspaceDocs } from "@/lib/program/submissions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }): Promise<Metadata> {
  const { day } = await params;
  const d = getDay(Number(day));
  return { title: d ? `Day ${d.day}: ${d.title} — Node` : "Program — Node" };
}

export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day: raw } = await params;
  const dayNo = Number(raw);
  const day = getDay(dayNo);
  if (!day) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  await connectToDatabase();
  /* every query this page needs, at once — each is a round trip to the database */
  const uid = session.user.id;
  const docRefs = day.processes.flatMap((p) => p.lessons).flatMap((l) => deliverablesOf(l).map((d) => d.ref).concat(l.workflows.flatMap((w) => [...w.entryUses, ...w.steps.flatMap((s) => s.uses)]).filter((u) => u.ref).map((u) => `knowledge:${u.ref}`)));
  const [dbUser, , subs, docs, sessions, board, polls] = await Promise.all([UserModel.findById(uid).lean(), getProgress(uid), getSubmissions(uid, dayNo), getWorkspaceDocs(uid, docRefs), listSessions(dayNo), boardCounts(), listPolls(uid, { day: dayNo }).catch(() => [])]);
  if (!dbUser) redirect("/login");

  const profile = profileOf(dbUser);
  const checklist = buildProfileChecklist(profile);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="roadmap" checklist={checklist} profile={profile} user={session.user}>{children}</DashboardChrome>
  );

  if (!hasAccess(dbUser)) return chrome(<FeesPending />);

  const isAdmin = dbUser.role === "admin";
  const progress = await getProgress(profile.id);

  if (!isDayOpen(dayNo, progress.completedDays, isAdmin)) {
    const now = currentDay(progress.completedDays);
    return chrome(
      <section className="grid justify-items-center gap-4 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#f1f2f3] text-black/60"><MaterialSymbol className="text-[28px]" name="lock" /></span>
        <h1 className="font-heading text-[26px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Day {dayNo} isn’t open yet</h1>
        <p className="max-w-[460px] text-[15px] text-[var(--on-surface-variant)]">Days open one after another. Finish day {dayNo - 1} to unlock this one.</p>
        <Link href={`/dashboard/roadmap/day/${now}`} className="rounded-full bg-[var(--primary)] px-6 py-3 text-[13px] font-bold text-white">Go to day {now}</Link>
      </section>,
    );
  }

  const ids = lessonIdsOf(day);
  const lessonState = Object.fromEntries(ids.map((id) => [id, progress.lessons[id] ?? { done: false, work: "", updatedAt: null }]));

  return chrome(
    <DayPlayer
      day={day}
      model={getModel()}
      lookups={lookupsFor(day)}
      initialLessons={lessonState}
      initialDayDone={progress.completedDays.includes(dayNo)}
      hasNext={dayNo < TOTAL_DAYS}
      sessions={sessions}
      polls={polls.filter((p) => p.status !== "scheduled")}
      threads={board.byDay[dayNo] ?? 0}
      nextDay={(() => { const n = getDay(dayNo + 1); return n ? { day: n.day, title: n.title, goal: n.goal, act: n.act.name } : null; })()}
      projectId={progress.projectId}
      kit={lessonKits(day.processes.flatMap((p) => p.lessons), progress.completedDays, isAdmin)}
      initialSubs={subs}
      initialDocs={docs}
      allDays={isAdmin ? dayLinks() : undefined}
    />,
  );
}
