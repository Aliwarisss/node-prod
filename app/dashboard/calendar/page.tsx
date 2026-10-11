import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { FeesPending } from "@/components/product/fees-pending";
import { SessionCalendar } from "@/components/program/session-calendar";
import { authOptions } from "@/lib/auth/options";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, hasAccess } from "@/lib/models/user";
import { buildProfileChecklist, profileOf } from "@/lib/profile";
import { listPolls } from "@/lib/program/session-polls";
import { listSessions } from "@/lib/program/sessions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar — Node" };

/* the live-session schedule: booked sessions and the slots still being voted on */
export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/calendar");
  await connectToDatabase();
  const dbUser = await UserModel.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");
  const profile = profileOf(dbUser);
  const isAdmin = dbUser.role === "admin";
  const [sessions, polls] = hasAccess(dbUser) ? await Promise.all([listSessions(), listPolls(session.user.id, { admin: isAdmin })]) : [[], []];
  return (
    <DashboardChrome activeSection="calendar" checklist={buildProfileChecklist(profile)} profile={profile} user={session.user}>
      {hasAccess(dbUser) ? <SessionCalendar sessions={sessions} polls={polls.filter((p) => p.status !== "scheduled")} isAdmin={isAdmin} /> : <FeesPending />}
    </DashboardChrome>
  );
}
