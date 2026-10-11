"use client";

import Link from "next/link";
import type { Session } from "next-auth";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { lessonCount, modules } from "@/lib/course-data";
import { useFlagship } from "@/components/providers/pricing-provider";
import { catalog, flagshipHref, statusLabel } from "@/lib/platform-data";
import { SessionCard } from "@/components/program/session-card";
import { PendingSessionCard } from "@/components/program/poll-dock";
import type { DashboardProfile } from "@/lib/profile";
import type { PollView } from "@/lib/program/session-polls";
import type { SessionView } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

import { DashboardChrome } from "./dashboard-chrome";
import type { ChecklistSummary } from "./dashboard-types";
import { FeesPending } from "./fees-pending";

export type TodaySummary = {
  day: number; title: string; act: string; done: number; total: number;
  /* the program so far — completion, the average rubric grade, work to fix */
  overall?: { completion: number; grade: number | null; approved: number; tasks: number; fixes: number; streak: number };
};

type DashboardShellProps = {
  checklist: ChecklistSummary;
  profile: DashboardProfile;
  user: Session["user"];
  /* where the trainee is in the 30 days (only when the program is open to them) */
  today?: TodaySummary | null;
  /* the next live sessions */
  sessions?: SessionView[];
  /* time polls still open — vote for when a session happens */
  polls?: PollView[];
};

