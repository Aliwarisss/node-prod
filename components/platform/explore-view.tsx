"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import {
  allRoles, allSkills, allSubjects, domainById, domains, domainsWith, exploreCounts, leadsTo, LEVELS, locate, nameOf, relatedSkills, roleById, roleFolders,
  rolesWithSkill, rolesWithSubject, similarRoles, skillById, skillFolders, stackById, stacks, stacksWithSkill, subjectById, subjectFolders,
  type Kind,
} from "@/lib/explore";
import { flagship } from "@/lib/node-landing-data";
import { flagshipHref } from "@/lib/platform-data";
import { cn } from "@/lib/utils";

import { CareerMap } from "./explore/career-map";
import { MyMapProvider, MyMapTab, StatusPicker } from "./explore/my-map";
import { AskMentor, ProgramLinks, RoadmapSummary, RoleJourney } from "./explore/role-extras";
import { Mono } from "./skill-mono";

export type ExploreTab = "skills" | "roles" | "subjects" | "domains" | "career" | "mine";
export type Open = { kind: Kind; id: string } | null;
export type ExplorerInit = { tab: ExploreTab; open: Open; q: string; folder: string };

const kicker = "font-mono text-[11px] font-bold uppercase tracking-[0.16em]";
const TABS: { id: ExploreTab; label: string; icon: string; n: number }[] = [
  { id: "skills", label: "Skills & stacks", icon: "code", n: exploreCounts.skills },
  { id: "roles", label: "Roles", icon: "badge", n: exploreCounts.roles },
  { id: "subjects", label: "Subjects", icon: "school", n: exploreCounts.subjects },
  { id: "domains", label: "Industries", icon: "public", n: exploreCounts.domains },
  { id: "career", label: "Career map", icon: "hub", n: 0 },
  { id: "mine", label: "My map", icon: "map", n: 0 },
];
const POPULAR: { kind: Kind; id: string }[] = [
  { kind: "role", id: "ai-engineer" }, { kind: "role", id: "fullstack-engineer" }, { kind: "skill", id: "rust" },
  { kind: "skill", id: "typescript" }, { kind: "subject", id: "system-design" }, { kind: "subject", id: "agentic-ai" },
];

/* search: does any of these mention the words? */
const hit = (q: string, ...xs: (string | undefined)[]) => !q || xs.some((x) => x?.toLowerCase().includes(q));

