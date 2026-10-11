"use client";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { Contract, ProgramDay } from "@/lib/program";
import { deliverablesOf } from "@/lib/program/deliverables";
import type { LessonState } from "@/lib/program/progress";
import { PASS_PCT } from "@/lib/program/rubrics";
import type { PollView } from "@/lib/program/session-polls";
import type { SessionView } from "@/lib/program/sessions";
import type { SubmissionView } from "@/lib/program/submissions";
import Link from "next/link";

import { AskButton } from "./ask-button";
import { SessionCard } from "./session-card";
import { PendingSessionCard } from "./poll-dock";
import { cn } from "@/lib/utils";

import { kicker } from "./program-ui";

const sec = (c: Contract | null, id: string) => ((c ?? {})[id] ?? {}) as Record<string, unknown>;

const tone = (p: number) => (p >= PASS_PCT ? "#007373" : p >= 60 ? "#c49000" : "#d81b60");

/* The day at a glance: what it's for, the lessons, what you finish with — and a way in; once work is under way, the
   day's numbers: lessons, tasks handed in and approved, and the grade. */
export function DayOverview({ day, state, subs = {}, sessions = [], polls = [], threads = 0, onOpenLesson, onStart, startLabel, onBoard }: { day: ProgramDay; state: Record<string, LessonState>; subs?: Record<string, SubmissionView>; sessions?: SessionView[]; polls?: PollView[]; threads?: number; onOpenLesson: (fid: string) => void; onStart: () => void; startLabel: string; onBoard?: () => void }) {
  const lessons = day.processes.flatMap((p) => p.lessons);
  const steps = lessons.reduce((n, l) => n + l.workflows.reduce((m, w) => m + w.steps.length, 0), 0);
  const docs = new Set(lessons.flatMap((l) => l.workflows.flatMap((w) => w.steps.map((s) => s.out).filter(Boolean)))).size;
  const done = lessons.filter((l) => state[l.fid]?.done).length;
  const outcome = day.processes.map((p) => String(sec(p.contract, "definition").outcome ?? "")).find(Boolean);
  /* per lesson: its tasks, how many are approved / to fix, and its grade */
  const perLesson = Object.fromEntries(lessons.map((l) => {
    const ss = deliverablesOf(l).map((d) => subs[`${l.fid}|${d.key}`]);
    const graded = ss.filter((s) => s?.grade).map((s) => s!.grade!);
    return [l.fid, { total: ss.length, approved: ss.filter((s) => s?.status === "approved").length, changes: ss.filter((s) => s?.status === "changes").length, inReview: ss.filter((s) => s?.status === "submitted").length, grade: graded.length ? Math.round(graded.reduce((a, g) => a + g.pct, 0) / graded.length) : null, failed: graded.length > 0 && graded.every((g) => !g.pass) }];
  }));
  const rows = Object.values(perLesson);
  const tasks = rows.reduce((a, x) => a + x.total, 0), approved = rows.reduce((a, x) => a + x.approved, 0), changes = rows.reduce((a, x) => a + x.changes, 0), inReview = rows.reduce((a, x) => a + x.inReview, 0);
  const allGrades = Object.values(subs).filter((s) => s.grade && lessons.some((l) => l.fid === s.fid)).map((s) => s.grade!);
  const dayGrade = allGrades.length ? Math.round(allGrades.reduce((a, g) => a + g.pct, 0) / allGrades.length) : null;
  const started = done > 0 || Object.keys(subs).length > 0;
  const facts = [`${lessons.length} lessons`, steps ? `${steps} steps` : "", docs ? `${docs} documents` : ""].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 py-4">
      {/* what the day is for */}
      <section className="grid gap-3">
        <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Day {day.day} · {day.kind === "act" ? `Act ${day.act.n} ${day.act.name}` : day.act.name}</span>
        <h2 className="font-heading text-[clamp(1.8rem,3.4vw,2.8rem)] font-black uppercase leading-none tracking-[-0.04em] text-[var(--primary)]">{day.title}</h2>
        <p className="max-w-2xl text-[16px] leading-7 text-[var(--on-surface-variant)]">{day.goal}</p>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 transition-transform hover:-translate-y-0.5">{startLabel}<MaterialSymbol className="text-[19px]" name="arrow_forward" /></button>
          {onBoard ? <button type="button" onClick={onBoard} className="flex items-center gap-2 rounded-full bg-[var(--deep-indigo)] px-5 py-3 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"><MaterialSymbol className="text-[19px] text-[#4fd1c5]" name="co_present" />Watch the board</button> : null}
          <span className="text-[13px] text-black/50">{facts}{done ? ` · ${done}/${lessons.length} done` : ""}</span>
        </div>
      </section>

      {/* the day's numbers, once it's under way */}
      {started ? (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { k: "Lessons", v: `${done}/${lessons.length}`, p: lessons.length ? (done / lessons.length) * 100 : 0, c: "#6d48d8", note: done === lessons.length ? "All done" : `${lessons.length - done} to go` },
            { k: "Tasks approved", v: `${approved}/${tasks}`, p: tasks ? (approved / tasks) * 100 : 0, c: "#007373", note: [inReview ? `${inReview} in review` : "", changes ? `${changes} to fix` : ""].filter(Boolean).join(" · ") || "—" },
            { k: "Day grade", v: dayGrade != null ? `${dayGrade}%` : "—", p: dayGrade ?? 0, c: dayGrade != null ? tone(dayGrade) : "#9aa0a6", note: dayGrade != null ? `${allGrades.filter((g) => g.pass).length}/${allGrades.length} passed · pass ${PASS_PCT}%` : "Not graded yet" },
            { k: "Gate", v: day.gate.criteria.length ? `${day.gate.criteria.length} checks` : "—", p: lessons.length ? (done / lessons.length) * 100 : 0, c: "#c49000", note: day.gate.title },
          ].map((x) => (
            <div key={x.k} className="grid gap-1.5 rounded-2xl border border-black/[0.06] bg-white p-3">
              <span className={cn(kicker, "text-[9px] text-black/45")}>{x.k}</span>
              <b className="text-[21px] font-black leading-none" style={{ color: x.k === "Day grade" ? x.c : "var(--primary)" }}>{x.v}</b>
              <span className="block h-1 overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, x.p)}%`, background: x.c }} /></span>
              <span className={cn("truncate text-[11.5px] text-black/50", x.k === "Tasks approved" && changes && "font-bold text-[#a3104a]")}>{x.note}</span>
            </div>
          ))}
        </section>
      ) : null}

      {/* the lessons, in order — chapter by chapter, each a step on one line */}
      <section className="grid gap-4" aria-label="Today's lessons">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="grid gap-0.5">
            <span className={cn(kicker, "text-black/45")}>Today’s lessons</span>
            <b className="text-[18px] text-[var(--primary)]">{lessons.length} lessons{day.processes.length > 1 ? ` in ${day.processes.length} chapters` : ""}, in order</b>
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-black/50">
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full bg-[var(--bridge-teal)] transition-[width] duration-500" style={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%` }} /></span>
            {done}/{lessons.length} done
          </span>
        </div>

        {day.processes.map((p, pi) => (
          <div key={p.id} className="grid gap-2">
            {/* the chapter */}
            {day.kind === "act" || day.processes.length > 1 ? (
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--deep-indigo)] px-4 py-3 text-white">
                <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-white/10 font-mono text-[12px] font-bold text-[#4fd1c5]">{p.code}</span>
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className={cn(kicker, "text-[9.5px] text-white/50")}>Chapter {pi + 1} of {day.processes.length}</span>
                  <b className="truncate text-[15px]">{p.title}</b>
                </span>
                <span className="hidden flex-none text-right text-[11.5px] leading-tight text-white/55 sm:grid">
                  <span>{p.lessons.length} lessons</span>
                  {p.gate ? <span className="flex items-center gap-1 text-[#ffd666]"><MaterialSymbol className="text-[13px]" name="flag" />{p.gate}</span> : null}
                </span>
              </div>
            ) : null}

            {/* its lessons, on a line */}
            <ol className="relative grid gap-2 pl-0">
              {p.lessons.map((l, li) => {
                const s = state[l.fid];
                const at = lessons.indexOf(l);
                const isDone = !!s?.done;
                const isNext = !isDone && at === lessons.findIndex((x) => !state[x.fid]?.done);
                const busy = !isDone && (!!s?.work || perLesson[l.fid].inReview + perLesson[l.fid].approved + perLesson[l.fid].changes > 0);
                const t = perLesson[l.fid];
                const last = li === p.lessons.length - 1;
                return (
                  <li key={l.fid} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-2.5 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-3">
                    {/* the line between steps */}
                    {!last ? <span className={cn("absolute bottom-[-10px] left-[15px] top-[42px] w-0.5 rounded-full sm:left-[19px]", isDone ? "bg-[var(--bridge-teal)]/40" : "bg-black/[0.08]")} aria-hidden="true" /> : null}
                    <span className={cn("relative z-[1] mt-3 flex size-8 items-center justify-center rounded-full text-[12px] font-black sm:size-10 sm:text-[13px]",
                      isDone ? "bg-[var(--bridge-teal)] text-white" : isNext ? "bg-[var(--electric-pink)] text-white shadow-[0_0_0_5px_rgba(216,27,96,.15)]" : busy ? "bg-white text-[var(--primary)] ring-2 ring-[var(--bridge-teal)]" : "bg-white text-black/40 ring-1 ring-black/10")}>
                      {isDone ? <MaterialSymbol className="text-[20px]" name="check" /> : at + 1}
                    </span>
                    <button type="button" onClick={() => onOpenLesson(l.fid)} className={cn("group grid min-w-0 gap-1.5 rounded-2xl border bg-white px-4 py-3 text-left transition-all hover:-translate-y-px hover:shadow-md",
                      isNext ? "border-[var(--electric-pink)]/40 shadow-[0_10px_30px_-18px_rgba(216,27,96,.5)]" : "border-black/[0.06]")}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-black/40">{l.code}</span>
                        {isNext ? <span className="rounded-full bg-[var(--electric-pink)] px-2 py-px text-[10px] font-bold uppercase tracking-[0.06em] text-white">Up next</span>
                          : isDone ? <span className="rounded-full bg-[#e6f3f3] px-2 py-px text-[10px] font-bold text-[#005a5a]">Done</span>
                          : busy ? <span className="rounded-full bg-[#eef6ff] px-2 py-px text-[10px] font-bold text-[#075985]">In progress</span> : null}
                        <span className="ml-auto flex items-center gap-1.5">
                          {t.changes ? <span className="rounded-full bg-[#fdecf2] px-2 py-px text-[10.5px] font-bold text-[#a3104a]">{t.changes} to fix</span> : null}
                          {t.grade != null ? <span className="rounded-full px-2 py-px text-[10.5px] font-black text-white" style={{ background: t.failed ? "#d81b60" : tone(t.grade) }}>{t.grade}%</span> : null}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <b className={cn("text-[14.5px] leading-snug", isDone ? "text-black/55" : "text-[var(--primary)]")}>{l.title}</b>
                          {l.summary ? <span className="line-clamp-1 text-[12.5px] text-black/50">{l.summary}</span> : null}
                        </span>
                        <span className={cn("flex flex-none items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-colors sm:px-3",
                          isNext ? "bg-[var(--electric-pink)] text-white" : "text-black/45 group-hover:bg-black/[0.04] group-hover:text-[var(--primary)]")}>
<span className="hidden sm:inline">{isDone ? "Review" : busy ? "Continue" : isNext ? "Start" : "Open"}</span><MaterialSymbol className="text-[16px] transition-transform group-hover:translate-x-0.5" name="arrow_forward" />
                        </span>
                      </span>
                      {t.total ? (
                        <span className="flex items-center gap-2 text-[11.5px] text-black/45">
                          <MaterialSymbol className="text-[14px]" name="assignment" />{t.total} task{t.total === 1 ? "" : "s"}
                          {t.approved || t.inReview ? <span>· {t.approved} approved{t.inReview ? ` · ${t.inReview} in review` : ""}</span> : null}
                          <span className="ml-1 h-1 w-16 overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full bg-[var(--bridge-teal)]" style={{ width: `${(t.approved / t.total) * 100}%` }} /></span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>

      {/* what you finish the day with */}
      <section className="grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="grid gap-0.5"><span className={cn(kicker, "text-black/45")}>By the end of the day</span>{outcome ? <b className="max-w-3xl text-[14.5px] font-semibold leading-6 text-[var(--primary)]">{outcome}</b> : null}</span>
          <span className="flex items-center gap-1 rounded-full bg-[#fff8e6] px-3 py-1 text-[12px] font-bold text-[#7a5600]"><MaterialSymbol className="text-[15px]" name="flag" />Gate · {day.gate.title}</span>
        </span>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {day.gate.criteria.map((c) => <li key={c} className="flex items-start gap-2 text-[13.5px] leading-5 text-[var(--on-surface-variant)]"><MaterialSymbol className="mt-px flex-none text-[17px] text-[var(--bridge-teal)]" name="task_alt" />{c}</li>)}
        </ul>
      </section>

      {/* live today, and the board */}
      <section className="grid gap-2">
        <span className={cn(kicker, "text-black/45")}>Live {sessions.length > 1 ? "sessions" : "session"}</span>
        {sessions.map((s) => <SessionCard key={s.id} s={s} />)}
        {polls.map((p) => <PendingSessionCard key={p.id} poll={p} />)}
        {!sessions.length && !polls.length ? <p className="text-[13px] text-black/45">No live session for this day yet — a mentor will post the time here.</p> : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[13px]">
          <AskButton day={day.day} dayTitle={day.title} className="flex items-center gap-1 font-bold text-[var(--bridge-teal)]"><MaterialSymbol className="text-[17px]" name="help" />Ask a question about today</AskButton>
          {threads ? <Link href={`/dashboard/board?day=${day.day}`} className="flex items-center gap-1 text-black/55 hover:text-[var(--primary)]"><MaterialSymbol className="text-[16px]" name="forum" />{threads} thread{threads === 1 ? "" : "s"} on the board</Link> : null}
        </div>
      </section>
    </div>
  );
}
