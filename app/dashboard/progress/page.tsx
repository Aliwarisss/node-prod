import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { CohortView } from "@/components/program/cohort-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { cohortStats } from "@/lib/program/stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Progress — Node" };

/* admins: the whole cohort (a trainee's own progress is a tab of their profile) */
export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  /* a trainee's progress lives in their profile now */
  if (session.user.role !== "admin") redirect("/dashboard/profile?tab=progress");
  await connectToDatabase();
  /* the numbers load alongside the account, not after it */
  const cohortLoad = cohortStats().catch(() => null);
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection="progress" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (dbUser.role !== "admin") redirect("/dashboard/profile?tab=progress");
  return chrome(<CohortView c={(await cohortLoad) ?? (await cohortStats())} />);
}
