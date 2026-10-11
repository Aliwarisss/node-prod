"use client";

import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { CohortStats } from "@/lib/program/stats";
import { cn } from "@/lib/utils";

import { Bar, card, GradePill, GradeTrend, Kpi, kicker, SkillBars } from "./progress-view";

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/* Admin: the whole cohort through the program — completion and grades overall, by stage and by day, the skills the
   rubric scores show, and every trainee (each opens their own progress). */
export function CohortView({ c }: { c: CohortStats }) {
  const maxReached = Math.max(1, ...c.days.map((d) => d.reached));
  return (
    <div className="grid gap-5">
      <section className="grid gap-1">
        <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Program stats · the cohort</span>
        <h1 className="font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-black uppercase leading-none tracking-[-0.03em] text-[var(--primary)]">How the trainees are doing</h1>
        <p className="max-w-2xl text-[13.5px] text-[var(--on-surface-variant)]">Completion and rubric grades across the 30 days — overall, by stage and by day. Open a trainee to see their own progress.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi icon="group" color="#e91e63" label="Trainees" value={c.trainees} note={`${c.started} started · ${c.finished} finished`} />
        <Kpi icon="donut_large" color="#6d48d8" label="Avg completion" value={`${c.avgCompletion}%`} note="Of the lessons, among those who started" />
        <Kpi icon="grade" color="#007373" label="Average grade" value={c.grade ? `${c.grade.pct}%` : "—"} note={c.grade ? `${c.grade.passed}/${c.grade.graded} passed the rubric` : "Nothing graded yet"} />
        <Kpi icon="bolt" color="#c49000" label="First-time pass" value={c.firstTimePass != null ? `${c.firstTimePass}%` : "—"} note="Approved without being sent back" />
        <Kpi icon="inbox" color="#0284c7" label="Waiting for review" value={c.inReview} note={<Link href="/dashboard/reviews" className="font-bold text-[var(--bridge-teal)]">Open reviews →</Link>} />
        <Kpi icon="replay" color="#a3104a" label="Sent back" value={c.sentBack} note="Being reworked by trainees" />
      </section>

      {/* by stage */}
      <section className={cn(card, "grid gap-3 p-5")}>
        <span className={cn(kicker, "text-black/50")}>By stage · trainees through it · grade</span>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {c.stages.map((s) => (
            <li key={s.id} className="grid gap-2 rounded-2xl border border-black/[0.06] p-3">
              <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg text-[11px] font-black text-white" style={{ background: s.color }}>{s.n}</span><b className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--primary)]">{s.name}</b><GradePill g={s.grade} /></span>
              <span className="flex items-center gap-2 text-[11.5px] text-black/55"><Bar value={c.started ? (s.completed / c.started) * 100 : 0} color={s.color} className="flex-1" />{s.completed}/{c.started}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* by day: the funnel */}
      <section className={cn(card, "grid gap-3 p-5")}>
        <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-black/50")}>By day · reached and completed</span><span className="flex items-center gap-3 text-[11px] text-black/50"><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#fde7ef]" />Reached</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#e91e63]" />Completed</span></span></span>
        <div className="overflow-x-auto">
          <div className="flex min-w-[760px] items-end gap-1" style={{ height: 150 }}>
            {c.days.map((d) => (
              <div key={d.day} className="grid flex-1 content-end justify-items-center gap-1" title={`Day ${d.day} · ${d.title}: ${d.reached} reached, ${d.completed} completed${d.grade ? `, graded ${d.grade.pct}%` : ""}`}>
                <span className="text-[9.5px] font-bold" style={{ color: d.grade ? undefined : "transparent" }}>{d.grade ? `${d.grade.pct}%` : "·"}</span>
                <span className="relative w-full rounded-t-md bg-[#fde7ef]" style={{ height: `${(d.reached / maxReached) * 100}px` }}>
                  <span className="absolute inset-x-0 bottom-0 rounded-t-md bg-[#e91e63]" style={{ height: `${(d.completed / maxReached) * 100}px` }} />
                </span>
                <span className="text-[9.5px] text-black/45">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className={cn(card, "grid content-start gap-3 p-5")}>
          <span className={cn(kicker, "text-black/50")}>Average grade by day</span>
          <GradeTrend days={c.days} />
        </section>
        <section className={cn(card, "grid content-start gap-3 p-5")}>
          <span className={cn(kicker, "text-black/50")}>Cohort skills · from the rubric scores</span>
          <SkillBars skills={c.skills} empty="Skills show once work has been graded." />
        </section>
      </div>

      {/* every trainee */}
      <section className={cn(card, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead><tr className={cn(kicker, "text-[var(--on-surface-variant)]")}><th className="px-5 py-3 font-bold">Trainee</th><th className="px-3 py-3 font-bold">Day</th><th className="w-[24%] px-3 py-3 font-bold">Completion</th><th className="px-3 py-3 font-bold">Grade</th><th className="px-3 py-3 font-bold">Open work</th><th className="px-5 py-3 text-right font-bold">Last active</th></tr></thead>
            <tbody>
              {c.people.map((p) => (
                <tr key={p.id} className="border-t border-black/[0.06] hover:bg-[#fafbfb]">
                  <td className="px-5 py-3"><Link href={`/dashboard/trainees/${p.id}`} className="grid leading-tight"><b className="text-[var(--primary)] hover:underline">{p.name}</b><span className="text-[12px] text-black/45">{p.project || p.email}</span></Link></td>
                  <td className="px-3 py-3 font-bold text-[var(--primary)]">{p.current}</td>
                  <td className="px-3 py-3"><span className="flex items-center gap-2 text-[12px] text-black/55"><Bar value={p.completion} color="#6d48d8" className="flex-1" />{p.completion}%</span></td>
                  <td className="px-3 py-3"><GradePill g={p.grade} /></td>
                  <td className="px-3 py-3 text-[12px]">{p.inReview ? <span className="mr-2 text-[#0369a1]">{p.inReview} in review</span> : null}{p.changes ? <span className="font-bold text-[#a3104a]">{p.changes} to fix</span> : null}{!p.inReview && !p.changes ? <span className="text-black/35">—</span> : null}</td>
                  <td suppressHydrationWarning className="px-5 py-3 text-right text-[12px] text-black/45">{ago(p.lastActive)}</td>
                </tr>
              ))}
              {!c.people.length ? <tr><td colSpan={6} className="px-5 py-8 text-center text-black/45">No trainees yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
      <p className="flex items-center gap-1.5 text-[12px] text-black/45"><MaterialSymbol className="text-[15px]" name="info" />Grades are the reviewers’ rubric scores (0 missing · 1 partial · 2 meets); work passes with no 0s and at least 80%.</p>
    </div>
  );
}
