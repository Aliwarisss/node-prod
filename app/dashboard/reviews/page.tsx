import type { Metadata } from "next";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { ReviewsInbox } from "@/components/product/reviews-inbox";
import { getAdminDashboardContext } from "@/lib/bos-roadmap/admin";
import { listReviews } from "@/lib/program/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews — Node admin" };

export default async function ReviewsPage() {
  const [{ checklist, profile, session }, items] = await Promise.all([getAdminDashboardContext(), listReviews()]);

  return (
    <DashboardChrome activeSection="reviews" checklist={checklist} profile={profile} user={session.user}>
      <ReviewsInbox items={items} />
    </DashboardChrome>
  );
}
