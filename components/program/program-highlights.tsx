import Link from "next/link";
import type { ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { LevelBar, Medal, TitleText } from "@/components/program/game-ui";
import type { Game } from "@/lib/program/gamification";
import type { ProgramStats } from "@/lib/program/stats";
import { cn } from "@/lib/utils";

const card = "grid content-start gap-4 rounded-[22px] border border-black/[0.06] bg-white p-5";
const kicker = "font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/40";

function Head({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[14px] font-bold text-[var(--primary)]">{title}</h3>
      <Link href={href} className="flex items-center gap-1 text-[12px] font-bold text-[var(--bridge-teal)] hover:underline">{link}<MaterialSymbol className="text-[15px]" name="arrow_forward" /></Link>
    </div>
  );
}

/* under where you stand: how the work is going (grades, reviews, skills) and what it has earned */
export function ProgramHighlights({ stats, game, rank }: { stats: ProgramStats; game: Game; rank: { rank: number; of: number } | null }) {
  const o = stats.overall;
  const metrics: { label: string; value: ReactNode; sub: string; icon: string; color: string }[] = [
    { label: "Grade", value: o.grade ? `${o.grade.pct}%` : "—", sub: o.grade ? `${o.grade.passed} of ${o.grade.graded} passed` : "No grades yet", icon: "grading", color: "#6d48d8" },
    { label: "Approved", value: o.tasks.approved, sub: o.tasks.submitted ? `of ${o.tasks.submitted} handed in` : "Nothing handed in", icon: "task_alt", color: "#007373" },
    { label: "First-time pass", value: o.firstTimePass != null ? `${o.firstTimePass}%` : "—", sub: o.tasks.changes ? `${o.tasks.changes} sent back` : "None sent back", icon: "bolt", color: "#a87b00" },
    { label: "Streak", value: `${o.streak}d`, sub: `${o.activeDays} active day${o.activeDays === 1 ? "" : "s"}`, icon: "local_fire_department", color: "#e8590c" },
  ];
  const skills = [...stats.skills].sort((a, b) => b.scored - a.scored || b.pct - a.pct).slice(0, 6);
  const earned = (game.featured.length ? game.featured : game.badges.filter((b) => b.earned)).slice(0, 5);
  const next = game.badges.filter((b) => b.next != null).sort((a, b) => b.value / (b.next || 1) - a.value / (a.next || 1)).slice(0, 2);

  return (
    <section className="grid gap-3" aria-label="Progress and achievements">
      <h2 className="font-heading text-[15px] font-black uppercase tracking-[-0.02em] text-[var(--primary)]">Progress &amp; achievements</h2>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* the work */}
        <div className={card}>
          <Head title="How your work is going" href="/dashboard/profile?tab=progress" link="All progress" />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06] sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="grid gap-1 bg-white p-3.5">
                <dt className="flex items-center gap-1.5 text-[11.5px] text-black/50"><MaterialSymbol className="text-[15px]" style={{ color: m.color }} name={m.icon} />{m.label}</dt>
                <dd className="text-[18px] font-bold leading-tight text-[var(--primary)]">{m.value}</dd>
                <dd className="truncate text-[11px] text-black/40">{m.sub}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-2.5">
            <span className={kicker}>Skills from your graded work</span>
            {skills.some((s) => s.scored) ? (
              <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {skills.map((s) => (
                  <li key={s.key} className="grid gap-1">
                    <span className="flex items-center justify-between gap-2 text-[12.5px]"><span className="flex min-w-0 items-center gap-1.5 truncate text-[var(--primary)]"><MaterialSymbol className="text-[15px] text-black/35" name={s.icon} />{s.label}</span><span className="font-mono text-[11px] text-black/45">{s.scored ? `${s.pct}%` : "—"}</span></span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[var(--bridge-teal)]" style={{ width: `${s.pct}%` }} /></span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[12.5px] text-black/45">Your skills fill in as mentors grade the work you hand in.</p>}
          </div>
        </div>

        {/* what it has earned */}
        <div className={card}>
          <Head title="Achievements" href="/dashboard/profile" link="All" />
          <div className="grid gap-2">
            <span className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-black/55">
              <span>Title: <TitleText title={game.title} fx={game.titleFx} className="font-bold text-[var(--primary)]" /></span>
              <span className="flex items-center gap-3">
                <span><b className="text-[var(--primary)]">{game.earned}</b> badge{game.earned === 1 ? "" : "s"}</span>
                {rank && !game.hideRank ? <Link href="/dashboard/leaderboard" className="hover:underline"><b className="text-[var(--primary)]">#{rank.rank}</b> of {rank.of}</Link> : null}
              </span>
            </span>
            <LevelBar g={game} />
          </div>
          {earned.length ? (
            <div className="flex flex-wrap gap-2.5">
              {earned.map((b) => <span key={b.id} className="grid w-[64px] justify-items-center gap-1 text-center"><Medal b={b} size={38} /><span className="text-[10.5px] font-semibold leading-tight text-black/55">{b.name}</span></span>)}
            </div>
          ) : null}
          {next.length ? (
            <div className={cn("grid gap-2.5", earned.length && "border-t border-black/[0.06] pt-4")}>
              <span className={kicker}>Next to earn</span>
              {next.map((b) => (
                <span key={b.id} className="flex items-center gap-3">
                  <Medal b={b} size={30} dim />
                  <span className="grid min-w-0 flex-1 gap-1">
                    <span className="flex justify-between gap-2 text-[12.5px]"><span className="truncate font-semibold text-[var(--primary)]">{b.name}</span><span className="shrink-0 text-black/45">{b.value}/{b.next}{b.unit ? ` ${b.unit}` : ""}</span></span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[var(--electric-pink)]" style={{ width: `${Math.min(100, Math.round((b.value / (b.next || 1)) * 100))}%` }} /></span>
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
