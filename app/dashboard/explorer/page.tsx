import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ExplorerApp } from "@/components/platform/explore/explorer-app";
import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explorer — your roadmap · Node" };

/* Explorer in the dashboard: pick a goal, see the road to it drawn out, and mark your way along it */
export default async function ExplorerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/explorer");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="explorer" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      <ExplorerApp />
    </DashboardChrome>
  );
}
