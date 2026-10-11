import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { ProgressView } from "@/components/program/progress-view";
import { SignInHistory } from "@/components/product/sign-in-history";
import { recentSignIns } from "@/lib/auth/sessions";
import { getAdminDashboardContext } from "@/lib/bos-roadmap/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { GamePanel } from "@/components/program/game-ui";
import { gameOf } from "@/lib/program/gamification";
import { getProgress } from "@/lib/program/progress";
import { standing } from "@/lib/program/ranking";
import { programStats } from "@/lib/program/stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trainee progress — Node admin" };

/* Admin: one trainee's progress — the same view they see, without the links into their days */
export default async function TraineeProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { checklist, profile, session } = await getAdminDashboardContext();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectToDatabase();
  const [user, stats, progress, st, signIns] = await Promise.all([UserModel.findById(id, { name: 1, email: 1 }).lean(), programStats(id), getProgress(id), standing(id, true), recentSignIns(id, 10).catch(() => [])]);
  if (!user) notFound();
  const rank = st.rank;
  const game = gameOf(stats, progress.prefs, st.season);

  return (
    <DashboardChrome activeSection="trainees" checklist={checklist} profile={profile} user={session.user}>
      <div className="grid gap-4">
        <Link href="/dashboard/progress" className="flex items-center gap-1 justify-self-start text-[13px] font-bold text-black/55 hover:text-[var(--primary)]"><MaterialSymbol className="text-[17px]" name="arrow_back" />Program stats</Link>
        <ProgressView stats={stats} who={user.name || user.email} admin />
        <h2 className="pt-2 text-[18px] font-black text-[var(--primary)]">Badges & rewards</h2>
        <GamePanel game={game} rank={rank} />
        <SignInHistory items={signIns} admin userId={id} className="max-w-xl" />
      </div>
    </DashboardChrome>
  );
}
