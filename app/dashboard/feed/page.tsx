import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { FeedView } from "@/components/program/feed-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { daySummaries } from "@/lib/program";
import { listFeed } from "@/lib/program/feed";
import { leaderboard } from "@/lib/program/ranking";
import { upcomingSessions } from "@/lib/program/sessions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feed — Node" };

/* the program's feed — posts, collab calls, and everyone's milestones */
export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const uid = session.user.id, isAdmin = session.user.role === "admin";
  const [dbUser, feed, prefs, board, next] = await Promise.all([
    UserModel.findById(uid).lean(),
    listFeed(uid),
    ProgramProgressModel.findOne({ userId: uid }, { shareAuto: 1 }).lean(),
    leaderboard(uid, isAdmin).catch(() => null),
    upcomingSessions(1).catch(() => []),
  ]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="feed" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      {hasAccess(dbUser) ? (
        <FeedView initial={feed.posts} more={feed.more} me={{ id: profile.id, name: dbUser.name || dbUser.email }} isAdmin={dbUser.role === "admin"} days={daySummaries().map((d) => ({ day: d.day, title: d.title }))} shareAuto={(prefs as { shareAuto?: boolean } | null)?.shareAuto !== false} week={(board?.week ?? []).filter((r) => r.week > 0)} session={next[0] ?? null} />
      ) : <FeesPending />}
    </DashboardChrome>
  );
}
