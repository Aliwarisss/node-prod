import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import type { ChecklistSummary } from "@/components/product/dashboard-types";
import { ProfileStudio } from "@/components/product/profile-studio";
import { authOptions } from "@/lib/auth/options";
import { recentSignIns } from "@/lib/auth/sessions";
import { domainById, roleById } from "@/lib/explore";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { gameOf, skillTree } from "@/lib/program/gamification";
import { getProgress } from "@/lib/program/progress";
import { standing } from "@/lib/program/ranking";
import { programStats, SKILLS } from "@/lib/program/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile — Node" };

const TABS = ["overview", "progress", "tree", "badges"] as const;

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((t) => t === tab) ?? "overview";
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  /* a trainee's numbers load alongside their account, not after it */
  const statsLoad = session.user.role !== "admin" ? programStats(session.user.id).catch(() => null) : null;
  const standingLoad = session.user.role !== "admin" ? standing(session.user.id).catch(() => null) : null;
  const dbUser = await UserModel.findById(session.user.id).lean();

  if (!dbUser) {
    redirect("/login");
  }

  const profile = profileOf(dbUser);

  const checklist: ChecklistSummary = buildProfileChecklist(profile);
  /* a trainee's program numbers, once the program is open to them */
  const stats = dbUser.role !== "admin" && hasAccess(dbUser) ? await (statsLoad ?? programStats(profile.id)) : null;
  const created = (dbUser as { createdAt?: Date }).createdAt;
  const joined = created ? new Date(created).toISOString() : null;
  /* their game — level, title, badges, rewards — and their place on the leaderboard */
  const [progress, st] = stats ? await Promise.all([getProgress(profile.id), standingLoad]) : [null, null];
  const rank = st?.rank ?? null;
  const game = stats ? gameOf(stats, progress?.prefs, st?.season ?? null) : null;
  const tree = stats ? skillTree(stats, SKILLS.map((k) => ({ key: k.key, label: k.label, icon: k.icon }))) : null;

  return (
    <DashboardChrome
      activeSection="profile"
      checklist={checklist}
      profile={profile}
      user={session.user}
    >
      <ProfileStudio checklist={checklist} profile={profile} stats={stats} joined={joined} game={game} rank={rank} tree={tree} initialTab={initialTab}
        direction={{ role: roleById.get(profile.targetRole ?? "")?.name ?? null, interests: (profile.interests ?? []).map((i) => domainById.get(i)?.name ?? i) }}
        signIns={await recentSignIns(profile.id).catch(() => [])} />
    </DashboardChrome>
  );
}
