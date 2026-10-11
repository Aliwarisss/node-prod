"use client";

import { useState } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { GameAvatar, GamePanel, Medal, TitleText } from "@/components/program/game-ui";
import { SkillTree } from "@/components/program/skill-tree";
import { Bar, card, GradeTrend, gradeTone, kicker, ProgressView, Ring, SkillBars, TaskBar } from "@/components/program/progress-view";
import type { DashboardProfile, ProfileStep } from "@/lib/profile";
import type { Branch, Game } from "@/lib/program/gamification";
import type { ProgramStats } from "@/lib/program/stats";
import { cn } from "@/lib/utils";

import type { ChecklistSummary } from "./dashboard-types";
import { SignInHistory, type SignIn } from "./sign-in-history";

type ProfileStudioProps = {
  checklist: ChecklistSummary;
  profile: DashboardProfile;
  /* the trainee's program numbers — null for admins, or before the program is open to them */
  stats?: ProgramStats | null;
  joined?: string | null;
  /* their game: level, title, badges, rewards — and where they rank */
  game?: Game | null;
  rank?: { rank: number; of: number } | null;
  tree?: { branches: Branch[]; level: number; max: number } | null;
  /* the tab to open on (from ?tab=) */
  initialTab?: ProfileTab;
  /* their direction from the onboarding, by name: the role they're aiming for and the fields that interest them */
  direction?: { role: string | null; interests: string[] };
  /* their recent sign-ins (one device at a time) */
  signIns?: SignIn[];
};

export type ProfileTab = "overview" | "progress" | "tree" | "badges";

const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
/* editing opens the setup modal (it lives in the dashboard frame), at the step asked for */
const setupAt = (step?: ProfileStep) => window.dispatchEvent(new CustomEvent("node:setup", { detail: { step } }));

