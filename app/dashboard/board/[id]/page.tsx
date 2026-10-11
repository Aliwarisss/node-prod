import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { ThreadPage } from "@/components/program/board-view";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { getThread } from "@/lib/program/board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Board — Node" };

export default async function ThreadRoute({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await connectToDatabase();
  const { id } = await params;
  const [dbUser, data] = await Promise.all([UserModel.findById(session.user.id).lean(), getThread(id, session.user.id)]);
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const chrome = (c: React.ReactNode) => <DashboardChrome activeSection="board" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>{c}</DashboardChrome>;
  if (!hasAccess(dbUser)) return chrome(<FeesPending />);
  if (!data) notFound();
  return chrome(<ThreadPage key={data.thread.id} initial={data} isAdmin={dbUser.role === "admin"} me={dbUser.name || dbUser.email} />);
}
