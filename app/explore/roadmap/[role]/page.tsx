import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { RoadmapView } from "@/components/platform/explore/roadmap-view";
import { ExploreLocked } from "@/components/platform/explore-locked";
import { SiteHeader } from "@/components/platform/site-header";
import { authOptions } from "@/lib/auth/options";
import { roleById } from "@/lib/explore";
import { roleRoadmap } from "@/lib/explore/roadmap";

/* members only — it depends on who's signed in */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const r = roleById.get(role);
  if (!r) return { title: "Roadmap · Node" };
  const plan = roleRoadmap(role)!;
  return { title: `How to become a ${r.name} — learning roadmap · Node`, description: `${plan.steps.length} steps in ${plan.stages.length} stages, about ${plan.months} months: the subjects and skills to become a ${r.name}, in order.` };
}

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const r = roleById.get(role);
  if (!r) notFound();
  /* visitors: what this roadmap is, and the way in */
  if (!(await getServerSession(authOptions))?.user) {
    const plan = roleRoadmap(role)!;
    return (
      <>
        <SiteHeader />
        <ExploreLocked next={`/explore/roadmap/${role}`} kickerText="Learning roadmap" title={`How to become ${/^[aeiou]/i.test(r.name) ? "an" : "a"} ${r.name}.`} line={r.line}
          facts={[[String(plan.steps.length), "steps"], [`~${plan.months}`, "months at 10 h/week"], [String(plan.stages.length), "stages"]]} />
      </>
    );
  }
  return (
    <>
      <SiteHeader />
      <RoadmapView roleId={role} />
    </>
  );
}
