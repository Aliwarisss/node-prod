import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { KitBrowser } from "@/components/program/kit-browser";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { daySummaries, getDay, stageOf } from "@/lib/program";
import { kitFile, kitFiles, kitIndex, kitStages } from "@/lib/program/kit";
import { currentDay, getProgress } from "@/lib/program/progress";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agent kit — Node" };

/* The agent kit, stage by stage — each stage's kit opens when the trainee reaches it */
export default async function KitPage({ searchParams }: { searchParams: Promise<{ act?: string; file?: string; lesson?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const [dbUser] = await Promise.all([UserModel.findById(session.user.id).lean(), getProgress(session.user.id)]); // one round trip, not two
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="kit" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);

  const q = await searchParams;
  const isAdmin = dbUser.role === "admin";
  const progress = await getProgress(profile.id);
  const today = currentDay(progress.completedDays);
  const stages = kitStages(progress.completedDays, isAdmin);
  /* the stage to show: the one asked for, else the stage you're in (or the last one you've reached) */
  const todayAct = daySummaries().find((d) => d.day === today)?.act.id;
  const act = stages.find((s) => s.id === q.act)?.id ?? stages.find((s) => s.id === todayAct)?.id ?? [...stages].reverse().find((s) => s.unlocked)?.id ?? stages[0].id;
  const stage = stages.find((s) => s.id === act)!;
  const files = stage.unlocked ? kitFiles(act) : null;
  const lessonInfo = (() => {
    if (!q.lesson) return null;
    for (const s of daySummaries()) {
      if (!s.lessonIds.includes(q.lesson)) continue;
      const l = getDay(s.day)?.processes.flatMap((p) => p.lessons).find((x) => x.fid === q.lesson);
      if (l) return { fid: l.fid, code: l.code, title: l.title, day: s.day };
    }
    return null;
  })();
  /* the kit opens on "How to use this kit" — unless a file was asked for */
  const pick = files?.find((f) => f.path === q.file && f.path !== "README.md")?.path;
  const initial = pick ? kitFile(act, pick) : null;
  const idx = kitIndex();
  /* the stage's days and lessons, so the files can be laid out the way the program runs */
  const days = (stageOf(act)?.days ?? []).map((d) => ({ day: d.day, title: d.title, lessons: d.processes.flatMap((p) => p.lessons) }));
  const runCommand = files?.find((f) => f.layer === "commands" && f.path.endsWith("-run-act.md"))?.path.replace(/^commands\//, "").replace(/\.md$/, "") ?? `${act}-run-act`;

  return chrome(<KitBrowser key={act} stages={stages} act={act} files={files} layers={idx.layers} scales={idx.scales} initial={initial} lesson={lessonInfo} currentDay={today} days={days} runCommand={runCommand} />);
}
