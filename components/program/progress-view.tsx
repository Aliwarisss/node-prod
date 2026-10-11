"use client";

import { useState } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { PASS_PCT } from "@/lib/program/rubrics";
import type { DayStat, GradeSum, ProgramStats, SkillStat, StageStat, Tasks } from "@/lib/program/stats";
import { cn } from "@/lib/utils";

export const card = "rounded-[22px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-44px_rgba(13,17,23,0.35)]";
export const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const ago = (iso: string | null) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
/* green when it passes, amber when it's close, pink when it fails — a grade with no passes (a 0 somewhere) fails whatever its % */
export const gradeTone = (g: GradeSum | { pct: number } | null) => (!g ? "#9aa0a6" : "passed" in g && g.graded && !g.passed ? "#d81b60" : g.pct >= PASS_PCT ? "#007373" : g.pct >= 60 ? "#c49000" : "#d81b60");

/* ---------- small pieces ---------- */
export function Ring({ value, size = 132, stroke = 12, color = "#4fd1c5", track = "rgba(255,255,255,.12)", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">{children}</span>
    </span>
  );
}
export function Bar({ value, color = "var(--electric-pink)", className }: { value: number; color?: string; className?: string }) {
  return <span className={cn("block h-1.5 overflow-hidden rounded-full bg-black/[0.07]", className)}><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, value)}%`, background: color }} /></span>;
}
/* tasks as a stacked bar: approved · in review · sent back · to do */
export function TaskBar({ t, className }: { t: Tasks; className?: string }) {
  const seg = [
    { n: t.approved, c: "#007373", l: "approved" },
    { n: t.inReview, c: "#0284c7", l: "in review" },
    { n: t.changes, c: "#e91e63", l: "sent back" },
  ];
  return (
    <span className={cn("flex h-1.5 overflow-hidden rounded-full bg-black/[0.07]", className)} title={seg.map((s) => `${s.n} ${s.l}`).join(" · ") + ` · ${t.total} tasks`}>
      {seg.map((s) => (s.n ? <span key={s.l} style={{ width: `${pct(s.n, t.total)}%`, background: s.c }} /> : null))}
    </span>
  );
}
export function GradePill({ g, empty = "—" }: { g: GradeSum; empty?: string }) {
  if (!g) return <span className="text-[12px] text-black/35">{empty}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-black text-white" style={{ background: gradeTone(g) }} title={`${g.passed}/${g.graded} passed`}>{g.pct}%</span>;
}
export function Kpi({ icon, label, value, note, color }: { icon: string; label: string; value: React.ReactNode; note?: React.ReactNode; color: string }) {
  return (
    <div className={cn(card, "grid content-start gap-1.5 p-4")}>
      <span className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl text-white" style={{ background: color }}><MaterialSymbol className="text-[18px]" name={icon} /></span><span className={cn(kicker, "text-[9.5px] text-black/50")}>{label}</span></span>
      <b className="text-[26px] font-black leading-none tracking-[-0.02em] text-[var(--primary)]">{value}</b>
      {note ? <span className="text-[12px] leading-5 text-[var(--on-surface-variant)]">{note}</span> : null}
    </div>
  );
}
export function SkillBars({ skills, empty }: { skills: SkillStat[]; empty: string }) {
  if (!skills.length) return <p className="text-[13px] text-[var(--on-surface-variant)]">{empty}</p>;
  const sorted = [...skills].sort((a, b) => b.pct - a.pct);
  return (
    <ul className="grid gap-2.5">
      {sorted.map((s, i) => (
        <li key={s.key} className="grid gap-1">
          <span className="flex items-center gap-2 text-[13px]">
            <MaterialSymbol className="text-[17px] text-black/45" name={s.icon} />
            <b className="min-w-0 flex-1 truncate text-[var(--primary)]">{s.label}</b>
            {i === 0 && sorted.length > 1 ? <span className="rounded-full bg-[#e6f3f3] px-1.5 text-[10px] font-bold text-[#005a5a]">strongest</span> : i === sorted.length - 1 && sorted.length > 1 ? <span className="rounded-full bg-[#fdecf2] px-1.5 text-[10px] font-bold text-[#8a0f3f]">work on this</span> : null}
            <span className="w-24 text-right text-[12px] font-bold" style={{ color: gradeTone(s) }}>{s.avg.toFixed(1)} / 2 · {s.pct}%</span>
          </span>
          <Bar value={s.pct} color={gradeTone(s)} />
          <span className="text-[10.5px] text-black/40">{s.scored} criteria scored</span>
        </li>
      ))}
    </ul>
  );
}

/* grades day by day: the reviewer's grade as a bar, the trainee's own score as a dot, the pass line across */
export function GradeTrend({ days }: { days: { day: number; grade: GradeSum; selfPct?: number | null }[] }) {
  const pts = days.filter((d) => d.grade || d.selfPct != null);
  if (!pts.length) return <p className="text-[13px] text-[var(--on-surface-variant)]">No grades yet — they appear here day by day as reviewers grade the work.</p>;
  const W = Math.max(320, pts.length * 34), H = 150, top = 10, bottom = 22, h = H - top - bottom;
  const y = (v: number) => top + h - (v / 100) * h;
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} className="block">
        {[0, 50, 100].map((v) => <g key={v}><line x1={28} x2={W} y1={y(v)} y2={y(v)} stroke="rgba(0,0,0,.06)" /><text x={0} y={y(v) + 4} fontSize={10} fill="rgba(0,0,0,.4)">{v}%</text></g>)}
        <line x1={28} x2={W} y1={y(PASS_PCT)} y2={y(PASS_PCT)} stroke="#007373" strokeDasharray="4 4" />
        <text x={W - 4} y={y(PASS_PCT) - 4} fontSize={10} textAnchor="end" fill="#007373">pass {PASS_PCT}%</text>
        {pts.map((d, i) => {
          const x = 40 + i * 34;
          return (
            <g key={d.day}>
              {d.grade ? <rect x={x - 9} y={y(d.grade.pct)} width={18} height={y(0) - y(d.grade.pct)} rx={4} fill={gradeTone(d.grade)}><title>{`Day ${d.day}: graded ${d.grade.pct}%`}</title></rect> : null}
              {d.selfPct != null ? <circle cx={x} cy={y(d.selfPct)} r={4.5} fill="white" stroke="#0d1117" strokeWidth={2}><title>{`Day ${d.day}: your own score ${d.selfPct}%`}</title></circle> : null}
              <text x={x} y={H - 6} fontSize={10} textAnchor="middle" fill="rgba(0,0,0,.5)">D{d.day}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const STATUS_STYLE = (d: DayStat) => (d.complete ? { bg: "#007373", fg: "white", label: "Complete" } : d.current ? { bg: "#e91e63", fg: "white", label: "Today" } : d.open ? { bg: "#fde7ef", fg: "#8a0f3f", label: "Open" } : { bg: "#f1f2f3", fg: "rgba(0,0,0,.4)", label: "Locked" });

/* ---------- a trainee's progress: overall, by stage, by day, skills, activity ---------- */
/* bare: inside the profile, whose header already says who and how far — so no header of its own */
export function ProgressView({ stats: s, who, admin = false, bare = false }: { stats: ProgramStats; who: string; admin?: boolean; bare?: boolean }) {
  const [sel, setSel] = useState<number>(s.current);
  const o = s.overall;
  const day = s.days.find((d) => d.day === sel) ?? s.days[0];
  const stageOf = (d: DayStat) => s.stages.find((x) => x.id === d.actId);
  const dayHref = (n: number) => (admin ? undefined : `/dashboard/roadmap/day/${n}`);

  return (
    <div className="grid gap-5">
      {/* overall */}
      {bare ? null : <section className="relative overflow-hidden rounded-[26px] bg-[var(--deep-indigo)] p-6 text-white sm:p-8" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Ring value={o.completion}><span className="grid"><b className="text-[30px] font-black leading-none">{o.completion}%</b><span className="text-[10.5px] uppercase tracking-[0.14em] text-white/55">complete</span></span></Ring>
          <div className="grid gap-2">
            <span className={cn(kicker, "text-[#4fd1c5]")}>{admin ? "Trainee progress" : "My progress"} · Copy, Paste, Go</span>
            <h1 className="font-heading text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase leading-none tracking-[-0.04em]">{who}</h1>
            <p className="text-[14px] text-white/70">
              Day {s.current} of {o.days.total - 1} · {o.lessons.done}/{o.lessons.total} lessons · {o.tasks.approved}/{o.tasks.total} tasks approved
              {s.project ? <> · project <b className="text-white">{s.project.client}</b></> : null}
            </p>
            <span className="flex flex-wrap gap-2 pt-1 text-[12px]">
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><MaterialSymbol className="text-[15px] text-[#ffb74d]" name="local_fire_department" />{o.streak}-day streak</span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><MaterialSymbol className="text-[15px]" name="calendar_month" />{o.activeDays} active day{o.activeDays === 1 ? "" : "s"}</span>
              <span suppressHydrationWarning className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><MaterialSymbol className="text-[15px]" name="schedule" />last active {ago(o.lastActive)}</span>
            </span>
          </div>
          {!admin ? <Link href={`/dashboard/roadmap/day/${s.current}`} className="flex items-center gap-2 justify-self-start rounded-full bg-[var(--electric-pink)] px-5 py-3 text-[12.5px] font-black uppercase tracking-[0.06em] shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5">Continue day {s.current}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link> : null}
        </div>
      </section>}

      {/* the numbers */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi icon="menu_book" color="#6d48d8" label="Lessons" value={`${o.lessons.done}/${o.lessons.total}`} note={`${pct(o.lessons.done, o.lessons.total)}% of the program`} />
        <Kpi icon="event_available" color="#007373" label="Days" value={`${o.days.done}/${o.days.total}`} note={`${s.stages.filter((x) => x.status === "done").length} of ${s.stages.length} stages done`} />
        <Kpi icon="assignment_turned_in" color="#0284c7" label="Tasks" value={`${o.tasks.approved}/${o.tasks.total}`} note={<>{o.tasks.inReview} in review · <span className={o.tasks.changes ? "font-bold text-[#a3104a]" : ""}>{o.tasks.changes} to fix</span></>} />
        <Kpi icon="grade" color={gradeTone(o.grade)} label="Average grade" value={o.grade ? `${o.grade.pct}%` : "—"} note={o.grade ? `${o.grade.passed}/${o.grade.graded} passed the rubric` : "Nothing graded yet"} />
        <Kpi icon="bolt" color="#c49000" label="First-time pass" value={o.firstTimePass != null ? `${o.firstTimePass}%` : "—"} note="Approved without being sent back" />
        <Kpi icon="balance" color="#475569" label="Self-assessment" value={o.calibration != null ? `${o.calibration > 0 ? "+" : ""}${o.calibration}` : "—"} note={o.calibration == null ? "Your score vs the reviewer’s" : Math.abs(o.calibration) <= 5 ? "Your scores match the reviewer’s" : o.calibration > 0 ? "points above the reviewer — score stricter" : "points below the reviewer — you’re too hard on yourself"} />
      </section>

      {/* needs attention */}
      {s.attention.length ? (
        <section className={cn(card, "grid gap-2 p-5")}>
          <span className={cn(kicker, "flex items-center gap-1.5 text-[#a3104a]")}><MaterialSymbol className="text-[16px]" name="notification_important" />Needs attention</span>
          <ul className="grid gap-1.5 md:grid-cols-2">
            {s.attention.map((a) => {
              const inner = (
                <>
                  <MaterialSymbol className={cn("mt-px text-[18px]", a.kind === "changes" ? "text-[#e91e63]" : "text-[#0284c7]")} name={a.kind === "changes" ? "replay" : "schedule_send"} />
                  <span className="grid min-w-0 gap-0.5">
                    <b className="truncate text-[13.5px] text-[var(--primary)]">{a.artifact}</b>
                    <span className="text-[12px] text-[var(--on-surface-variant)]">Day {a.day} · {a.kind === "changes" ? <>sent back by the {a.role}{a.comment ? <> — “{a.comment}”</> : null}</> : <>with the {a.role} for review</>}</span>
                  </span>
                </>
              );
              const cls = cn("flex items-start gap-2 rounded-xl border px-3 py-2.5", a.kind === "changes" ? "border-[#e91e63]/25 bg-[#fff6f9]" : "border-black/[0.06] bg-[#f8fafc]");
              return <li key={`${a.fid}|${a.key}`}>{dayHref(a.day) ? <Link href={dayHref(a.day)!} className={cn(cls, "hover:border-black/20")}>{inner}</Link> : <div className={cls}>{inner}</div>}</li>;
            })}
          </ul>
        </section>
      ) : null}

      {/* by stage */}
      <section className={cn(card, "grid gap-3 p-5")}>
        <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-black/50")}>By stage</span><span className="text-[12px] text-black/45">lessons done · tasks · grade</span></span>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {s.stages.map((st: StageStat) => (
            <li key={st.id} className={cn("grid content-start gap-2 rounded-2xl border p-3", st.status === "active" ? "border-[var(--electric-pink)]/40 bg-[#fff8fb]" : "border-black/[0.06]", st.status === "upcoming" && "opacity-70")}>
              <span className="flex items-center gap-2">
                <span className="flex size-7 flex-none items-center justify-center rounded-lg text-[11px] font-black text-white" style={{ background: st.color }}>{st.n}</span>
                <b className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--primary)]">{st.name}</b>
                {st.status === "done" ? <MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="verified" /> : st.status === "active" ? <span className="rounded-full bg-[var(--electric-pink)] px-1.5 text-[9.5px] font-bold uppercase text-white">Now</span> : <MaterialSymbol className="text-[16px] text-black/30" name="lock" />}
              </span>
              <span className="flex items-center gap-2 text-[11.5px] text-black/55"><Bar value={pct(st.lessons.done, st.lessons.total)} color={st.color} className="flex-1" />{st.lessons.done}/{st.lessons.total}</span>
              <span className="flex items-center gap-2 text-[11.5px] text-black/55"><TaskBar t={st.tasks} className="flex-1" />{st.tasks.approved}/{st.tasks.total}</span>
              <span className="flex items-center justify-between gap-2 text-[11.5px] text-black/45"><span>Days {st.days[0]}{st.days.length > 1 ? `–${st.days[st.days.length - 1]}` : ""} · {st.daysDone}/{st.days.length} done</span><GradePill g={st.grade} /></span>
              {st.gate ? <span className="truncate text-[10.5px] text-black/40" title={st.gate}>Gate · {st.gate}</span> : null}
            </li>
          ))}
        </ol>
      </section>

      {/* by day */}
      <section className={cn(card, "grid gap-4 p-5")}>
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className={cn(kicker, "text-black/50")}>By day</span>
          <span className="flex flex-wrap items-center gap-3 text-[11px] text-black/50">
            {[["#007373", "Complete"], ["#e91e63", "Today"], ["#fde7ef", "Open"], ["#f1f2f3", "Locked"]].map(([c, l]) => <span key={l} className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: c }} />{l}</span>)}
          </span>
        </span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
          {s.days.map((d) => {
            const st = STATUS_STYLE(d), on = d.day === sel, stg = stageOf(d);
            return (
              <button key={d.day} type="button" onClick={() => setSel(d.day)} title={`Day ${d.day} · ${d.title} — ${st.label}`} className={cn("grid gap-1 rounded-[10px] p-2 text-left transition-all hover:-translate-y-0.5", on && "ring-2 ring-[var(--primary)] ring-offset-2")} style={{ background: st.bg, color: st.fg }}>
                <span className="flex items-center justify-between text-[10px] font-bold opacity-80"><span>{stg?.n ?? ""}</span>{d.grade ? <span>{d.grade.pct}%</span> : null}</span>
                <b className="text-[17px] font-black leading-none">{d.day}</b>
                <span className="block h-1 overflow-hidden rounded-full bg-black/10"><span className="block h-full rounded-full" style={{ width: `${pct(d.lessons.done, d.lessons.total)}%`, background: d.complete ? "rgba(255,255,255,.85)" : "currentColor" }} /></span>
              </button>
            );
          })}
        </div>

        {/* the day you picked */}
        {day ? (
          <div className="grid gap-3 rounded-2xl bg-[#f8f9fa] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-0.5">
                <span className={cn(kicker, "text-[9.5px]")} style={{ color: stageOf(day)?.color }}>Day {day.day} · {stageOf(day)?.name} · {STATUS_STYLE(day).label}</span>
                <b className="text-[18px] text-[var(--primary)]">{day.title}</b>
              </div>
              <span className="flex flex-wrap items-center gap-3 text-[12px] text-black/55">
                <span>{day.lessons.done}/{day.lessons.total} lessons</span>
                <span>{day.tasks.approved}/{day.tasks.total} tasks approved</span>
                <span className="flex items-center gap-1">Grade <GradePill g={day.grade} /></span>
                {day.selfPct != null ? <span>Your own score {day.selfPct}%</span> : null}
                {dayHref(day.day) && day.open ? <Link href={dayHref(day.day)!} className="flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[11.5px] font-bold text-white">Open day<MaterialSymbol className="text-[15px]" name="arrow_forward" /></Link> : null}
              </span>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead><tr className={cn(kicker, "text-[9.5px] text-black/45")}><th className="py-1.5 font-bold">Lesson</th><th className="w-[38%] py-1.5 font-bold">Tasks</th><th className="w-20 py-1.5 text-right font-bold">Grade</th></tr></thead>
              <tbody>
                {day.lessonRows.map((l) => (
                  <tr key={l.fid} className="border-t border-black/[0.06]">
                    <td className="py-2 pr-3"><span className="flex items-center gap-2"><MaterialSymbol className={cn("text-[17px]", l.done ? "text-[var(--bridge-teal)]" : "text-black/25")} name={l.done ? "check_circle" : "radio_button_unchecked"} /><span className="w-10 flex-none font-mono text-[11px] text-black/40">{l.code}</span><span className="truncate font-semibold text-[var(--primary)]">{l.title}</span></span></td>
                    <td className="py-2 pr-3"><span className="flex items-center gap-2 text-[11.5px] text-black/50"><TaskBar t={l.tasks} className="flex-1" />{l.tasks.approved}/{l.tasks.total}{l.tasks.changes ? <span className="font-bold text-[#a3104a]">· {l.tasks.changes} to fix</span> : null}{l.tasks.inReview ? <span className="text-[#0369a1]">· {l.tasks.inReview} in review</span> : null}</span></td>
                    <td className="py-2 text-right"><GradePill g={l.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* grades over time */}
        <section className={cn(card, "grid content-start gap-3 p-5")}>
          <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-black/50")}>Grades, day by day</span><span className="flex items-center gap-3 text-[11px] text-black/50"><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#007373]" />Reviewer’s grade</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-full border-2 border-[#0d1117]" />Your own score</span></span></span>
          <GradeTrend days={s.days} />
        </section>
        {/* skills */}
        <section className={cn(card, "grid content-start gap-3 p-5")}>
          <span className={cn(kicker, "text-black/50")}>Skills · from the rubric scores</span>
          <SkillBars skills={s.skills} empty="Skills show once a reviewer has graded some work: each rubric criterion tests something — artifact quality, lenses, evidence, traceability." />
        </section>
      </div>

      {/* activity */}
      <section className={cn(card, "grid gap-2 p-5")}>
        <span className={cn(kicker, "text-black/50")}>Recent activity</span>
        {s.recent.length ? (
          <ol className="grid gap-1">
            {s.recent.map((a, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-black/[0.05] py-2 text-[13px] last:border-0">
                <MaterialSymbol className={cn("text-[18px]", a.kind === "approved" ? "text-[var(--bridge-teal)]" : a.kind === "changes" ? "text-[#e91e63]" : "text-[#0284c7]")} name={a.kind === "approved" ? "verified" : a.kind === "changes" ? "replay" : "send"} />
                <span className="min-w-0 flex-1 truncate"><b className="text-[var(--primary)]">{a.artifact}</b> <span className="text-[var(--on-surface-variant)]">{a.kind === "submitted" ? `submitted to the ${a.role}` : a.kind === "approved" ? `approved by the ${a.role}` : `sent back by the ${a.role}`} · Day {a.day}</span></span>
                {a.gradePct != null ? <GradePill g={{ pct: a.gradePct, graded: 1, passed: a.pass ? 1 : 0 }} /> : null}
                <span suppressHydrationWarning className="w-20 text-right text-[11.5px] text-black/40">{ago(a.at)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-[13px] text-[var(--on-surface-variant)]">Nothing yet — submit your first task and it shows here.</p>}
      </section>
    </div>
  );
}
