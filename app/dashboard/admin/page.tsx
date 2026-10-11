import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AdminPanelHome, type PanelStats } from "@/components/product/admin-panel-home";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { CertificateModel } from "@/lib/models/certificate";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel } from "@/lib/models/user";
import { boardCounts } from "@/lib/program/board";
import { upcomingSessions } from "@/lib/program/sessions";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { DEFAULT_BANNER, readBanner } from "@/lib/site-banner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin panel — Node" };

const WEEK = 7 * 24 * 60 * 60 * 1000;

/* the numbers on the panel */
async function loadStats(): Promise<PanelStats> {
  const trainee = { role: { $ne: "admin" } };
  const [trainees, paid, onboarded, joinedWeek, waiting, board, sessions, certificates, referred] = await Promise.all([
    UserModel.countDocuments(trainee),
    UserModel.countDocuments({ ...trainee, paymentStatus: "paid" }),
    UserModel.countDocuments({ ...trainee, onboardingCompleted: true }),
    UserModel.countDocuments({ ...trainee, createdAt: { $gte: new Date(Date.now() - WEEK) } }),
    SubmissionModel.countDocuments({ status: "submitted" }),
    boardCounts(),
    upcomingSessions(50),
    CertificateModel.countDocuments({}),
    UserModel.countDocuments({ ...trainee, referredBy: { $nin: [null, ""] } }),
  ]);
  const next = sessions[0];
  const nextSession = next ? `Day ${next.day} · ${next.title} · ${new Date(next.startsAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : null;
  return { trainees, paid, onboarded, joinedWeek, waiting, unanswered: board.unanswered, upcoming: sessions.length, nextSession, certificates, referred };
}

/* the admin panel's home: what needs an admin now, and every admin tool with its numbers */
export default async function AdminPanelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  if (dbUser.role !== "admin") redirect("/dashboard");
  const [stats, banner] = await Promise.all([loadStats(), readBanner()]);
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="admin" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      <AdminPanelHome adminName={profile.name ?? ""} stats={stats} banner={banner} bannerDefault={DEFAULT_BANNER} />
    </DashboardChrome>
  );
}