/* ---------- the profile: who you are, how you're doing, and your details ---------- */
export function ProfileStudio({ checklist: initialChecklist, profile: initialProfile, stats = null, joined = null, game = null, rank = null, tree = null, initialTab = "overview", direction, signIns = [] }: ProfileStudioProps) {
  const profile = initialProfile;
  const checklist = initialChecklist;
  const [tab, setTab] = useState<ProfileTab>(initialTab === "progress" && !stats ? "overview" : initialTab);
  const isAdmin = profile.role === "admin";
  const displayName = profile.name || "Node trainee";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";

  const s = stats;
  const o = s?.overall;
  const chips = [
    { icon: "route", v: profile.primaryTrack },
    { icon: "trending_up", v: profile.experienceLevel },
    { icon: "schedule", v: profile.weeklyHours ? `${profile.weeklyHours}${/^\d+$/.test(profile.weeklyHours) ? " hours" : ""} a week` : "" },
    { icon: "public", v: profile.timezone },
  ].filter((c) => c.v);

  return (
    <div className="grid gap-5">
      {/* who you are, at a glance */}
      <section className="relative overflow-hidden rounded-[26px] bg-[var(--deep-indigo)] p-6 text-white sm:p-8" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="pointer-events-none absolute -right-28 -top-36 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(233,30,99,.22),transparent_62%)]" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-5">
            {game ? (
              <button type="button" onClick={() => setTab("badges")} title={`Level ${game.level.level} · ${game.frame.name} frame`}><GameAvatar initials={initials} frame={game.frame} level={game.level.level} size={96} /></button>
            ) : (
              <span className="relative flex size-20 flex-none items-center justify-center rounded-[22px] bg-[var(--electric-pink)] text-[26px] font-black tracking-[0.04em] shadow-lg shadow-pink-500/30 sm:size-24 sm:text-[30px]">{initials}</span>
            )}
            <div className="grid min-w-0 gap-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className={cn(kicker, "text-[#4fd1c5]")}>{isAdmin ? "Admin · Copy, Paste, Go" : game ? <><TitleText title={game.title} fx={game.titleFx} /> · Level {game.level.level}</> : "Trainee · Copy, Paste, Go"}</span>
                {!isAdmin ? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]", profile.paymentStatus === "paid" ? "bg-[#4fd1c5]/15 text-[#4fd1c5]" : "bg-[#e2b13c]/20 text-[#ffd479]")}>{profile.paymentStatus === "paid" ? "Enrolled" : "Fee pending"}</span> : null}
              </span>
              <span className="flex min-w-0 items-center gap-2.5">
                <h1 className="truncate font-heading text-[clamp(1.7rem,3.4vw,2.6rem)] font-black uppercase leading-none tracking-[-0.04em]">{displayName}</h1>
                <button type="button" onClick={() => setupAt(checklist.remainingItems[0]?.step)} aria-label="Edit profile" title="Edit profile" className="relative flex size-9 flex-none items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                  <MaterialSymbol className="text-[18px]" name="edit" />
                  {!checklist.isComplete ? <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--electric-pink)] px-1 text-[9.5px] font-black text-white" title={`${checklist.remainingItems.length} to fill in`}>{checklist.remainingItems.length}</span> : null}
                </button>
              </span>
              <span className="truncate text-[13.5px] text-white/60">{profile.email}{joined ? <> · joined {fmtDate(joined)}</> : null}{s?.project ? <> · project <b className="text-white">{s.project.client}</b></> : null}</span>
              {game?.featured.length ? <button type="button" onClick={() => setTab("badges")} className="flex gap-1.5 justify-self-start pt-1" title="Badges">{game.featured.map((b) => <Medal key={b.id} b={b} size={30} />)}</button> : null}
              {chips.length ? <span className="flex flex-wrap gap-1.5 pt-1">{chips.map((c) => <span key={c.icon} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px]"><MaterialSymbol className="text-[14px] text-white/60" name={c.icon} />{c.v}</span>)}</span> : null}
            </div>
          </div>

          {s && o ? (
            <div className="flex flex-wrap items-center gap-5">
              <Ring value={o.completion} size={112} stroke={10}><span className="grid"><b className="text-[24px] font-black leading-none">{o.completion}%</b><span className="text-[9.5px] uppercase tracking-[0.14em] text-white/55">program</span></span></Ring>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {[
                  { k: "Day", v: `${s.current}/${o.days.total - 1}` },
                  { k: "Grade", v: o.grade ? `${o.grade.pct}%` : "—", c: o.grade ? gradeTone(o.grade) : undefined },
                  { k: "Approved", v: `${o.tasks.approved}` },
                  game ? { k: "XP", v: game.xp.toLocaleString("en-US") } : { k: "Streak", v: `${o.streak} d` },
                  ...(rank ? [{ k: "Rank", v: `#${rank.rank}/${rank.of}` }] : []),
                ].map((x) => <div key={x.k} className="grid leading-tight"><dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{x.k}</dt><dd className="text-[20px] font-black" style={x.c ? { color: x.c === "#007373" ? "#4fd1c5" : x.c === "#d81b60" ? "#ff7aa8" : "#ffd479" } : undefined}>{x.v}</dd></div>)}
              </dl>
            </div>
          ) : isAdmin ? (
            <Link href="/dashboard/progress" className="flex items-center gap-2 justify-self-start rounded-full bg-white/10 px-5 py-3 text-[12.5px] font-bold hover:bg-white/15"><MaterialSymbol className="text-[18px]" name="insights" />Program stats</Link>
          ) : null}
        </div>
      </section>

      {/* tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-[#eceef0] p-1" role="tablist">
          {([["overview", "Overview", "space_dashboard"], ...(s ? [["progress", "My progress", "insights"] as const] : []), ...(tree ? [["tree", "Skill tree", "account_tree"] as const] : []), ...(game ? [["badges", "Badges & rewards", "military_tech"] as const] : [])] as const).map(([id, label, icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors", tab === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55 hover:text-[var(--primary)]")}>
              <MaterialSymbol className="text-[17px]" name={icon} />{label}
              {id === "progress" && s?.attention.some((a) => a.kind === "changes") ? <span className="rounded-full bg-[var(--electric-pink)] px-1.5 text-[10px] text-white" title="Sent back to fix">{s.attention.filter((a) => a.kind === "changes").length}</span> : null}
            </button>
          ))}
        </div>
        {s && (tab === "overview" || tab === "progress") ? (
          <Link href={`/dashboard/roadmap/day/${s.current}`} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12px] font-black uppercase tracking-[0.05em] text-white shadow-md shadow-pink-500/20">Continue day {s.current}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link>
        ) : null}
      </div>

      {tab === "overview" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 gap-5">
            {s && o ? (
              <>
                {/* the numbers */}
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { icon: "menu_book", c: "#6d48d8", k: "Lessons", v: `${o.lessons.done}/${o.lessons.total}`, p: (o.lessons.done / Math.max(1, o.lessons.total)) * 100, note: `${o.days.done} of ${o.days.total} days done` },
                    { icon: "assignment_turned_in", c: "#0284c7", k: "Tasks", v: `${o.tasks.approved}`, p: (o.tasks.approved / Math.max(1, o.tasks.total)) * 100, note: `${o.tasks.inReview} in review · ${o.tasks.changes} to fix` },
                    { icon: "grade", c: gradeTone(o.grade), k: "Average grade", v: o.grade ? `${o.grade.pct}%` : "—", p: o.grade?.pct ?? 0, note: o.grade ? `${o.grade.passed}/${o.grade.graded} passed · best ${o.best}%` : "Nothing graded yet" },
                    { icon: "balance", c: "#475569", k: "Self-assessment", v: o.calibration != null ? `${o.calibration > 0 ? "+" : ""}${o.calibration}` : "—", p: o.calibration != null ? Math.max(0, 100 - Math.abs(o.calibration) * 5) : 0, note: o.calibration == null ? "Your score vs the reviewer’s" : Math.abs(o.calibration) <= 5 ? "In line with your reviewers" : o.calibration > 0 ? "Above your reviewers — score stricter" : "Below your reviewers — trust your work" },
                  ].map((x) => (
                    <div key={x.k} className={cn(card, "grid content-start gap-2 p-4")}>
                      <span className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl text-white" style={{ background: x.c }}><MaterialSymbol className="text-[18px]" name={x.icon} /></span><span className={cn(kicker, "text-[9.5px] text-black/50")}>{x.k}</span></span>
                      <b className="text-[26px] font-black leading-none tracking-[-0.02em] text-[var(--primary)]">{x.v}</b>
                      <Bar value={x.p} color={x.c} />
                      <span className="text-[12px] leading-5 text-[var(--on-surface-variant)]">{x.note}</span>
                    </div>
                  ))}
                </section>

                {/* the journey through the stages */}
                <section className={cn(card, "grid gap-4 p-5")}>
                  <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-black/50")}>Your journey · 10 stages</span><span className="text-[12px] text-black/45">{s.stages.filter((x) => x.status === "done").length} cleared</span></span>
                  <ol className="flex items-start overflow-x-auto pb-1">
                    {s.stages.map((st, i) => (
                      <li key={st.id} className="flex min-w-[68px] flex-1 flex-col items-center gap-1.5 text-center">
                        <span className="flex w-full items-center">
                          <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : st.status === "upcoming" ? "bg-black/10" : "bg-[var(--bridge-teal)]")} />
                          <span className={cn("flex size-10 flex-none items-center justify-center rounded-full text-[12px] font-black", st.status === "upcoming" ? "bg-[#f1f2f3] text-black/40" : "text-white", st.status === "active" && "ring-4 ring-[var(--electric-pink)]/25")} style={st.status !== "upcoming" ? { background: st.status === "done" ? "#007373" : st.color } : undefined}>
                            {st.status === "done" ? <MaterialSymbol className="text-[19px]" name="check" /> : st.n}
                          </span>
                          <span className={cn("h-0.5 flex-1", i === s.stages.length - 1 ? "bg-transparent" : s.stages[i + 1].status === "upcoming" ? "bg-black/10" : "bg-[var(--bridge-teal)]")} />
                        </span>
                        <b className={cn("text-[12px]", st.status === "upcoming" ? "text-black/45" : "text-[var(--primary)]")}>{st.name}</b>
                        <span className="text-[10.5px] text-black/45">{st.status === "upcoming" ? `Day ${st.days[0]}` : `${st.lessons.done}/${st.lessons.total} lessons`}</span>
                        {st.grade ? <span className="rounded-full px-1.5 text-[10px] font-black text-white" style={{ background: gradeTone(st.grade) }}>{st.grade.pct}%</span> : null}
                      </li>
                    ))}
                  </ol>
                  {(() => {
                    const cur = s.stages.find((x) => x.status === "active");
                    return cur ? (
                      <div className="grid gap-2 rounded-2xl bg-[#f8f9fa] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                        <span className="grid leading-tight"><span className={cn(kicker, "text-[9.5px]")} style={{ color: cur.color }}>Now · Stage {cur.n}</span><b className="text-[15px] text-[var(--primary)]">{cur.name}</b><span className="text-[12px] text-black/50">Gate · {cur.gate}</span></span>
                        <span className="grid gap-1.5 text-[11.5px] text-black/55">
                          <span className="flex items-center gap-2"><span className="w-14">Lessons</span><Bar value={(cur.lessons.done / Math.max(1, cur.lessons.total)) * 100} color={cur.color} className="flex-1" />{cur.lessons.done}/{cur.lessons.total}</span>
                          <span className="flex items-center gap-2"><span className="w-14">Tasks</span><TaskBar t={cur.tasks} className="flex-1" />{cur.tasks.approved}/{cur.tasks.total}</span>
                        </span>
                      </div>
                    ) : null;
                  })()}
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={cn(card, "grid content-start gap-3 p-5")}>
                    <span className={cn(kicker, "text-black/50")}>Grades, day by day</span>
                    <GradeTrend days={s.days} />
                  </section>
                  <section className={cn(card, "grid content-start gap-3 p-5")}>
                    <span className={cn(kicker, "text-black/50")}>Your skills · from the rubric</span>
                    <SkillBars skills={s.skills} empty="Your skills show once a reviewer grades your work — each rubric criterion tests something: artifact quality, lenses, evidence, traceability." />
                  </section>
                </div>

                {/* badges, at a glance */}
                {game ? (
                  <button type="button" onClick={() => setTab("badges")} className={cn(card, "grid gap-3 p-5 text-left transition-colors hover:border-black/20")}>
                    <span className="flex flex-wrap items-baseline justify-between gap-2"><span className={cn(kicker, "text-black/50")}>Badges</span><span className="text-[12px] font-bold text-[var(--bridge-teal)]">{game.earned} of {game.badges.length} earned · see all →</span></span>
                    <span className="flex flex-wrap gap-2">{game.badges.filter((b) => b.earned).sort((x, y) => y.tier - x.tier).map((b) => <Medal key={b.id} b={b} size={40} />)}{!game.earned ? <span className="text-[13px] text-black/45">Your first badge comes with Day 0.</span> : null}</span>
                  </button>
                ) : null}
              </>
            ) : (
              <section className={cn(card, "grid place-items-center gap-2 p-10 text-center")}>
                <MaterialSymbol className="text-[34px] text-black/25" name={isAdmin ? "admin_panel_settings" : "lock_clock"} />
                <b className="text-[16px] text-[var(--primary)]">{isAdmin ? "You’re an admin" : "Your stats start with the program"}</b>
                <p className="max-w-md text-[13.5px] text-[var(--on-surface-variant)]">{isAdmin ? "Admins don’t take the program — the trainees’ numbers are in Program stats." : "Once your fee is received and the program opens, your lessons, grades and skills show here."}</p>
                {isAdmin ? <Link href="/dashboard/progress" className="mt-1 rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white">Open Program stats</Link> : null}
              </section>
            )}
          </div>

          {/* about you, and what's missing */}
          <aside className="grid gap-5 xl:sticky xl:top-4">
            <section className={cn(card, "grid gap-3 p-5")}>
              <span className="flex items-center justify-between"><span className={cn(kicker, "text-black/50")}>About you</span><button type="button" onClick={() => setupAt("you")} className="flex items-center gap-1 text-[12px] font-bold text-[var(--bridge-teal)]"><MaterialSymbol className="text-[15px]" name="edit" />Edit</button></span>
              {profile.learningGoal ? <p className="text-[14px] font-semibold leading-6 text-[var(--primary)]"><MaterialSymbol className="mr-1 align-[-4px] text-[18px] text-[var(--electric-pink)]" name="target" />{profile.learningGoal}</p> : null}
              {profile.bio ? <p className="text-[13px] leading-6 text-[var(--on-surface-variant)]">{profile.bio}</p> : <p className="text-[13px] text-black/40">No bio yet — a few lines help your mentors.</p>}
              <dl className="grid gap-2 border-t border-black/[0.06] pt-3 text-[13px]">
                {[
                  ["Phone", profile.phone], ["LinkedIn", profile.linkedin?.replace(/^https?:\/\/(www\.)?/, "")],
                  ["Focus", profile.primaryTrack], ["Experience", profile.experienceLevel], ["Weekly time", profile.weeklyHours], ["Timezone", profile.timezone],
                  ["Computer", profile.device], ["AI tools", profile.aiTools?.join(", ")], ["Sessions", profile.sessionTimes?.join(", ")],
                  ["Aiming for", direction?.role], ["Interests", direction?.interests.join(", ")],
                  ...(s?.project ? [["Project", `${s.project.client} — ${s.project.name}`]] : []),
                  ["Member since", fmtDate(joined)],
                ].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-black/50">{k}</dt><dd className={cn("text-right font-semibold", v ? "text-[var(--primary)]" : "text-black/35")}>{v || "Not set"}</dd></div>)}
              </dl>
            </section>
            <section className={cn(card, "grid gap-3 p-5")}>
              <span className="flex items-center justify-between"><span className={cn(kicker, "text-black/50")}>Profile</span><span className="text-[12px] font-bold text-[var(--primary)]">{checklist.percentage}%</span></span>
              <Bar value={checklist.percentage} color={checklist.isComplete ? "#007373" : "var(--electric-pink)"} />
              <ul className="grid gap-1">
                {checklist.items.map((it) => (
                  <li key={it.key}>
                    <button type="button" onClick={() => setupAt(it.step)} className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left hover:bg-black/[0.03]">
                      <MaterialSymbol className={cn("mt-px text-[17px]", it.completed ? "text-[var(--bridge-teal)]" : "text-black/25")} name={it.completed ? "check_circle" : "radio_button_unchecked"} />
                      <span className="grid"><span className={cn("text-[13px] font-semibold", it.completed ? "text-black/45" : "text-[var(--primary)]")}>{it.label}</span>{!it.completed ? <span className="text-[11.5px] leading-4 text-black/45">{it.description}</span> : null}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <SignInHistory items={signIns} />
          </aside>
        </div>
      ) : tab === "progress" && s ? (
        <ProgressView stats={s} who={displayName} bare />
      ) : tab === "tree" && tree ? (
        <SkillTree branches={tree.branches} level={tree.level} max={tree.max} />
      ) : tab === "badges" && game ? (
        <GamePanel game={game} rank={rank} editable />
      ) : null}
    </div>
  );
}
