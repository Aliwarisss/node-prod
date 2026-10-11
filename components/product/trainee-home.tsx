import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { LevelBar, Medal, TitleText } from "@/components/program/game-ui";
import { PendingSessionCard } from "@/components/program/poll-dock";
import { SessionCard } from "@/components/program/session-card";
import { SetupButton } from "@/components/product/setup-button";
import type { ProfileStep } from "@/lib/profile";
import type { Badge, Game } from "@/lib/program/gamification";
import type { ThreadView } from "@/lib/program/board";
import type { PollView } from "@/lib/program/session-polls";
import type { SessionView } from "@/lib/program/sessions";
import type { Activity, Attention, ProgramStats, StageStat } from "@/lib/program/stats";
import { cn } from "@/lib/utils";

/* What the trainee's Home shows — everything at a glance, assembled on the server */
export type HomeData = {
  firstName: string;
  today: { day: number; title: string; act: string; lessons: { fid: string; code: string; title: string; done: boolean }[] } | null;
  stats: Pick<ProgramStats, "overall" | "stages" | "recent" | "attention" | "current">;
  game: Game;
  rank: { rank: number; of: number } | null;
  threads: ThreadView[];
  unanswered: number;
  sessions: SessionView[];
  polls: PollView[];
  goal: { roleId: string; role: string; pct: number; skillGap: number; subjectGap: number } | null;
  profile: { pct: number; complete: boolean; left: string[]; step?: ProfileStep };
};

const card = "rounded-[24px] border border-black/[0.06] bg-white";
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m || 1}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

function Section({ title, kickerText, href, link, children, className }: { title: string; kickerText?: string; href?: string; link?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(card, "grid content-start gap-5 p-6", className)}>
      <div className="flex items-end justify-between gap-3">
        <span className="grid gap-1">
          {kickerText ? <span className={cn(kicker, "text-black/40")}>{kickerText}</span> : null}
          <b className="font-heading text-[19px] font-black uppercase tracking-[-0.025em] text-[var(--primary)]">{title}</b>
        </span>
        {href ? <Link href={href} className="flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-[var(--bridge-teal)] hover:underline">{link ?? "Open"}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link> : null}
      </div>
      {children}
    </section>
  );
}

