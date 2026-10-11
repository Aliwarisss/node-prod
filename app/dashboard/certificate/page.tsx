import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { CertificateAdmin } from "@/components/program/certificate-admin";
import { CertificateCenter } from "@/components/program/certificate-center";
import { authOptions } from "@/lib/auth/options";
import { certificateStatus, LAST_DAY, listCertificates } from "@/lib/certificate";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My certificate — Node" };

export default async function CertificatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const isAdmin = dbUser.role === "admin";
  const chrome = (children: React.ReactNode) => (
    <DashboardChrome activeSection={isAdmin ? "certificates" : "roadmap"} checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{children}</DashboardChrome>
  );
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);
  /* the site's address, for the verify link printed on the certificate */
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "localhost"}`;
  /* admins: preview and test it, and see every certificate issued */
  if (isAdmin) return chrome(<CertificateAdmin issued={await listCertificates()} origin={origin} adminName={profile.name ?? ""} />);
  const status = await certificateStatus(profile.id);
  return chrome(<CertificateCenter status={status} name={profile.name ?? ""} origin={origin} totalDays={LAST_DAY + 1} />);
}
