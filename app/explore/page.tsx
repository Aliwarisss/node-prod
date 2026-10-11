import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { ExploreView, type ExploreTab, type ExplorerInit } from "@/components/platform/explore-view";
import { ExploreLocked } from "@/components/platform/explore-locked";
import { SiteHeader } from "@/components/platform/site-header";
import { authOptions } from "@/lib/auth/options";
import { exists, roleFolders, skillFolders, subjectFolders, type Kind } from "@/lib/explore";

export const metadata: Metadata = {
  title: "Explore computer science — skills, roles, subjects and industries · Node",
  description: "A map of computer science: languages, frameworks and tools; the roles people work in; the subjects behind them; and the industries they build for — each linked to the others.",
};

const KINDS: Kind[] = ["skill", "stack", "role", "subject", "domain"];
const TAB_OF: Record<string, ExploreTab> = { skills: "skills", stacks: "skills", skill: "skills", stack: "skills", roles: "roles", role: "roles", subjects: "subjects", subject: "subjects", domains: "domains", domain: "domains", career: "career", mine: "mine" };
const FOLDERS: Record<ExploreTab, string[]> = { skills: skillFolders.map((f) => f.id), roles: roleFolders.map((f) => f.id), subjects: subjectFolders.map((f) => f.id), domains: [], career: [], mine: [] };

/* ?tab=roles&folder=ai · ?path=skills/languages (menu links) · ?open=role:ai-engineer · ?q=rust */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, session] = await Promise.all([searchParams, getServerSession(authOptions)]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  /* Explore is for members (free): visitors get a preview and a way in that brings them back here */
  if (!session?.user) {
    const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (v === undefined ? [] : [[k, one(v)]]))).toString();
    return (
      <>
        <SiteHeader />
        <ExploreLocked next={`/explore${qs ? `?${qs}` : ""}`} />
      </>
    );
  }

  const [kind, ...rest] = one(sp.open).split(":");
  const id = rest.join(":");
  const open = KINDS.includes(kind as Kind) && id && exists(kind as Kind, id) ? { kind: kind as Kind, id } : null;

  const [p0, p1] = one(sp.path).split("/");
  const tab: ExploreTab = TAB_OF[one(sp.tab)] ?? TAB_OF[p0] ?? (open ? TAB_OF[open.kind] : undefined) ?? "skills";
  const askedFolder = one(sp.folder) || p1 || "";
  const folder = FOLDERS[tab].includes(askedFolder) ? askedFolder : "all";

  const init: ExplorerInit = { tab, open, folder, q: one(sp.q).slice(0, 60) };
  return (
    <>
      <SiteHeader />
      <ExploreView key={`${tab}|${folder}|${one(sp.open)}|${init.q}`} init={init} />
    </>
  );
}
