import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AdminOverview } from "@/components/product/admin-overview";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { DashboardShell } from "@/components/product/dashboard-shell";
import { TraineeHome, type HomeData } from "@/components/product/trainee-home";
import { getAdminStats } from "@/lib/admin-stats";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { getDay, lessonIdsOf } from "@/lib/program";
import { currentDay, getProgress } from "@/lib/program/progress";
import { openPolls } from "@/lib/program/session-polls";
import { upcomingSessions } from "@/lib/program/sessions";
import { programStats } from "@/lib/program/stats";
import { boardCounts, listThreads } from "@/lib/program/board";
import { gameOf } from "@/lib/program/gamification";
import { standing } from "@/lib/program/ranking";
import { roleById } from "@/lib/explore";
import { roleMatch } from "@/lib/explore/roadmap";
import { ExploreMapModel } from "@/lib/models/explore-map";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Node" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  /* a trainee's numbers load alongside their account, not after it (the role comes from the session token) */
  const statsLoad = session.user.role !== "admin" ? programStats(session.user.id).catch(() => null) : null;
  const sessionsLoad = session.user.role !== "admin" ? upcomingSessions(2).catch(() => []) : Promise.resolve([]);
  const pollsLoad = session.user.role !== "admin" ? openPolls(session.user.id, 2).catch(() => []) : Promise.resolve([]);
  const dbUser = await UserModel.findById(session.user.id).lean();

  if (!dbUser) {
    redirect("/login");
  }

  const profile = profileOf(dbUser);

  const checklist = buildProfileChecklist(profile);

  /* admins land on the admin overview; trainees on their home */
  if (dbUser.role === "admin") {
    const stats = await getAdminStats();
    return (
      <DashboardChrome activeSection="overview" checklist={checklist} profile={profile} user={session.user}>
        <AdminOverview stats={stats} adminName={profile.name ?? session.user.name ?? "Admin"} />
      </DashboardChrome>
    );
  }

  /* trainees whose program is open: everything at a glance */
  if (hasAccess(dbUser)) {
    const uid = profile.id;
    const [progress, stats, st, threads, counts, sessions, polls, map] = await Promise.all([
      getProgress(uid), statsLoad ?? programStats(uid), standing(uid).catch(() => ({ rank: null, season: null })),
      listThreads(uid, { limit: 4 }).catch(() => []), boardCounts().catch(() => ({ byDay: {}, unanswered: 0 })),
      sessionsLoad, pollsLoad, ExploreMapModel.findOne({ userId: uid }).lean().catch(() => null),
    ]);
    if (stats) {
      const day = getDay(currentDay(progress.completedDays));
      const items = map?.items ? (map.items instanceof Map ? Object.fromEntries(map.items) : (map.items as Record<string, string>)) : {};
      const target = map?.target ? roleById.get(map.target) : undefined;
      const match = target ? roleMatch(target.id, items as Parameters<typeof roleMatch>[1]) : null;
      const data: HomeData = {
        firstName: (profile.name ?? session.user.name ?? "").split(/\s+/)[0] || "there",
        /* null once every day is done — the Home then celebrates instead */
        today: day && !progress.completedDays.includes(day.day) ? {
          day: day.day, title: day.title, act: day.act.name,
          lessons: day.processes.flatMap((pr) => pr.lessons).map((l) => ({ fid: l.fid, code: l.code, title: l.title, done: !!progress.lessons[l.fid]?.done })),
        } : null,
        stats: { overall: stats.overall, stages: stats.stages, recent: stats.recent, attention: stats.attention, current: stats.current },
        game: gameOf(stats, progress.prefs, st.season ?? null),
        rank: st.rank ?? null,
        threads, unanswered: counts.unanswered, sessions, polls,
        goal: target && match ? { roleId: target.id, role: target.name, pct: match.pct, skillGap: match.skillGap, subjectGap: match.missingSubjects.length } : null,
        profile: { pct: checklist.percentage, complete: checklist.isComplete, left: checklist.remainingItems.map((x) => x.label), step: checklist.remainingItems[0]?.step },
      };
      return (
        <DashboardChrome activeSection="overview" checklist={checklist} profile={profile} user={session.user}>
          <TraineeHome d={data} />
        </DashboardChrome>
      );
    }
  }

  /* where the trainee is in the 30 days */
  let today = null;
  if (hasAccess(dbUser)) {
    const [progress, stats] = await Promise.all([getProgress(profile.id), statsLoad ?? programStats(profile.id)]);
    const d = getDay(currentDay(progress.completedDays));
    if (d && stats) {
      const ids = lessonIdsOf(d);
      const o = stats.overall;
      today = {
        day: d.day, title: d.title, act: d.act.name, done: ids.filter((id) => progress.lessons[id]?.done).length, total: ids.length,
        overall: { completion: o.completion, grade: o.grade?.pct ?? null, approved: o.tasks.approved, tasks: o.tasks.total, fixes: o.tasks.changes, streak: o.streak },
      };
    }
  }

  return <DashboardShell checklist={checklist} profile={profile} user={session.user} today={today} sessions={hasAccess(dbUser) ? await sessionsLoad : []} polls={hasAccess(dbUser) ? await pollsLoad : []} />;
}