/* an icon for anything: skills show their badge, the rest their folder's icon */
function Icon({ kind, id, size = 40 }: { kind: Kind; id: string; size?: number }) {
  if (kind === "skill") { const k = skillById.get(id); return k ? <Mono k={k} size={size} /> : null; }
  if (kind === "stack") {
    const parts = (stackById.get(id)?.parts ?? []).slice(0, 4).map((p) => skillById.get(p)!).filter(Boolean);
    return <span className="grid shrink-0 grid-cols-2 gap-0.5" style={{ width: size, height: size }}>{parts.map((k) => <Mono key={k.id} k={k} size={Math.round(size / 2) - 1} />)}</span>;
  }
  const where = locate(kind, id);
  const d = kind === "domain" ? domainById.get(id) : undefined;
  const color = d?.color ?? where?.folder.color ?? where?.section.color ?? "#555";
  const icon = d?.icon ?? where?.folder.icon ?? "circle";
  return <span className="flex shrink-0 items-center justify-center rounded-[28%]" style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 14%, white)`, color }}><MaterialSymbol style={{ fontSize: size * 0.52 }} name={icon} /></span>;
}

/* Explore: a map of computer science — skills and stacks, roles, subjects and industries, each linked to the others */
export function ExploreView({ init }: { init: ExplorerInit }) {
  const [tab, setTab] = useState<ExploreTab>(init.tab);
  const [open, setOpen] = useState<Open>(init.open);
  const [q, setQ] = useState(init.q);
  const [folder, setFolder] = useState(init.folder || "all");
  const [freshers, setFreshers] = useState(false);
  const needle = q.trim().toLowerCase();
  const pick = (t: ExploreTab) => { setTab(t); setFolder("all"); };

  /* keep the address in step, so a role or skill can be shared */
  useEffect(() => {
    const p = new URLSearchParams();
    if (tab !== "skills") p.set("tab", tab);
    if (folder !== "all") p.set("folder", folder);
    if (open) p.set("open", `${open.kind}:${open.id}`);
    if (needle) p.set("q", q.trim());
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [tab, folder, open, needle, q]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const found = useMemo(() => ({
    skills: allSkills.filter((x) => hit(needle, x.name, x.line, x.type)),
    stacks: stacks.filter((x) => hit(needle, x.name, x.line, ...x.parts.map((p) => skillById.get(p)?.name))),
    roles: allRoles.filter((r) => hit(needle, r.name, r.line, ...r.does)),
    subjects: allSubjects.filter((x) => hit(needle, x.name, x.line, ...x.topics)),
    domains: domains.filter((d) => hit(needle, d.name, d.line, ...d.examples)),
  }), [needle]);
  const counts: Record<ExploreTab, number> = { skills: found.skills.length, roles: found.roles.length, subjects: found.subjects.length, domains: found.domains.length, career: 0, mine: 0 };
  const folders = tab === "skills" ? skillFolders : tab === "roles" ? roleFolders : tab === "subjects" ? subjectFolders : [];

  return (
    <MyMapProvider>
    <main className="min-h-screen bg-[#f8f9fa] text-[#0d1117]">
      {/* hero */}
      <header className="relative isolate overflow-hidden bg-[#0d1117] px-4 pb-12 pt-32 text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <span className="absolute -left-24 top-10 -z-10 size-96 rounded-full bg-[#e91e63]/25 blur-3xl" aria-hidden />
        <span className="absolute -right-24 bottom-0 -z-10 size-96 rounded-full bg-[#4fd1c5]/15 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-5">
          <nav className="flex items-center gap-1 text-[13px] text-white/50" aria-label="Breadcrumb"><Link href="/" className="hover:text-white">Node</Link><MaterialSymbol className="text-[16px]" name="chevron_right" /><span className="text-white/80">Explore</span></nav>
          <span className={cn(kicker, "text-[#4fd1c5]")}>Explore computer science</span>
          <h1 className="font-heading text-[clamp(2.4rem,6vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">Find where <span className="text-[#e91e63]">you fit.</span></h1>
          <p className="max-w-2xl text-[17px] leading-7 text-white/65">The languages and tools, the roles, the subjects and the industries — a map of the field. Open any role to see the skills it uses; open any skill to see who uses it.</p>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {TABS.filter((t) => t.n).map((t) => (
              <li key={t.id}><button type="button" onClick={() => pick(t.id)} className="grid w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-white/25"><b className="font-heading text-[28px] font-black leading-none">{t.n}</b><span className="text-[12.5px] font-semibold text-white/55">{t.id === "skills" ? "skills & tools" : t.label.toLowerCase()}</span></button></li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[13px] text-white/55">
            <span>Popular:</span>
            {POPULAR.map((p) => <button key={`${p.kind}:${p.id}`} type="button" onClick={() => setOpen(p)} className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white/80 hover:border-white/40 hover:text-white">{nameOf(p.kind, p.id)}</button>)}
          </div>
        </div>
      </header>

      {/* tabs and search */}
      <div className="sticky top-[70px] z-30 border-b border-black/[0.06] bg-[#f8f9fa]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-black/[0.05] p-1" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => pick(t.id)} className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors", tab === t.id ? "bg-white text-[#0d1117] shadow-sm" : "text-black/55 hover:text-black")}>
                <MaterialSymbol className="text-[16px]" name={t.icon} />{t.label}{t.n ? <span className="text-[11.5px] opacity-50">{needle ? counts[t.id] : t.n}</span> : null}
              </button>
            ))}
          </nav>
          <label className={cn("h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 focus-within:border-[#007373]", tab === "career" || tab === "mine" ? "hidden" : "flex")}>
            <MaterialSymbol className="text-[19px] text-black/40" name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — Rust, AI engineer, operating systems, fintech…" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none" />
            {q ? <button type="button" onClick={() => setQ("")} aria-label="Clear the search" className="text-black/40"><MaterialSymbol className="text-[18px]" name="close" /></button> : null}
          </label>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        {/* folder chips */}
        {folders.length ? (
          <div className="-mb-4 flex flex-wrap gap-1.5">
            {[{ id: "all", name: "All", icon: "apps" }, ...folders].map((f) => (
              <button key={f.id} type="button" onClick={() => setFolder(f.id)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors", folder === f.id ? "bg-[#0d1117] text-white" : "bg-white text-black/60 ring-1 ring-black/[0.08] hover:ring-black/20")}>
                <MaterialSymbol className="text-[15px]" name={f.icon} />{f.name}
              </button>
            ))}
            {tab === "roles" ? <button type="button" onClick={() => setFreshers(!freshers)} aria-pressed={freshers} className={cn("ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold", freshers ? "bg-[#007373] text-white" : "bg-white text-black/60 ring-1 ring-black/[0.08]")}><MaterialSymbol className="text-[15px]" name={freshers ? "check_circle" : "radio_button_unchecked"} />Fresher-friendly only</button> : null}
          </div>
        ) : null}

        {tab === "skills" ? (
          <>
            {skillFolders.filter((f) => folder === "all" || f.id === folder).map((f) => {
              const list = found.skills.filter((x) => x.folder === f.id);
              if (!list.length) return null;
              return (
                <section key={f.id} className="grid gap-3">
                  <Heading icon={f.icon} name={f.name} line={f.line} />
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((x) => {
                      const n = rolesWithSkill(x.id).length;
                      return (
                        <button key={x.id} type="button" onClick={() => setOpen({ kind: "skill", id: x.id })} className="group flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_14px_30px_-20px_rgba(13,17,23,.4)]">
                          <Mono k={x} />
                          <span className="grid min-w-0 gap-0.5"><b className="text-[14.5px]">{x.name}</b><span className="line-clamp-2 text-[12.5px] leading-5 text-black/55">{x.line}</span><span className="pt-0.5 text-[11.5px] font-semibold text-[#007373]">{LEVELS.skill[x.level]}{n ? ` · ${n} role${n === 1 ? "" : "s"}` : ""}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {found.stacks.length && folder === "all" ? (
              <section className="grid gap-3 rounded-[26px] bg-[#0d1117] p-5 text-white sm:p-6" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
                <span className="flex items-baseline gap-2"><b className="font-heading text-[19px] font-black uppercase tracking-[-0.02em]">Popular stacks</b><span className="text-[13px] text-white/50">Skills that are used together.</span></span>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {found.stacks.map((st) => (
                    <div key={st.id} className="grid content-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <button type="button" onClick={() => setOpen({ kind: "stack", id: st.id })} className="grid text-left"><b className="text-[15px] hover:underline">{st.name}</b><span className="text-[12.5px] text-white/55">{st.line}</span></button>
                      <span className="flex flex-wrap gap-1.5">
                        {st.parts.map((p) => { const k = skillById.get(p)!; return <button key={p} type="button" onClick={() => setOpen({ kind: "skill", id: p })} className="flex items-center gap-1.5 rounded-full bg-white/[0.06] py-1 pl-1 pr-2.5 text-[12px] font-semibold text-white/85 hover:bg-white/[0.12]"><Mono k={k} size={20} />{k.name}</button>; })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {!found.skills.length && !found.stacks.length ? <Empty q={q} /> : null}
          </>
        ) : null}

        {tab === "roles" ? (
          found.roles.length ? roleFolders.filter((f) => folder === "all" || f.id === folder).map((f) => {
            const list = found.roles.filter((r) => r.folder === f.id && (!freshers || r.fresher));
            if (!list.length) return null;
            return (
              <section key={f.id} className="grid gap-3" style={{ "--c": f.color } as CSSProperties}>
                <span className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: f.color }}><MaterialSymbol className="text-[19px]" name={f.icon} /></span><b className="font-heading text-[19px] font-black uppercase tracking-[-0.02em]">{f.name}</b><span className="hidden text-[13px] text-black/50 sm:inline">{f.line}</span></span>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((r) => (
                    <button key={r.id} type="button" onClick={() => setOpen({ kind: "role", id: r.id })} className="group grid content-start gap-2.5 rounded-2xl border border-black/[0.06] border-t-[3px] border-t-[var(--c)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(13,17,23,.4)]">
                      <span className="flex items-start justify-between gap-2"><b className="text-[15.5px]">{r.name}</b>{r.fresher ? <span className="shrink-0 rounded-full bg-[#e6f3f3] px-2 py-0.5 text-[10.5px] font-bold text-[#005a5a]">Fresher-friendly</span> : <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10.5px] font-bold text-black/45">Experienced</span>}</span>
                      <span className="text-[12.5px] leading-5 text-black/60">{r.line}</span>
                      <span className="flex flex-wrap items-center gap-1">{r.skills.slice(0, 7).map((x) => <Mono key={x} k={skillById.get(x)!} size={24} />)}{r.skills.length > 7 ? <span className="pl-1 text-[11.5px] font-semibold text-black/40">+{r.skills.length - 7}</span> : null}</span>
                      <span className="text-[11.5px] font-semibold text-black/40">{r.subjects.length} subjects · see the path →</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          }) : <Empty q={q} />
        ) : null}

        {tab === "subjects" ? (
          found.subjects.length ? (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {subjectFolders.filter((a) => folder === "all" || a.id === folder).map((a) => {
                const list = found.subjects.filter((x) => x.folder === a.id);
                if (!list.length) return null;
                return (
                  <section key={a.id} className="grid content-start gap-2 rounded-[22px] border border-black/[0.06] bg-white p-5" style={{ "--c": a.color } as CSSProperties}>
                    <span className="flex items-center gap-2.5 pb-1"><span className="flex size-9 items-center justify-center rounded-xl text-[var(--c)]" style={{ background: `color-mix(in srgb, ${a.color} 13%, transparent)` }}><MaterialSymbol className="text-[19px]" name={a.icon} /></span><span className="grid"><b className="font-heading text-[17px] font-black uppercase tracking-[-0.02em]">{a.name}</b><span className="text-[12.5px] text-black/50">{a.line}</span></span></span>
                    {list.map((x) => (
                      <button key={x.id} type="button" onClick={() => setOpen({ kind: "subject", id: x.id })} className="group grid gap-1 rounded-xl border border-black/[0.06] px-3.5 py-3 text-left transition-colors hover:border-[var(--c)]/40 hover:bg-[#fafbfb]">
                        <span className="flex items-center justify-between gap-2"><b className="text-[14px]">{x.name}</b><span className="shrink-0 text-[11.5px] font-semibold text-black/40">{LEVELS.subject[x.level]}</span></span>
                        <span className="text-[12.5px] leading-5 text-black/55">{x.line}</span>
                        <span className="flex flex-wrap gap-1 pt-0.5">{x.topics.slice(0, 4).map((t) => <span key={t} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-black/55">{t}</span>)}</span>
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          ) : <Empty q={q} />
        ) : null}

        {tab === "domains" ? (
          found.domains.length ? (
            <section className="grid gap-3">
              <Heading icon="public" name="Industries" line="Where software gets built — and who builds it there." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {found.domains.map((d) => (
                  <button key={d.id} type="button" onClick={() => setOpen({ kind: "domain", id: d.id })} className="group grid content-start gap-2.5 rounded-2xl border border-black/[0.06] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(13,17,23,.4)]">
                    <span className="flex items-center gap-3"><Icon kind="domain" id={d.id} size={42} /><b className="text-[15.5px]">{d.name}</b></span>
                    <span className="text-[12.5px] leading-5 text-black/60">{d.line}</span>
                    <span className="flex flex-wrap gap-1">{d.examples.map((e) => <span key={e} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-black/55">{e}</span>)}</span>
                    <span className="text-[11.5px] font-semibold text-black/40">{d.roles.length} roles in demand →</span>
                  </button>
                ))}
              </div>
            </section>
          ) : <Empty q={q} />
        ) : null}

        {tab === "career" ? <CareerMap onOpen={setOpen} /> : null}
        {tab === "mine" ? <MyMapTab onOpen={setOpen} /> : null}

        {/* from map to journey */}
        <section className="grid items-center gap-4 rounded-[28px] border-2 border-[#e91e63]/30 bg-white p-6 sm:grid-cols-[1fr_auto] sm:p-8">
          <div className="grid gap-1.5"><span className={cn(kicker, "text-[#e91e63]")}>Not sure where you fit?</span><b className="font-heading text-[clamp(1.4rem,2.6vw,2rem)] font-black uppercase leading-none tracking-[-0.03em]">Taste it first — then build for real.</b><span className="max-w-xl text-[14px] text-black/55">Hello, World lets you try each corner of the field before you choose. {flagship.name} has you build a real app end to end, with AI agents as your team.</span></div>
          <div className="flex flex-wrap gap-2"><Link href={flagshipHref} className="rounded-full bg-[#e91e63] px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25">{flagship.name}</Link><Link href="/programs" className="rounded-full border border-black/15 px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em]">All programs</Link></div>
        </section>
      </div>

      <Detail open={open} onOpen={setOpen} />
    </main>
    </MyMapProvider>
  );
}

function Heading({ icon, name, line }: { icon: string; name: string; line: string }) {
  return <span className="flex items-baseline gap-2"><MaterialSymbol className="translate-y-[3px] text-[20px] text-black/40" name={icon} /><b className="font-heading text-[19px] font-black uppercase tracking-[-0.02em]">{name}</b><span className="text-[13px] text-black/50">{line}</span></span>;
}

function Empty({ q }: { q: string }) {
  return <p className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-[13.5px] text-black/45">Nothing matches “{q}” here — try another tab.</p>;
}

/* the side panel: one skill, role, subject, stack or industry — and everything it connects to */
function Detail({ open, onOpen }: { open: Open; onOpen: (o: Open) => void }) {
  const chip = (kind: Kind, id: string) => (
    <button key={`${kind}:${id}`} type="button" onClick={() => onOpen({ kind, id })} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white py-1 pl-1 pr-3 text-[12.5px] font-semibold hover:border-black/30">
      <Icon kind={kind} id={id} size={20} />{nameOf(kind, id)}
    </button>
  );
  const tag = (t: string) => <span key={t} className="rounded-full bg-[#f6f7f8] px-3 py-1 text-[12.5px] font-semibold">{t}</span>;
  let label = "", line = "", body: ReactNode = null;

  if (open?.kind === "skill") {
    const k = skillById.get(open.id);
    if (k) {
      const roles = rolesWithSkill(k.id), rel = relatedSkills(k.id), inStacks = stacksWithSkill(k.id), doms = domainsWith("skill", k.id);
      label = `${locate("skill", k.id)?.folder.name ?? "Skill"} · ${k.type}`; line = k.line;
      body = (
        <>
          <Badges items={[LEVELS.skill[k.level], `${roles.length} role${roles.length === 1 ? "" : "s"} use it`]} />
          <Block title="On my map" stack><StatusPicker kind="skill" id={k.id} /></Block>
          <ProgramLinks kind="skill" id={k.id} />
          {roles.length ? <Block title="Used by these roles">{roles.map((r) => chip("role", r.id))}</Block> : null}
          {rel.length ? <Block title="Often used with">{rel.map((x) => chip("skill", x.id))}</Block> : null}
          {inStacks.length ? <Block title="Part of these stacks">{inStacks.map((x) => chip("stack", x.id))}</Block> : null}
          {doms.length ? <Block title="Big in">{doms.map((x) => chip("domain", x.id))}</Block> : null}
        </>
      );
    }
  } else if (open?.kind === "role") {
    const r = roleById.get(open.id);
    if (r) {
      const f = locate("role", r.id)?.folder, color = f?.color ?? "#e91e63", sim = similarRoles(r.id), doms = domainsWith("role", r.id);
      label = f?.name ?? "Role"; line = r.line;
      body = (
        <>
          <Badges items={[r.fresher ? "Open to freshers" : "Usually needs experience first"]} tone={r.fresher ? "teal" : "amber"} />
          <Block title="What they do" stack>{r.does.map((d) => <span key={d} className="flex gap-2 text-[14px]"><MaterialSymbol className="mt-0.5 text-[17px]" style={{ color }} name="check_circle" />{d}</span>)}</Block>
          <Block title="Skills & tools">{r.skills.map((x) => chip("skill", x))}</Block>
          <Block title="Subjects to know">{r.subjects.map((x) => chip("subject", x))}</Block>
          <Block title="Career path"><span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">{r.path.split("→").map((step, i, all) => <span key={step} className="flex items-center gap-1.5"><span className="rounded-lg bg-[#f6f7f8] px-2.5 py-1">{step.trim()}</span>{i < all.length - 1 ? <MaterialSymbol className="text-[15px] text-black/30" name="arrow_forward" /> : null}</span>)}</span></Block>
          <Block title="How people get in" stack><p className="rounded-2xl bg-[#f6f7f8] p-3.5 text-[13.5px] leading-6 text-black/70">{r.entry}</p></Block>
          <RoadmapSummary roleId={r.id} />
          <RoleJourney />
          <AskMentor roleId={r.id} />
          {sim.length ? <Block title="Similar roles">{sim.map((x) => chip("role", x.id))}</Block> : null}
          {doms.length ? <Block title="Industries">{doms.map((x) => chip("domain", x.id))}</Block> : null}
        </>
      );
    }
  } else if (open?.kind === "subject") {
    const x = subjectById.get(open.id);
    if (x) {
      const roles = rolesWithSubject(x.id), next = leadsTo(x.id), doms = domainsWith("subject", x.id);
      label = locate("subject", x.id)?.folder.name ?? "Subject"; line = x.line;
      body = (
        <>
          <Badges items={[LEVELS.subject[x.level], `${roles.length} role${roles.length === 1 ? "" : "s"} need it`]} />
          <Block title="On my map" stack><StatusPicker kind="subject" id={x.id} /></Block>
          <ProgramLinks kind="subject" id={x.id} />
          <Block title="Key topics">{x.topics.map(tag)}</Block>
          {x.first?.length ? <Block title="Learn first">{x.first.map((id) => chip("subject", id))}</Block> : null}
          {next.length ? <Block title="Leads to">{next.map((y) => chip("subject", y.id))}</Block> : null}
          {roles.length ? <Block title="Needed by these roles">{roles.map((r) => chip("role", r.id))}</Block> : null}
          {doms.length ? <Block title="Big in">{doms.map((d) => chip("domain", d.id))}</Block> : null}
        </>
      );
    }
  } else if (open?.kind === "stack") {
    const st = stackById.get(open.id);
    if (st) {
      const users = allRoles.filter((r) => st.parts.filter((p) => r.skills.includes(p)).length >= Math.ceil(st.parts.length / 2));
      label = "Stack"; line = st.line;
      body = (
        <>
          <Block title="What's in it" stack>{st.parts.map((p) => { const k = skillById.get(p)!; return <button key={p} type="button" onClick={() => onOpen({ kind: "skill", id: p })} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] p-2.5 text-left hover:border-black/25"><Mono k={k} size={34} /><span className="grid min-w-0"><b className="text-[14px]">{k.name}</b><span className="truncate text-[12px] text-black/50">{k.line}</span></span></button>; })}</Block>
          {users.length ? <Block title="Roles that work in it">{users.map((r) => chip("role", r.id))}</Block> : null}
        </>
      );
    }
  } else if (open?.kind === "domain") {
    const d = domainById.get(open.id);
    if (d) {
      label = "Industry"; line = d.line;
      body = (
        <>
          <Block title="What gets built">{d.examples.map(tag)}</Block>
          <Block title="Roles in demand">{d.roles.map((r) => chip("role", r))}</Block>
          <Block title="Common skills">{d.skills.map((x) => chip("skill", x))}</Block>
          <Block title="Subjects that matter">{d.subjects.map((x) => chip("subject", x))}</Block>
        </>
      );
    }
  }

  return (
    <>
      <div className={cn("fixed inset-0 z-[110] bg-[#0d1117]/30 backdrop-blur-[2px] transition-opacity", body ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => onOpen(null)} aria-hidden />
      <aside className={cn("fixed bottom-0 right-0 top-[var(--nb,0px)] z-[120] flex w-[min(480px,100vw)] flex-col bg-white shadow-[-30px_0_80px_-30px_rgba(13,17,23,.45)] transition-transform duration-300", body ? "translate-x-0" : "translate-x-full")} aria-hidden={!body} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3"><span className={cn(kicker, "truncate text-black/40")}>{label}</span><button type="button" onClick={() => onOpen(null)} aria-label="Close" className="flex size-9 items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button></div>
        {body && open ? (
          <div className="grid flex-1 content-start gap-6 overflow-y-auto p-6">
            <span className="flex items-center gap-4"><Icon kind={open.kind} id={open.id} size={60} /><b className="font-heading text-[26px] font-black uppercase leading-none tracking-[-0.03em]">{nameOf(open.kind, open.id)}</b></span>
            <p className="-mt-2 text-[15px] leading-6 text-black/70">{line}</p>
            {body}
          </div>
        ) : null}
      </aside>
    </>
  );
}

function Badges({ items, tone }: { items: string[]; tone?: "teal" | "amber" }) {
  return <span className="-mt-2 flex flex-wrap gap-1.5">{items.map((t, i) => <span key={t} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-bold", i === 0 && tone === "teal" ? "bg-[#e6f3f3] text-[#005a5a]" : i === 0 && tone === "amber" ? "bg-[#fff4e5] text-[#8a5a00]" : "bg-black/[0.05] text-black/55")}>{t}</span>)}</span>;
}

function Block({ title, children, stack }: { title: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className="grid gap-2.5">
      <span className={cn(kicker, "text-black/45")}>{title}</span>
      <div className={stack ? "grid gap-2" : "flex flex-wrap gap-1.5"}>{children}</div>
    </div>
  );
}
