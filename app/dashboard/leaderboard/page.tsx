import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { LeaderboardView } from "@/components/program/leaderboard-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { leaderboard } from "@/lib/program/ranking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leaderboard — Node" };

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const isAdmin = session.user.role === "admin";
  const [dbUser, board] = await Promise.all([UserModel.findById(session.user.id).lean(), leaderboard(session.user.id, isAdmin)]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="leaderboard" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      {hasAccess(dbUser) ? <LeaderboardView all={board.all} week={board.week} me={profile.id} isAdmin={dbUser.role === "admin"} seasons={board.seasons} /> : <FeesPending />}
    </DashboardChrome>
  );
}