/* the trainee's Home: today, the numbers, what needs attention, the program, achievements, the board and what's live */
export function TraineeHome({ d }: { d: HomeData }) {
  const o = d.stats.overall;
  const ring = 2 * Math.PI * 52;
  const todayDone = d.today ? d.today.lessons.filter((l) => l.done).length : 0;
  const nextLesson = d.today?.lessons.find((l) => !l.done);
  const nextBadges = d.game.badges.filter((b) => !b.earned || (b.next != null && b.tiers)).filter((b) => b.next != null).sort((a, b) => b.value / (b.next ?? 1) - a.value / (a.next ?? 1)).slice(0, 2);
  const recentBadges = d.game.featured.length ? d.game.featured : d.game.badges.filter((b) => b.earned).slice(0, 3);
  const activeStage = d.stats.stages.find((s) => s.status === "active");

  const glance: { label: string; value: string; sub: string; href: string; icon: string; hot?: boolean }[] = [
    { label: "Program", value: `${o.completion}%`, sub: `${o.days.done} of ${o.days.total} days`, href: "/dashboard/profile?tab=progress", icon: "donut_large" },
    { label: "Grade", value: o.grade ? `${o.grade.pct}%` : "—", sub: o.grade ? `${o.grade.passed} of ${o.grade.graded} passed` : "No grades yet", href: "/dashboard/profile?tab=progress", icon: "grading" },
    { label: "Approved", value: String(o.tasks.approved), sub: o.tasks.submitted ? `of ${o.tasks.submitted} handed in${o.tasks.inReview ? ` · ${o.tasks.inReview} in review` : ""}` : "Nothing handed in yet", href: "/dashboard/profile?tab=progress", icon: "task_alt" },
    { label: "Streak", value: `${o.streak}d`, sub: d.game.shield.usedThisWeek ? "Shield used this week" : "Shield ready", href: "/dashboard/profile", icon: "local_fire_department", hot: o.streak > 0 },
    { label: "Level", value: String(d.game.level.level), sub: `${d.game.xp.toLocaleString()} XP`, href: "/dashboard/profile", icon: "military_tech" },
    { label: "Rank", value: d.rank && !d.game.hideRank ? `#${d.rank.rank}` : "—", sub: d.rank && !d.game.hideRank ? `of ${d.rank.of} · ${d.game.week} XP this week` : "Hidden or unranked", href: "/dashboard/leaderboard", icon: "leaderboard" },
  ];

  return (
    <div className="grid gap-6">
      {/* profile nudge — only while it's incomplete */}
      {!d.profile.complete ? (
        <SetupButton step={d.profile.step} className="flex items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-3 text-left text-[13.5px] hover:border-black/30">
          <MaterialSymbol className="text-[20px] text-[var(--bridge-teal)]" name="person" />
          <span className="flex-1"><b className="text-[var(--primary)]">Your profile is {d.profile.pct}% done.</b> <span className="text-black/55">Still to add: {d.profile.left.slice(0, 3).join(", ")}{d.profile.left.length > 3 ? "…" : ""}</span></span>
          <span className="flex items-center gap-1 text-[12.5px] font-bold text-[var(--bridge-teal)]">Complete it<MaterialSymbol className="text-[18px]" name="arrow_forward" /></span>
        </SetupButton>
      ) : null}

      {/* today */}
      <section className="relative isolate grid gap-8 overflow-hidden rounded-[28px] bg-[var(--deep-indigo)] p-7 text-white sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="grid gap-5">
          <span className={cn(kicker, "text-[#4fd1c5]")}>Welcome back, {d.firstName}{activeStage ? ` · Stage ${activeStage.n} · ${activeStage.name}` : ""}</span>
          {d.today ? (
            <>
              <h1 className="font-heading text-[clamp(1.9rem,3.6vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.04em]">
                <span className="text-[var(--electric-pink)]">Day {d.today.day}.</span> {d.today.title}
              </h1>
              <div className="grid max-w-xl gap-2">
                <span className="flex justify-between text-[13px] text-white/60"><span>Today’s lessons</span><b className="text-white">{todayDone} of {d.today.lessons.length}</b></span>
                <span className="flex gap-1.5">{d.today.lessons.map((l) => <span key={l.fid} className={cn("h-2 flex-1 rounded-full", l.done ? "bg-[#4fd1c5]" : "bg-white/15")} title={l.title} />)}</span>
                {nextLesson ? <span className="text-[13.5px] text-white/70">Next: <b className="text-white">{nextLesson.title}</b></span> : <span className="text-[13.5px] text-[#4fd1c5]">All of today’s lessons are done.</span>}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link href={`/dashboard/roadmap/day/${d.today.day}`} className="flex items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5">
                  {todayDone ? "Continue" : "Start"} day {d.today.day}<MaterialSymbol className="text-[18px]" name="arrow_forward" />
                </Link>
                <Link href="/dashboard/roadmap" className="rounded-full border border-white/20 px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] transition-colors hover:border-white">The month</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[clamp(1.9rem,3.6vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.04em]">You’ve finished the program. <span className="text-[var(--electric-pink)]">Well done.</span></h1>
              <Link href="/dashboard/certificate" className="flex w-fit items-center gap-2 rounded-full bg-[#d4a017] px-6 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-[#0d1117] shadow-lg shadow-amber-500/30 transition-transform hover:-translate-y-0.5"><MaterialSymbol className="text-[19px]" filled name="workspace_premium" />Get your certificate</Link>
            </>
          )}
        </div>
        <div className="relative grid size-[150px] place-items-center justify-self-start lg:justify-self-end" aria-label={`${o.completion}% of the program done`}>
          <svg width="150" height="150" viewBox="0 0 120 120" className="-rotate-90" aria-hidden><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" /><circle cx="60" cy="60" r="52" fill="none" stroke="#4fd1c5" strokeWidth="9" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - o.completion / 100)} /></svg>
          <span className="absolute grid text-center"><b className="font-heading text-[34px] font-black leading-none">{o.completion}%</b><span className="text-[11.5px] text-white/55">of 30 days</span></span>
        </div>
      </section>

      {/* at a glance */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="At a glance">
        {glance.map((g) => (
          <Link key={g.label} href={g.href} className={cn(card, "group grid gap-1 p-4 transition-colors hover:border-black/20")}>
            <span className="flex items-center justify-between text-[12px] font-semibold text-black/50">{g.label}<MaterialSymbol className={cn("text-[18px]", g.hot ? "text-[#e8590c]" : "text-black/25")} filled={g.hot} name={g.icon} /></span>
            <b className="font-heading text-[26px] font-black leading-none text-[var(--primary)]">{g.value}</b>
            <span className="truncate text-[12px] text-black/45">{g.sub}</span>
          </Link>
        ))}
      </section>

      {/* needs attention — work sent back first */}
      {d.stats.attention.length ? (
        <section className="grid gap-3 rounded-[24px] border border-[#a3104a]/25 bg-[#fdf2f6] p-5">
          <span className="flex items-center gap-2"><MaterialSymbol className="text-[20px] text-[#a3104a]" name="priority_high" /><b className="text-[15px] text-[#7a0c38]">Needs your attention</b><span className="text-[12.5px] text-[#7a0c38]/70">{d.stats.attention.length} item{d.stats.attention.length === 1 ? "" : "s"}</span></span>
          <ul className="grid gap-1.5">
            {d.stats.attention.slice(0, 3).map((a: Attention) => (
              <li key={a.fid + a.key}>
                <Link href={`/dashboard/roadmap/day/${a.day}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 hover:shadow-sm">
                  <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]", a.kind === "changes" ? "bg-[#a3104a] text-white" : "bg-black/[0.06] text-black/55")}>{a.kind === "changes" ? "Fix" : "In review"}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--primary)]">{a.artifact}</span>
                  <span className="text-[12px] text-black/45">Day {a.day}{a.comment ? ` · “${a.comment.slice(0, 60)}${a.comment.length > 60 ? "…" : ""}”` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          {/* the program: stages */}
          <Section title="The program" kickerText="Copy, Paste, Go" href="/dashboard/roadmap" link="The month">
            <ol className="grid gap-2">
              {d.stats.stages.map((st: StageStat) => {
                const pct = st.days.length ? Math.round((st.daysDone / st.days.length) * 100) : 0;
                return (
                  <li key={st.id} className={cn("grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-1.5", st.status === "active" && "bg-black/[0.03]")} style={{ "--c": st.color } as CSSProperties}>
                    <span className={cn("flex size-[30px] items-center justify-center rounded-lg font-mono text-[11px] font-bold", st.status === "done" ? "bg-[var(--c)] text-white" : st.status === "active" ? "border-2 border-[var(--c)] text-[var(--c)]" : "border border-black/10 text-black/35")}>{st.status === "done" ? <MaterialSymbol className="text-[16px]" name="check" /> : st.n}</span>
                    <span className="grid min-w-0 gap-1">
                      <span className="flex items-baseline gap-2"><b className={cn("truncate text-[14px]", st.status === "upcoming" ? "text-black/45" : "text-[var(--primary)]")}>{st.name}</b><span className="shrink-0 text-[11.5px] text-black/40">Days {st.days[0]}{st.days.length > 1 ? `–${st.days.at(-1)}` : ""}</span></span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[var(--c)]" style={{ width: `${pct}%` }} /></span>
                    </span>
                    <span className="font-mono text-[11.5px] font-bold text-black/45">{st.status === "done" ? "Done" : st.status === "active" ? `${st.daysDone}/${st.days.length}` : "—"}</span>
                  </li>
                );
              })}
            </ol>
          </Section>

          {/* recent reviews */}
          <Section title="Recent reviews" kickerText="Your work" href="/dashboard/profile?tab=progress" link="All progress">
            {d.stats.recent.length ? (
              <ul className="grid gap-1">
                {d.stats.recent.slice(0, 5).map((a: Activity, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-black/[0.05] py-2.5 last:border-0">
                    <MaterialSymbol className={cn("text-[19px]", a.kind === "approved" ? "text-[var(--bridge-teal)]" : a.kind === "changes" ? "text-[#a3104a]" : "text-black/35")} filled name={a.kind === "approved" ? "check_circle" : a.kind === "changes" ? "replay" : "upload"} />
                    <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--primary)]">{a.artifact}</span>
                    {a.gradePct != null ? <span className="font-mono text-[12px] font-bold text-black/55">{a.gradePct}%</span> : null}
                    <span className="w-[64px] text-right text-[11.5px] text-black/40">{ago(a.at)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13.5px] text-black/50">Nothing handed in yet — your work and its reviews will show here.</p>}
          </Section>

          {/* the board */}
          <Section title="Board" kickerText={d.unanswered ? `${d.unanswered} unanswered` : "Questions & discussion"} href="/dashboard/board" link="Open">
            {d.threads.length ? (
              <ul className="grid gap-1">
                {d.threads.map((t) => (
                  <li key={t.id}>
                    <Link href={`/dashboard/board/${t.id}`} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-black/[0.03]">
                      <MaterialSymbol className={cn("text-[19px]", t.answered ? "text-[var(--bridge-teal)]" : "text-black/30")} filled={t.answered} name={t.kind === "question" ? (t.answered ? "check_circle" : "help") : t.kind === "share" ? "lightbulb" : "forum"} />
                      <span className="grid min-w-0 flex-1"><span className="truncate text-[13.5px] font-semibold text-[var(--primary)]">{t.title}</span><span className="text-[11.5px] text-black/45">{t.authorName}{t.day != null ? ` · Day ${t.day}` : ""} · {t.replies} repl{t.replies === 1 ? "y" : "ies"}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13.5px] text-black/50">No threads yet.</p>}
            <Link href="/dashboard/board?new=1" className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[16px]" name="add" />Ask a question</Link>
          </Section>

        </div>

        <div className="grid gap-6">
          {/* achievements */}
          <Section title="Achievements" kickerText={`${d.game.earned} badges earned`} href="/dashboard/profile" link="All">
            <div className="grid gap-2">
              <span className="text-[13px] text-black/55">Your title: <TitleText title={d.game.title} fx={d.game.titleFx} className="font-bold text-[var(--primary)]" /></span>
              <LevelBar g={d.game} />
            </div>
            {recentBadges.length ? (
              <div className="flex flex-wrap gap-3">{recentBadges.map((b: Badge) => <span key={b.id} className="grid w-[76px] justify-items-center gap-1 text-center"><Medal b={b} size={44} /><span className="text-[11px] font-semibold leading-tight text-black/60">{b.name}</span></span>)}</div>
            ) : null}
            {nextBadges.length ? (
              <div className="grid gap-2 border-t border-black/[0.06] pt-4">
                <span className={cn(kicker, "text-black/40")}>Next to earn</span>
                {nextBadges.map((b) => (
                  <span key={b.id} className="flex items-center gap-3">
                    <Medal b={b} size={34} dim />
                    <span className="grid min-w-0 flex-1 gap-1"><span className="flex justify-between text-[13px]"><b className="truncate text-[var(--primary)]">{b.name}</b><span className="shrink-0 text-black/45">{b.value}/{b.next}{b.unit ? ` ${b.unit}` : ""}</span></span><span className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[var(--bridge-teal)]" style={{ width: `${Math.min(100, Math.round((b.value / (b.next || 1)) * 100))}%` }} /></span></span>
                  </span>
                ))}
              </div>
            ) : null}
          </Section>

          {/* live */}
          <Section title="Live" kickerText="Sessions">
            {d.sessions.length || d.polls.length ? (
              <div className="grid gap-2">
                {d.sessions.map((s) => <SessionCard key={s.id} s={s} showDay />)}
                {d.polls.map((p) => <PendingSessionCard key={p.id} poll={p} showDay />)}
              </div>
            ) : <p className="text-[13.5px] text-black/50">No live session scheduled yet — they’ll appear here and on the day.</p>}
          </Section>

          {/* your goal, from Explore */}
          {d.goal ? (
            <Link href={`/explore/roadmap/${d.goal.roleId}`} className={cn(card, "group flex items-center gap-4 p-5 hover:border-black/20")}>
              <span className="relative grid size-14 shrink-0 place-items-center"><svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90" aria-hidden><circle cx="28" cy="28" r="23" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="6" /><circle cx="28" cy="28" r="23" fill="none" stroke="var(--bridge-teal)" strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 23} strokeDashoffset={2 * Math.PI * 23 * (1 - d.goal.pct / 100)} /></svg><b className="absolute text-[12.5px] text-[var(--primary)]">{d.goal.pct}%</b></span>
              <span className="grid min-w-0 flex-1"><span className={cn(kicker, "text-black/40")}>My goal</span><b className="truncate text-[15px] text-[var(--primary)]">{d.goal.role}</b><span className="text-[12.5px] text-black/50">{d.goal.skillGap} skills and {d.goal.subjectGap} subjects to go</span></span>
              <MaterialSymbol className="text-[20px] text-black/30 transition-transform group-hover:translate-x-0.5" name="arrow_forward" />
            </Link>
          ) : (
            <Link href="/explore?tab=mine" className="flex items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-3 text-[13px] text-black/55 hover:border-black/30"><MaterialSymbol className="text-[19px] text-[#6d48d8]" name="map" />Set a career goal in Explore — see how close you are.</Link>
          )}
        </div>
      </div>
    </div>
  );
}
