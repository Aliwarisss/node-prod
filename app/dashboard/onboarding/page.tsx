import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { OnboardingPreview } from "@/components/product/onboarding-preview";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Onboarding preview — Node" };

/* admins: preview the first-sign-in onboarding as a new trainee sees it */
export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  if (dbUser.role !== "admin") redirect("/dashboard");
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="onboarding" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      <OnboardingPreview />
    </DashboardChrome>
  );
}
