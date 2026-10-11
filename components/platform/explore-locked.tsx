import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { allRoles, exploreCounts, roleFolders, skillFolders } from "@/lib/explore";
import { cn } from "@/lib/utils";

import { Mono } from "./skill-mono";

const kicker = "font-mono text-[11px] font-bold uppercase tracking-[0.16em]";

/* Explore is for members (free). Visitors see what's inside — a faded preview — and a way in that brings them back
   to exactly where they were going. */
export function ExploreLocked({ next, kickerText = "Explore computer science", title, line, facts }: { next: string; kickerText?: string; title?: string; line?: string; facts?: [string, string][] }) {
  const back = encodeURIComponent(next);
  const roles = roleFolders.flatMap((f) => f.roles.slice(0, 2).map((r) => ({ ...r, color: f.color, family: f.name }))).slice(0, 9);
  const skills = skillFolders.flatMap((f) => f.skills.slice(0, 3)).slice(0, 18);
  const what: [string, string, string][] = [
    ["code", `${exploreCounts.skills} skills & tools`, "Languages, frameworks, databases, cloud, AI"],
    ["badge", `${exploreCounts.roles} roles`, "What each job does, its skills and how to get in"],
    ["school", `${exploreCounts.subjects} subjects`, "From foundations to agentic AI"],
    ["public", `${exploreCounts.domains} industries`, "Where software gets built"],
    ["hub", "Career map", "Trace a path from one role to another"],
    ["route", "Learning roadmaps", "Every role, step by step, with time estimates"],
  ];

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#0d1117]">
      <header className="relative isolate overflow-hidden bg-[#0d1117] px-4 pb-14 pt-32 text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <span className="absolute -left-24 top-10 -z-10 size-96 rounded-full bg-[#e91e63]/25 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-5">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn(kicker, "text-[#4fd1c5]")}>{kickerText}</span>
            <span className="flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70"><MaterialSymbol className="text-[13px]" name="lock" />Members · free</span>
          </span>
          <h1 className="font-heading text-[clamp(2.4rem,6vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">{title ?? <>Find where <span className="text-[#e91e63]">you fit.</span></>}</h1>
          <p className="max-w-2xl text-[17px] leading-7 text-white/65">{line ?? "A map of computer science — the skills, the roles, the subjects and the industries, each linked to the others. Free for every Node member."}</p>
          {facts?.length ? (
            <ul className="flex flex-wrap gap-2.5">{facts.map(([n, l]) => <li key={l} className="grid rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5"><b className="font-heading text-[24px] font-black leading-none">{n}</b><span className="text-[12px] font-semibold text-white/55">{l}</span></li>)}</ul>
          ) : null}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link href={`/login?callbackUrl=${back}`} className="flex items-center gap-2 rounded-full bg-[#e91e63] px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25">Sign in to explore<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link>
            <Link href={`/register?callbackUrl=${back}`} className="rounded-full border border-white/25 px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.06em] hover:border-white">Create a free account</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14">
        {/* what's inside */}
        <section className="grid gap-5">
          <span className={cn(kicker, "text-black/45")}>What’s inside</span>
          <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {what.map(([icon, name, l]) => (
              <li key={name} className="flex gap-3.5">
                <MaterialSymbol className="mt-0.5 text-[24px] text-black/35" name={icon} />
                <span className="grid gap-0.5"><b className="text-[16px]">{name}</b><span className="text-[14px] leading-6 text-black/55">{l}</span></span>
              </li>
            ))}
          </ul>
        </section>

        {/* a faded peek, with the way in on top */}
        <section className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white" aria-label="Preview">
          <div className="pointer-events-none grid select-none gap-6 p-6 opacity-70 blur-[1.5px] sm:p-8" aria-hidden>
            <div className="flex flex-wrap gap-2">{skills.map((k) => <span key={k.id} className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 text-[13px] font-semibold"><Mono k={k} size={24} />{k.name}</span>)}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <div key={r.id} className="grid gap-2 rounded-2xl border border-black/[0.06] border-t-[3px] p-4" style={{ borderTopColor: r.color }}>
                  <b className="text-[15px]">{r.name}</b>
                  <span className="line-clamp-2 text-[12.5px] text-black/55">{r.line}</span>
                  <span className="text-[11.5px] font-semibold text-black/40">{r.family}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/70 to-white" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 grid justify-items-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#0d1117] text-white"><MaterialSymbol className="text-[24px]" name="lock" /></span>
            <b className="font-heading text-[22px] font-black uppercase tracking-[-0.03em]">Sign in to open the map</b>
            <span className="max-w-md text-[14px] leading-6 text-black/55">It’s free — {allRoles.length} roles, their skills and roadmaps, and your own progress toward the one you want.</span>
            <span className="flex flex-wrap justify-center gap-2 pt-1">
              <Link href={`/login?callbackUrl=${back}`} className="rounded-full bg-[#0d1117] px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-white">Sign in</Link>
              <Link href={`/register?callbackUrl=${back}`} className="rounded-full border border-black/15 px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em]">Create a free account</Link>
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
