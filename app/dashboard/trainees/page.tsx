import type { Metadata } from "next";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { TraineesTable } from "@/components/product/trainees-table";
import { listTrainees } from "@/lib/admin-stats";
import { getAdminDashboardContext } from "@/lib/bos-roadmap/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Trainees — Node admin" };

export default async function TraineesPage() {
  const { checklist, profile, session } = await getAdminDashboardContext();
  const rows = await listTrainees();

  return (
    <DashboardChrome activeSection="trainees" checklist={checklist} profile={profile} user={session.user}>
      <TraineesTable rows={rows} />
    </DashboardChrome>
  );
}
