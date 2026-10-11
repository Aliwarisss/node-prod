"use client";

import Link from "next/link";
import { type CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { locate, roleById, similarRoles, skillById, subjectById } from "@/lib/explore";
import { coverageFor } from "@/lib/explore/programs";
import { HOURS_PER_WEEK, roleMatch, roleRoadmap, type Step } from "@/lib/explore/roadmap";
import { cn } from "@/lib/utils";

import { Mono } from "../skill-mono";
import { MyMapProvider, Ring, StatusPicker, useMyMap } from "./my-map";
import { AskMentor, RoleJourney } from "./role-extras";

const kicker = "font-mono text-[11px] font-bold uppercase tracking-[0.16em]";
const STAGE_COLOR = { 1: "#007373", 2: "#6d48d8", 3: "#e91e63" } as const;

/* A role's learning roadmap — numbered steps in three stages, with time estimates, where Node teaches each, and
   (signed in) your own progress on every step. */
export function RoadmapView({ roleId }: { roleId: string }) {
  return <MyMapProvider><Roadmap roleId={roleId} /></MyMapProvider>;
}

function Roadmap({ roleId }: { roleId: string }) {
  const role = roleById.get(roleId)!;
  const plan = roleRoadmap(roleId)!;
  const map = useMyMap();
  const folder = locate("role", roleId)?.folder;
  const color = folder?.color ?? "#e91e63";
  const done = (st: Step) => !!map?.signedIn && (st.options ?? [st.id]).some((o) => map.items[`${st.kind}:${o}`] === "know");
  const doneCount = plan.steps.filter(done).length;
  const match = map?.signedIn ? roleMatch(roleId, map.items) : null;
  const isTarget = map?.target === roleId;

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#0d1117]">
      <header className="relative isolate overflow-hidden bg-[#0d1117] px-4 pb-12 pt-32 text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <span className="absolute -left-24 top-10 -z-10 size-96 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${color} 30%, transparent)` }} aria-hidden />
        <div className="mx-auto grid max-w-5xl gap-5">
          <nav className="flex flex-wrap items-center gap-1 text-[13px] text-white/50" aria-label="Breadcrumb"><Link href="/" className="hover:text-white">Node</Link><MaterialSymbol className="text-[16px]" name="chevron_right" /><Link href="/explore?tab=roles" className="hover:text-white">Explore</Link><MaterialSymbol className="text-[16px]" name="chevron_right" /><Link href={`/explore?open=role:${roleId}`} className="hover:text-white">{role.name}</Link><MaterialSymbol className="text-[16px]" name="chevron_right" /><span className="text-white/80">Roadmap</span></nav>
          <span className={cn(kicker, "text-[#4fd1c5]")}>Learning roadmap · {folder?.name}</span>
          <h1 className="font-heading text-[clamp(2.2rem,5.5vw,4.4rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">How to become {/^[aeiou]/i.test(role.name) ? "an" : "a"} <span style={{ color: color === "#0d1117" ? "#e91e63" : color }}>{role.name}.</span></h1>
          <p className="max-w-2xl text-[16px] leading-7 text-white/65">{role.line}</p>
          <ul className="flex flex-wrap gap-2.5">
            {[[String(plan.steps.length), "steps"], [`~${plan.months}`, `months at ${HOURS_PER_WEEK} h/week`], [String(plan.stages.length), "stages"], [role.fresher ? "Yes" : "Later", "open to freshers"]].map(([n, l]) => (
              <li key={l} className="grid rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5"><b className="font-heading text-[24px] font-black leading-none">{n}</b><span className="text-[12px] font-semibold text-white/55">{l}</span></li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10">
        {/* my progress */}
        {map?.ready ? (
          map.signedIn ? (
            <section className="flex flex-wrap items-center gap-5 rounded-[24px] border border-black/[0.06] bg-white p-5">
              <Ring pct={Math.round((doneCount / plan.steps.length) * 100)} size={84} color={color === "#0d1117" ? "#007373" : color} />
              <span className="grid min-w-0 flex-1 gap-1">
                <b className="text-[16px]">{doneCount} of {plan.steps.length} steps done</b>
                <span className="text-[13.5px] text-black/55">{match ? `You’re ${match.pct}% of the way there.` : ""} Mark each step below as you go.</span>
              </span>
              {isTarget ? <span className="flex items-center gap-1.5 rounded-full bg-[#e6f3f3] px-3 py-1.5 text-[12.5px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[17px]" filled name="flag" />Your goal</span>
                : <button type="button" onClick={() => map.setTarget(roleId)} className="flex items-center gap-1.5 rounded-full bg-[#0d1117] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[17px]" name="flag" />Make this my goal</button>}
            </section>
          ) : (
            <section className="flex flex-wrap items-center gap-4 rounded-[24px] border border-dashed border-black/15 bg-white p-5">
              <MaterialSymbol className="text-[30px] text-[#6d48d8]" name="map" />
              <span className="grid min-w-0 flex-1"><b className="text-[15px]">Track your progress</b><span className="text-[13.5px] text-black/55">Sign in to tick off steps, set this as your goal and see how close you are.</span></span>
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/explore/roadmap/${roleId}`)}`} className="rounded-full bg-[#e91e63] px-4 py-2 text-[12.5px] font-black uppercase tracking-[0.05em] text-white">Sign in</Link>
            </section>
          )
        ) : null}

        {/* the stages */}
        {plan.stages.map((stage) => (
          <section key={stage.level} className="grid gap-4" style={{ "--c": STAGE_COLOR[stage.level] } as CSSProperties}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ background: STAGE_COLOR[stage.level] }}>Stage {stage.level}</span>
              <b className="font-heading text-[24px] font-black uppercase tracking-[-0.03em]">{stage.name}</b>
              <span className="text-[14px] text-black/50">{stage.line} · about {stage.weeks} week{stage.weeks === 1 ? "" : "s"}</span>
            </div>
            <ol className="grid gap-2.5">
              {stage.steps.map((st) => {
                const isDone = done(st);
                const cover = st.options ? [] : coverageFor(st.kind, st.id);
                const subject = st.kind === "subject" ? subjectById.get(st.id) : undefined;
                const skill = st.kind === "skill" && !st.options ? skillById.get(st.id) : undefined;
                return (
                  <li key={st.n} className={cn("grid gap-3 rounded-[20px] border bg-white p-4 sm:grid-cols-[44px_1fr_auto] sm:items-start", isDone ? "border-[#007373]/40 bg-[#f4fbfa]" : "border-black/[0.06]")}>
                    <span className={cn("flex size-11 items-center justify-center rounded-2xl font-heading text-[18px] font-black", isDone ? "bg-[#007373] text-white" : "text-white")} style={isDone ? undefined : { background: STAGE_COLOR[stage.level] }}>{isDone ? <MaterialSymbol className="text-[22px]" name="check" /> : st.n}</span>
                    <span className="grid min-w-0 gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        {skill ? <Mono k={skill} size={24} /> : null}
                        <b className="text-[16px]">{st.name}</b>
                        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-bold text-black/50">{st.options ? "Choose one" : st.kind === "subject" ? "Subject" : "Skill"}</span>
                        {st.prereqFor ? <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">Needed for {st.prereqFor}</span> : null}
                      </span>
                      <span className="text-[13.5px] leading-5 text-black/60">{subject?.line ?? skill?.line ?? (st.options ? "Any one of these is enough to start — pick the one your target jobs ask for." : "")}</span>
                      {subject ? <span className="flex flex-wrap gap-1">{subject.topics.map((t) => <span key={t} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11.5px] font-semibold text-black/55">{t}</span>)}</span> : null}
                      {st.options ? <span className="flex flex-wrap gap-1.5">{st.options.map((o) => { const k = skillById.get(o)!; const mine = map?.items[`skill:${o}`]; return <span key={o} className={cn("flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[12px] font-semibold", mine === "know" ? "border-[#007373] bg-[#e6f3f3]" : "border-black/10")}><Mono k={k} size={20} />{k.name}</span>; })}</span> : null}
                      {cover.length ? <span className="flex flex-wrap gap-1.5 pt-0.5">{cover.map((c) => <Link key={c.label + c.where} href={c.href} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: `color-mix(in srgb, ${c.color} 12%, white)`, color: c.color === "#f2b705" ? "#8a6500" : c.color }}><MaterialSymbol className="text-[14px]" name="school" />{c.label} · {c.where}{c.status === "soon" ? " · soon" : ""}</Link>)}</span> : null}
                      {map?.signedIn && !st.options ? <span className="pt-1"><StatusPicker kind={st.kind} id={st.id} compact /></span> : null}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-black/45 sm:text-right">~{st.weeks} wk</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        <p className="text-[12.5px] text-black/45">Time estimates are rough, at about {HOURS_PER_WEEK} hours a week — you’ll go faster on what you already know. “Choose one” steps: you don’t need every option, just one to start.</p>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="grid content-start gap-5 rounded-[24px] border border-black/[0.06] bg-white p-5"><RoleJourney /></section>
          <section className="grid content-start gap-5 rounded-[24px] border border-black/[0.06] bg-white p-5"><AskMentor roleId={roleId} /></section>
        </div>

        <section className="grid gap-3">
          <span className={cn(kicker, "text-black/45")}>Similar roles — roadmaps that overlap</span>
          <div className="flex flex-wrap gap-2">{similarRoles(roleId).map((r) => <Link key={r.id} href={`/explore/roadmap/${r.id}`} className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[13px] font-semibold hover:border-black/30">{r.name}</Link>)}</div>
          <Link href="/explore?tab=career" className="w-fit text-[13px] font-bold text-[#007373]">See every role on the career map →</Link>
        </section>
      </div>
    </main>
  );
}

