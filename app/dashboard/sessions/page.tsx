import type { Metadata } from "next";

import { DashboardChrome } from "@/components/product/dashboard-chrome";
import { PollsAdmin } from "@/components/program/polls-admin";
import { SessionsAdmin } from "@/components/program/sessions-admin";
import { getAdminDashboardContext } from "@/lib/bos-roadmap/admin";
import { daySummaries } from "@/lib/program";
import { nameOf } from "@/lib/explore";
import { SessionRequestModel } from "@/lib/models/session-request";
import { listPolls } from "@/lib/program/session-polls";
import { listSessions } from "@/lib/program/sessions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sessions — Node admin" };

export default async function SessionsPage() {
  const [{ checklist, profile, session }, sessions] = await Promise.all([getAdminDashboardContext(), listSessions()]);
  const [polls, asks] = await Promise.all([listPolls(session.user.id, { admin: true }), SessionRequestModel.find({}, { topic: 1, name: 1 }).sort({ createdAt: -1 }).lean()]);
  /* requests, grouped by role — most asked first */
  const byTopic = new Map<string, string[]>();
  for (const a of asks) byTopic.set(a.topic, [...(byTopic.get(a.topic) ?? []), a.name || "Someone"]);
  const requests = [...byTopic.entries()].map(([topic, names]) => ({
    topic, names, count: names.length, title: nameOf("role", topic.replace(/^role:/, "")),
    hasPoll: polls.some((p) => p.topic === topic && p.status !== "scheduled"),
  })).sort((a, b) => b.count - a.count);
  const days = daySummaries().map((d) => ({ day: d.day, title: d.title, act: d.act.name }));
  return (
    <DashboardChrome activeSection="sessions" checklist={checklist} profile={profile} user={session.user}>
      <div className="grid gap-8">
        <PollsAdmin days={days} initial={polls} requests={requests} />
        {/* remounts when a poll books a session, so the new one shows */}
        <SessionsAdmin key={sessions.map((s) => s.id).join(",")} days={days} initial={sessions} />
      </div>
    </DashboardChrome>
  );
}