const card = "rounded-[24px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-40px_rgba(13,17,23,0.35)]";
const dots = { backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" };
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";

/* The trainee's home: their goal, their next step in the program, their profile — and what else Node offers */
export function DashboardShell({ checklist: initialChecklist, profile: initialProfile, user, today = null, sessions = [], polls = [] }: DashboardShellProps) {
  const plan = useFlagship();
  const profile = initialProfile;
  const checklist = initialChecklist;
  /* the setup modal lives in the dashboard frame — ask it to open, at the first step still missing */
  const handleOpenOnboarding = () => window.dispatchEvent(new CustomEvent("node:setup", { detail: { step: checklist.remainingItems[0]?.step } }));

  const firstName = (profile.name ?? user.name ?? "").split(/\s+/)[0] || "there";
  const start = modules.slice(0, 3);
  const explore = [
    ...catalog.filter((c) => c.kind === "model" && c.status === "free").slice(0, 2),
    ...catalog.filter((c) => c.kind === "program" && c.status === "soon").slice(0, 2),
  ];
  const ring = 2 * Math.PI * 34;
  /* fees are cash on delivery: the program opens once an admin marks the fee as received */
  const unlocked = profile.role === "admin" || profile.paymentStatus === "paid";

  return (
    <DashboardChrome activeSection="overview" checklist={checklist} profile={profile} user={user}>
      {/* welcome */}
      <section className="relative overflow-hidden rounded-[28px] bg-[var(--deep-indigo)] p-7 text-white sm:p-10" style={dots}>
        <div className="pointer-events-none absolute -right-32 -top-40 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(233,30,99,.25),transparent_62%)]" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(0,128,128,.3),transparent_62%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="grid gap-4">
            <span className={cn(kicker, "text-[#4fd1c5]")}>Welcome back</span>
            <h1 className="font-heading text-[clamp(2rem,4vw,3.2rem)] font-black uppercase leading-[0.95] tracking-[-0.045em]">
              Good to see you, <span className="text-[var(--electric-pink)]">{firstName}.</span>
            </h1>
            <p className="max-w-[560px] text-[16px] leading-7 text-white/65">
              {profile.learningGoal?.trim()
                ? <>Your goal: <span className="text-white">{profile.learningGoal}</span></>
                : "Set a goal in your profile, then pick up the program at your next step."}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {unlocked ? (
                <Link href={today ? `/dashboard/roadmap/day/${today.day}` : "/dashboard/roadmap"} className="flex items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5">
                  {today ? `${today.done > 0 ? "Continue" : "Start"} day ${today.day}` : "Open my program"} <MaterialSymbol className="text-[18px]" name="arrow_forward" />
                </Link>
              ) : null}
              {!checklist.isComplete ? (
                <button type="button" onClick={handleOpenOnboarding} className="rounded-full border border-white/20 px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] transition-colors hover:border-white">
                  Finish my profile
                </button>
              ) : null}
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {[
              { k: "Goal", v: profile.primaryTrack?.trim() || "Not set" },
              { k: "Weekly time", v: profile.weeklyHours?.trim() ? `${profile.weeklyHours} h` : "Not set" },
              { k: "Level", v: profile.experienceLevel?.trim() || "Not set" },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <dt className={cn(kicker, "text-white/65")}>{x.k}</dt>
                <dd className="mt-1.5 text-[14.5px] font-bold leading-snug">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {!unlocked ? <FeesPending /> : null}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* the program: where to start */}
        <section className={cn(card, "p-6 sm:p-8")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-2">
              <span className={cn(kicker, "text-[#c2185b]")}>● Flagship program</span>
              <h2 className="font-heading text-[26px] font-black uppercase leading-none tracking-[-0.035em] text-[var(--primary)]">Copy, Paste, Go</h2>
              <span className="text-[14px] text-[var(--on-surface-variant)]">30 days · {modules.length} modules · {lessonCount} lessons · {plan.price}{plan.was ? <> <s className="opacity-50">{plan.was}</s></> : null}{plan.off ? ` · ${plan.off}` : ""}</span>
            </div>
            <Link href={flagshipHref} className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-[13px] font-bold text-[var(--primary)] transition-colors hover:border-[var(--primary)]">
              Program page <MaterialSymbol className="text-[16px]" name="north_east" />
            </Link>
          </div>
          {unlocked && today ? (
            <Link href={`/dashboard/roadmap/day/${today.day}`} className="group mt-7 flex items-center gap-4 rounded-2xl border-2 border-[var(--electric-pink)] bg-[#fff7fa] p-4 transition-colors hover:bg-[#fdeef4]">
              <span className="flex size-12 flex-none flex-col items-center justify-center rounded-xl bg-[var(--electric-pink)] leading-none text-white">
                <span className="text-[9px] font-bold uppercase">Day</span><span className="text-[18px] font-black">{today.day}</span>
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a3104a]">Today · {today.act}</span>
                <span className="truncate text-[15.5px] font-bold text-[var(--primary)]">{today.title}</span>
                <span className="text-[13px] text-[var(--on-surface-variant)]">{today.done} of {today.total} lessons done</span>
              </span>
              <MaterialSymbol className="text-[22px] text-[#a3104a] transition-transform group-hover:translate-x-1" name="arrow_forward" />
            </Link>
          ) : null}
          {unlocked && sessions.length ? (
            <div className="mt-3 grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Next live {sessions.length > 1 ? "sessions" : "session"}</span>
              {sessions.map((s) => <SessionCard key={s.id} s={s} showDay />)}
            </div>
          ) : null}
          {unlocked && polls.length ? (
            <div className="mt-3 grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">Help pick a time</span>
              {polls.map((p) => <PendingSessionCard key={p.id} poll={p} showDay />)}
            </div>
          ) : null}
          {unlocked && today?.overall ? (
            <Link href="/dashboard/profile?tab=progress" className="group mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-black/[0.08] p-3 transition-colors hover:border-black/20 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto] sm:items-center">
              {[
                { k: "Program", v: `${today.overall.completion}%` },
                { k: "Grade", v: today.overall.grade != null ? `${today.overall.grade}%` : "—" },
                { k: "Tasks approved", v: `${today.overall.approved}/${today.overall.tasks}` },
                { k: today.overall.fixes ? "To fix" : "Streak", v: today.overall.fixes ? String(today.overall.fixes) : `${today.overall.streak} d`, hot: today.overall.fixes > 0 },
              ].map((x) => (
                <span key={x.k} className="grid leading-tight"><span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-black/45">{x.k}</span><b className={cn("text-[18px] font-black", x.hot ? "text-[#a3104a]" : "text-[var(--primary)]")}>{x.v}</b></span>
              ))}
              <span className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-[var(--bridge-teal)] sm:col-span-1">My progress<MaterialSymbol className="text-[16px] transition-transform group-hover:translate-x-0.5" name="arrow_forward" /></span>
            </Link>
          ) : null}
          <h3 className={cn(kicker, "mb-3 mt-7 text-[var(--on-surface-variant)]")}>{unlocked && today ? "The month" : "Where to start"}</h3>
          <ol className="grid gap-3">
            {start.map((m) => (
              <li key={m.id}>
                <Link href="/dashboard/roadmap" className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] p-4 transition-colors hover:border-black/15 hover:bg-[#fafbfb]">
                  <span className="flex size-11 flex-none items-center justify-center rounded-xl text-[14px] font-black text-white" style={{ background: m.color }}>{String(m.n).padStart(2, "0")}</span>
                  <span className="grid min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px] font-bold text-[var(--primary)]">
                      {m.title}
                      {m.preview ? <span className="rounded-full bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--bridge-teal)]">Free preview</span> : null}
                    </span>
                    <span className="truncate text-[13.5px] text-[var(--on-surface-variant)]">{m.days} · {m.lessons.length} lessons · {m.question}</span>
                  </span>
                  <MaterialSymbol className="text-[20px] text-black/30 transition-transform group-hover:translate-x-1" name="chevron_right" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* profile */}
        <section className={cn(card, "flex flex-col gap-5 p-6 sm:p-8")}>
          <div className="flex items-center gap-5">
            <svg width="84" height="84" viewBox="0 0 84 84" className="flex-none -rotate-90" aria-hidden="true">
              <circle cx="42" cy="42" r="34" fill="none" stroke="#eef0f1" strokeWidth="8" />
              <circle cx="42" cy="42" r="34" fill="none" stroke="var(--bridge-teal)" strokeWidth="8" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - checklist.percentage / 100)} />
            </svg>
            <div className="grid gap-1">
              <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Your profile</span>
              <span className="font-heading text-[30px] font-black leading-none text-[var(--primary)]">{checklist.percentage}%</span>
              <span className="text-[13.5px] text-[var(--on-surface-variant)]">{checklist.completedCount} of {checklist.totalCount} done</span>
            </div>
          </div>
          <ul className="grid gap-2">
            {checklist.items.slice(0, 5).map((it) => (
              <li key={it.key} className="flex items-center gap-3 text-[14px]">
                <MaterialSymbol className={cn("text-[19px]", it.completed ? "text-[var(--bridge-teal)]" : "text-black/20")} name={it.completed ? "check_circle" : "radio_button_unchecked"} />
                <span className={it.completed ? "text-[var(--on-surface-variant)] line-through decoration-black/20" : "font-semibold text-[var(--primary)]"}>{it.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2">
            {!checklist.isComplete ? (
              <button type="button" onClick={handleOpenOnboarding} className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-bold text-white">Complete it now</button>
            ) : null}
            <Link href="/dashboard/profile" className="rounded-full border border-black/10 px-5 py-2.5 text-[13px] font-bold text-[var(--primary)] hover:border-[var(--primary)]">Edit profile</Link>
          </div>
        </section>
      </div>

      {/* explore */}
      <section className={cn(card, "p-6 sm:p-8")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Explore Node</span>
            <h2 className="font-heading text-[22px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">More ways to grow</h2>
          </div>
          <Link href="/#catalog" className="flex items-center gap-1 text-[13.5px] font-bold text-[var(--electric-pink)]">All programs, models and toolkits <MaterialSymbol className="text-[17px]" name="arrow_forward" /></Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {explore.map((c) => (
            <div key={c.id} className="grid content-start gap-2 rounded-2xl border border-black/[0.06] p-5">
              <span className="flex items-center justify-between gap-2">
                <MaterialSymbol className={cn("text-[24px]", c.kind === "model" ? "text-[var(--bridge-teal)]" : "text-[#6d48d8]")} name={c.icon} />
                <span className={cn("rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em]", c.status === "free" ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "border border-dashed border-black/15 text-black/65")}>{statusLabel[c.status]}</span>
              </span>
              <b className="text-[15px] text-[var(--primary)]">{c.title}</b>
              <span className="text-[13.5px] leading-5 text-[var(--on-surface-variant)]">{c.tagline}</span>
            </div>
          ))}
        </div>
      </section>

    </DashboardChrome>
  );
}
