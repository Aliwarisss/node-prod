import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { PricingEditor } from "@/components/product/pricing-editor";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";
import { readPricing } from "@/lib/pricing-store";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing — Node" };

/* Admin: what the site sells and for how much — packages, prices, discounts and promotions, with a live preview */
export default async function PricingAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/pricing");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  if (dbUser.role !== "admin") redirect("/dashboard");
  const config = await readPricing();
  const profile = profileOf(dbUser);
  return (
    <DashboardChrome activeSection="pricing" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      <PricingEditor initial={config} />
    </DashboardChrome>
  );
}
