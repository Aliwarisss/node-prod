import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { CommunityStrip } from "@/components/program/community-strip";
import { ProgramHighlights } from "@/components/program/program-highlights";
import { ProgramMap } from "@/components/program/program-map";
import { DetailProvider } from "@/components/program/program-ui";
import { WorkspaceView } from "@/components/program/workspace-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { FeedPostModel } from "@/lib/models/feed";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel, hasAccess } from "@/lib/models/user";
import { workspaceItems } from "@/lib/program/workspace";
import { cn } from "@/lib/utils";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { AdminDayGrid } from "@/components/program/admin-day-jump";
import { dayLinks, daySummaries, getModel } from "@/lib/program";
import { boardCounts } from "@/lib/program/board";
import { gameOf } from "@/lib/program/gamification";
import { currentDay, getProgress } from "@/lib/program/progress";
import { standing } from "@/lib/program/ranking";
import { programStats } from "@/lib/program/stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My program — Node" };

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  /* everything at once: the account, progress, and the counts on the feed and board pills */
  const uid = session.user.id;
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const [dbUser, progress, counts, today] = await Promise.all([
    UserModel.findById(uid).lean(), getProgress(uid),
    boardCounts().catch(() => ({ byDay: {}, unanswered: 0 })),
    FeedPostModel.countDocuments({ createdAt: { $gte: since } }).catch(() => 0),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  const profile = profileOf(dbUser);
  const checklist = buildProfileChecklist(profile);

  /* fees are cash on delivery: the program stays locked until an admin marks the fee as received */
  if (!hasAccess(dbUser)) {
    return (
      <DashboardChrome activeSection="roadmap" checklist={checklist} profile={profile} user={session.user}>
        <FeesPending />
      </DashboardChrome>
    );
  }

  /* two views: the month (where you stand, your numbers) and your submissions (what you've built and handed in) */
  const view = (await searchParams).view === "submissions" ? "submissions" : "month";
  const fixes = await SubmissionModel.countDocuments({ userId: uid, status: "changes" }).catch(() => 0);
  const tabs = (
    <nav className="flex w-fit gap-1 rounded-full bg-[#eceef0] p-1" aria-label="My program">
      {([["month", "The month", "calendar_month", "/dashboard/roadmap"], ["submissions", "Submissions", "inventory_2", "/dashboard/roadmap?view=submissions"]] as const).map(([id, label, icon, href]) => (
        <Link key={id} href={href} aria-current={view === id ? "page" : undefined} className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors", view === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55 hover:text-[var(--primary)]")}>
          <MaterialSymbol className="text-[17px]" name={icon} />{label}
          {id === "submissions" && fixes ? <span className="rounded-full bg-[var(--electric-pink)] px-1.5 text-[10.5px] text-white" title="Sent back to fix">{fixes}</span> : null}
        </Link>
      ))}
    </nav>
  );
  const chrome = (body: React.ReactNode) => (
    <DashboardChrome activeSection="roadmap" actions={<CommunityStrip open={counts.unanswered} today={today} />} checklist={checklist} profile={profile} user={session.user}>
      <div className="grid gap-6">{tabs}{body}</div>
    </DashboardChrome>
  );

  if (view === "submissions") {
    const { items, templates } = await workspaceItems(uid);
    return chrome(
      <DetailProvider lookups={{ templates, knowledge: {}, lenses: {} }}>
        <WorkspaceView items={items} />
      </DetailProvider>,
    );
  }

  /* the numbers and badges under where you stand */
  const [stats, st] = await Promise.all([
    programStats(uid).catch(() => null),
    standing(uid).catch(() => ({ rank: null, season: null })),
  ]);
  return chrome(
    <div className="grid gap-8">
      {dbUser.role === "admin" ? <AdminDayGrid days={dayLinks()} current={currentDay(progress.completedDays)} /> : null}
      <ProgramMap days={daySummaries()} progress={progress} current={currentDay(progress.completedDays)} isAdmin={dbUser.role === "admin"} model={getModel()} />
      {stats ? <ProgramHighlights stats={stats} game={gameOf(stats, progress.prefs, st.season ?? null)} rank={st.rank ?? null} /> : null}
    </div>,
  );
}
