"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { Lesson, Lookups, ModelMeta, ProgramDay } from "@/lib/program";
import type { LessonKit } from "@/lib/program/kit";
import type { PollView } from "@/lib/program/session-polls";
import type { SessionView } from "@/lib/program/sessions";
import type { LessonState } from "@/lib/program/progress";
import { cn } from "@/lib/utils";

import { DayComplete, type GameSnap } from "./day-complete";
import { DayOverview } from "./day-overview";
import { AdminDaySelect, type DayLink } from "./admin-day-jump";
import { DoPanel } from "./do-panel";
import { KickoffBoard } from "./kickoff-board";
import { KickoffGuide } from "./kickoff-guide";
import type { SubmissionView, WorkspaceDocView } from "@/lib/program/submissions";
import { projectById } from "@/lib/program/projects";
import { BOARD_CHAPTERS, PROJECT } from "./overlay-meta";
import { ArtifactsPanel, ContractPanel, KnowledgePanel, OverviewPanel, ProcessPanel, WorkflowPanel } from "./lesson-panels";
import { DetailProvider, kicker } from "./program-ui";

/* the full-screen Learn board and Story mode load only when opened — they're most of the day page's code */
const LearnBoard = dynamic(() => import("./learn-board").then((m) => m.LearnBoard), { ssr: false });
const StoryMode = dynamic(() => import("./story-mode").then((m) => m.StoryMode), { ssr: false });

type Sel = { kind: "day" } | { kind: "process"; id: string } | { kind: "lesson"; fid: string };

/* the guided order through a lesson: learn it on the board (1), explore it (2–6), then do it (7) */
const STEPS = [
  { id: "guide", label: "Learn", icon: "co_present" },
  { id: "overview", label: "Overview", icon: "flag" },
  { id: "workflow", label: "Workflow", icon: "account_tree" },
  { id: "contract", label: "Contract", icon: "assignment" },
  { id: "artifacts", label: "Artifacts", icon: "description" },
  { id: "knowledge", label: "Knowledge", icon: "lightbulb" },
  { id: "do", label: "Do it", icon: "edit_note" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

async function post2(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Couldn’t save. Try again.");
  return data;
}

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/program/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Couldn’t save. Try again.");
  return data;
}

type Props = {
  day: ProgramDay;
  model: ModelMeta;
  lookups: Lookups;
  initialLessons: Record<string, LessonState>;
  initialDayDone: boolean;
  hasNext: boolean;
  projectId: string;
  initialSubs: Record<string, SubmissionView>;
  initialDocs: Record<string, WorkspaceDocView>;
  kit?: Record<string, LessonKit>; // each lesson's slice of its stage's agent kit
  nextDay?: { day: number; title: string; goal: string; act: string } | null; // tomorrow, for the day-complete moment
  sessions?: SessionView[]; // the day's live sessions
  polls?: PollView[]; // time polls for the day's session, still being decided
  threads?: number; // threads about this day on the board
  allDays?: DayLink[]; // admins: every day, to jump to any of them
};

/* One day of the program as a player: the day's outline on the left, the selected lesson on the right,
 * walked through in six steps — the whole book unit (contract, workflows, artifacts, knowledge), then the exercise. */
export function DayPlayer({ day, model, lookups, initialLessons, initialDayDone, hasNext, projectId: initialProject, initialSubs, initialDocs, kit = {}, nextDay = null, sessions = [], polls = [], threads = 0, allDays }: Props) {
  const router = useRouter();
  const { pushToast } = useToast();
  const lessons = useMemo(() => day.processes.flatMap((p) => p.lessons), [day]);
  const simple = day.kind !== "act"; // kick-off and capstone lessons have no book unit behind them
  const [state, setState] = useState(initialLessons);
  const [dayDone, setDayDone] = useState(initialDayDone);
  const [projectId, setProjectId] = useState(initialProject); // the practice project
  const [subs, setSubs] = useState(initialSubs); // this day's deliverables, keyed "fid|key"
  const [docs, setDocs] = useState(initialDocs); // the workspace documents they're built in, keyed by ref
  const project = projectById(projectId);
  async function pickProject(id: string) {
    const before = projectId;
    setProjectId(id);
    try { await post2("/api/program/project", { projectId: id }); pushToast({ variant: "success", title: `Project: ${projectById(id)?.client}`, description: "Every deliverable this month is about it." }); }
    catch (e) { setProjectId(before); pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." }); }
  }
  const [sel, setSel] = useState<Sel>({ kind: "day" }); // every day opens on what the day is about
  const [step, setStep] = useState<StepId>(simple ? "do" : "guide");
  const [board, setBoard] = useState(false); // the full-screen Learn board
  const [story, setStory] = useState(false); // the lesson as an episode of the Discover story
  const hasStory = day.act.id === "discover";
  const [completing, setCompleting] = useState(false);
  const [celebrate, setCelebrate] = useState<{ before: GameSnap | null; after: GameSnap | null } | null>(null);
  const snap = async (): Promise<(GameSnap & { uid?: string }) | null> => { try { const r = await fetch("/api/program/badges"); return r.ok ? ((await r.json()) as { game: (GameSnap & { uid?: string }) | null }).game : null; } catch { return null; } };
  const scroller = useRef<HTMLDivElement>(null);

  const doneCount = lessons.filter((l) => state[l.fid]?.done).length;
  const allDone = doneCount === lessons.length;
  const lesson = sel.kind === "lesson" ? lessons.find((l) => l.fid === sel.fid) ?? null : null;
  const process = sel.kind === "process" ? day.processes.find((p) => p.id === sel.id) ?? null : day.processes.find((p) => p.lessons.some((l) => l.fid === lesson?.fid)) ?? null;
  const li = lesson ? lessons.indexOf(lesson) : -1;
  const si = STEPS.findIndex((s) => s.id === step);

  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [sel, step]);

  /* starting a lesson opens its Learn board (unless it's already done) */
  const openLesson = (fid: string, at: StepId = simple ? "do" : "guide") => { setSel({ kind: "lesson", fid }); setStep(at); setBoard(at === "guide" && !state[fid]?.done); };
  const openProcess = (id: string) => setSel({ kind: "process", id });
  /* from the overview: a fresh day starts at its first process; a day under way resumes at the first unfinished lesson */
  const started = Object.values(state).some((s) => s.work || s.done);
  /* Day 0's board: all the orientation lessons on one board (it opens the day; any lesson can jump to its part) */
  const kickLessons = lessons.filter((l) => l.guide);
  const [kick, setKick] = useState<number | null>(null);
  const startDay = () => {
    if (kickLessons.length && !started) { setKick(0); return; }
    if (!simple && !started) { openProcess(day.processes[0].id); return; }
    const firstOpen = lessons.find((l) => !state[l.fid]?.done) ?? lessons[0];
    openLesson(firstOpen.fid);
  };
  const startLabel = dayDone ? "Review the day" : started ? `Continue · ${(lessons.find((l) => !state[l.fid]?.done) ?? lessons[0]).title}` : "Start the day";

  /* footer: previous / next through steps, then lessons, then the next process */
  function go(dir: 1 | -1) {
    if (sel.kind === "day") { if (dir === 1) startDay(); return; }
    if (sel.kind === "process") {
      const p = day.processes.find((x) => x.id === sel.id)!;
      if (dir === 1) openLesson(p.lessons[0].fid);
      else {
        const pi = day.processes.indexOf(p);
        if (pi > 0) { const prev = day.processes[pi - 1]; openLesson(prev.lessons[prev.lessons.length - 1].fid, "do"); }
        else setSel({ kind: "day" });
      }
      return;
    }
    if (dir === -1 && li === 0 && (simple || si === 0)) { if (simple) setSel({ kind: "day" }); else openProcess(day.processes[0].id); return; }
    const nextStep = si + dir;
    if (!simple && nextStep >= 0 && nextStep < STEPS.length) { setStep(STEPS[nextStep].id); return; }
    const nl = lessons[li + dir];
    if (!nl) return;
    const nextProc = day.processes.find((p) => p.lessons[0].fid === nl.fid);
    if (dir === 1 && nextProc && !simple && nextProc !== process) openProcess(nextProc.id);
    else openLesson(nl.fid, dir === 1 ? (simple ? "do" : "guide") : "do");
  }
  const atStart = sel.kind === "day";
  const atEnd = sel.kind === "lesson" && li === lessons.length - 1 && (simple || step === "do");
  const nextLabel = sel.kind === "day" ? (started ? "Continue" : "Start the day") : sel.kind === "process" ? "Start the first lesson" : !simple && step !== "do" ? STEPS[si + 1].label : lessons[li + 1] ? "Next lesson" : "";

  async function setDone(l: Lesson, done: boolean) {
    const prev = state[l.fid];
    setState((s) => ({ ...s, [l.fid]: { ...(s[l.fid] ?? { work: "", updatedAt: null }), done } }));
    if (!done) setDayDone(false);
    try {
      await post({ action: "lesson", day: day.day, fid: l.fid, done });
      if (done) pushToast({ variant: "success", title: "Lesson complete", description: lessons[li + 1] ? "On to the next one." : "Every lesson is done — complete the day." });
    } catch (e) {
      setState((s) => ({ ...s, [l.fid]: prev }));
      pushToast({ variant: "error", title: "Not saved", description: e instanceof Error ? e.message : "Try again." });
    }
  }

  async function completeDay() {
    setCompleting(true);
    try {
      const before = await snap();
      await post({ action: "day", day: day.day });
      setDayDone(true);
      /* the moment: what the day brought — then mark it seen, so the sidebar doesn't celebrate it twice */
      const after = await snap();
      setCelebrate({ before, after });
      if (after?.uid) { try { localStorage.setItem(`node:game:${after.uid}`, JSON.stringify({ level: after.level, earned: after.earned.map((b) => b.id) })); } catch { /* fine */ } }
      router.refresh();
    } catch (e) {
      pushToast({ variant: "error", title: "Day not complete yet", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setCompleting(false);
    }
  }

  return (
    <DetailProvider lookups={lookups}>
      <div className="grid gap-3 xl:-my-2 xl:h-[calc(100dvh-90px)] xl:min-h-[600px] xl:grid-cols-[270px_minmax(0,1fr)]">
        {/* ---------- outline ---------- */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[var(--deep-indigo)] text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div className="grid gap-2 border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard/roadmap" className="flex items-center gap-1 text-[12.5px] font-bold text-white/70 hover:text-white"><MaterialSymbol className="text-[17px]" name="arrow_back" />The month</Link>
              <span className="flex gap-1">
                {day.day > 0 ? <Link href={`/dashboard/roadmap/day/${day.day - 1}`} className="flex size-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Previous day"><MaterialSymbol className="text-[18px]" name="chevron_left" /></Link> : null}
                {hasNext && (dayDone || allDays) ? <Link href={`/dashboard/roadmap/day/${day.day + 1}`} className="flex size-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Next day"><MaterialSymbol className="text-[18px]" name="chevron_right" /></Link> : null}
              </span>
            </div>
            {allDays ? <AdminDaySelect days={allDays} current={day.day} /> : null}
            <span className={cn(kicker, "text-[#4fd1c5]")}>Day {day.day} · {day.kind === "act" ? `Act ${day.act.n} ${day.act.name}` : day.act.name}</span>
            <b className="font-heading text-[18px] font-black uppercase leading-tight tracking-[-0.02em]">{day.title}</b>
            <span className="flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#4fd1c5] transition-all" style={{ width: `${(doneCount / lessons.length) * 100}%` }} /></span>
              <span className="text-[12px] font-semibold text-white/75">{doneCount}/{lessons.length}</span>
            </span>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Day outline">
            <button type="button" onClick={() => setSel({ kind: "day" })} className={cn("mb-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors", sel.kind === "day" ? "bg-white text-[var(--deep-indigo)]" : "text-white/85 hover:bg-white/[0.07]")}>
              <MaterialSymbol className={cn("text-[18px]", sel.kind === "day" ? "text-[var(--electric-pink)]" : "text-[#4fd1c5]")} name="wb_sunny" />
              <span className="grid leading-tight"><span className="font-mono text-[10.5px] opacity-70">Day {day.day}</span><span className="text-[13px] font-bold">Day overview</span></span>
            </button>
            {day.processes.map((p) => {
              const pOn = sel.kind === "process" && sel.id === p.id;
              return (
                <div key={p.id} className="mb-2">
                  {!simple ? (
                    <button type="button" onClick={() => openProcess(p.id)} className={cn("flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors", pOn ? "bg-white text-[var(--deep-indigo)]" : "text-white/85 hover:bg-white/[0.07]")}>
                      <MaterialSymbol className={cn("text-[18px]", pOn ? "text-[var(--electric-pink)]" : "text-[#4fd1c5]")} name="account_tree" />
                      <span className="grid leading-tight"><span className="font-mono text-[10.5px] opacity-70">Process {p.code}</span><span className="text-[13px] font-bold">{p.title}</span></span>
                    </button>
                  ) : null}
                  <ul className={cn("grid gap-0.5", !simple && "ml-3 mt-0.5 border-l border-white/10 pl-2")}>
                    {p.lessons.map((l) => {
                      const on = lesson?.fid === l.fid;
                      const done = state[l.fid]?.done;
                      return (
                        <li key={l.fid}>
                          <button type="button" onClick={() => openLesson(l.fid)} className={cn("flex w-full items-start gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors", on ? "bg-white text-[var(--deep-indigo)]" : "text-white/75 hover:bg-white/[0.07] hover:text-white")}>
                            <MaterialSymbol className={cn("mt-0.5 text-[17px]", done ? "text-[#4fd1c5]" : on ? "text-[var(--electric-pink)]" : "text-white/40")} name={done ? "check_circle" : on ? "play_circle" : "radio_button_unchecked"} />
                            <span className="grid leading-tight"><span className="font-mono text-[10.5px] opacity-70">{l.code}</span><span className="text-[12.5px] font-semibold">{l.title}</span></span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="grid gap-2 border-t border-white/10 p-4">
            <span className={cn(kicker, "text-[#ff5c93]")}>Gate · {day.gate.title}</span>
            {dayDone ? (
              hasNext ? <Link href={`/dashboard/roadmap/day/${day.day + 1}`} className="flex items-center justify-center gap-2 rounded-full bg-white py-2.5 text-[13px] font-bold text-[var(--deep-indigo)]">Go to day {day.day + 1}<MaterialSymbol className="text-[17px]" name="arrow_forward" /></Link>
                : <span className="rounded-full bg-[#4fd1c5]/20 py-2.5 text-center text-[13px] font-bold text-[#4fd1c5]">Program complete</span>
            ) : (
              <button type="button" disabled={!allDone || completing} onClick={() => void completeDay()} className="rounded-full bg-[var(--electric-pink)] py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/70">
                {completing ? "Completing…" : allDone ? `Complete day ${day.day}` : `${lessons.length - doneCount} lesson${lessons.length - doneCount === 1 ? "" : "s"} to go`}
              </button>
            )}
          </div>
        </aside>

        {/* ---------- the stage ---------- */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-40px_rgba(13,17,23,0.35)]">
          {sel.kind !== "lesson" ? null : (
          <header className="grid gap-2 border-b border-black/[0.06] px-5 pb-0 pt-3 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid min-w-0 gap-0.5">
                <span className={cn(kicker, "text-[var(--bridge-teal)]")}>
                  {`${lesson?.code} · ${process?.title}`}
                </span>
                <h1 className="font-heading text-[clamp(1.15rem,1.8vw,1.5rem)] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">
                  {lesson?.title}
                </h1>
                <p className="line-clamp-1 text-[13px] text-[var(--on-surface-variant)]" title={lesson?.summary}>{lesson?.summary}</p>
              </div>
              {lesson && state[lesson.fid]?.done ? <span className="flex items-center gap-1 rounded-full bg-[#e6f3f3] px-2.5 py-1 text-[12px] font-bold text-[#005a5a]"><MaterialSymbol className="text-[15px]" name="check_circle" />Completed</span> : null}
            </div>
            {!simple ? (
              <nav className="-mb-px flex gap-0.5 overflow-x-auto" aria-label="Lesson steps">
                {STEPS.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => setStep(s.id)} aria-current={step === s.id ? "step" : undefined} className={cn("flex flex-none items-center gap-1.5 border-b-[3px] px-3 py-2 text-[13px] font-bold transition-colors", step === s.id ? "border-[var(--electric-pink)] text-[var(--primary)]" : "border-transparent text-black/55 hover:text-[var(--primary)]")}>
                    <span className={cn("flex size-5 items-center justify-center rounded-full text-[10.5px] font-black", step === s.id ? "bg-[var(--electric-pink)] text-white" : i < si ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#f1f2f3] text-black/55")}>{i < si ? "✓" : i + 1}</span>
                    {s.label}
                  </button>
                ))}
              </nav>
            ) : <div className="h-1" />}
          </header>
          )}

          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-[#fbfbfc] p-4">
            {sel.kind === "day" ? <DayOverview day={day} state={state} subs={subs} sessions={sessions} polls={polls} threads={threads} onOpenLesson={(fid) => openLesson(fid)} onStart={startDay} startLabel={startLabel} onBoard={kickLessons.length ? () => setKick(0) : undefined} /> : null}
            {sel.kind === "process" && process ? (() => {
              const target = process.lessons.find((l) => !state[l.fid]?.done) ?? process.lessons[0];
              return (
                <ProcessPanel
                  process={process}
                  model={model}
                  onOpenLesson={(fid) => openLesson(fid)}
                  startLabel={process.lessons.some((l) => state[l.fid]?.done || state[l.fid]?.work) ? `Continue · ${target.code}` : "Start"}
                  onStart={() => { setSel({ kind: "lesson", fid: target.fid }); setStep("guide"); setStory(false); setBoard(true); }}
                  onStory={hasStory ? () => { setSel({ kind: "lesson", fid: target.fid }); setStep("guide"); setBoard(false); setStory(true); } : undefined}
                />
              );
            })() : null}
            {lesson ? (
              step === "guide" ? <LearnStart lesson={lesson} onStart={() => setBoard(true)} onStory={hasStory ? () => setStory(true) : undefined} />
                : step === "overview" ? <OverviewPanel lesson={lesson} />
                : step === "workflow" ? <WorkflowPanel lesson={lesson} model={model} />
                : step === "contract" ? <ContractPanel contract={lesson.contract} refs={lesson.refs} model={model} />
                : step === "artifacts" ? <ArtifactsPanel lesson={lesson} />
                : step === "knowledge" ? <KnowledgePanel lesson={lesson} />
                : simple && lesson.guide ? (
                  <div className="grid gap-5">
                    <KickoffGuide guide={lesson.guide} onBoard={() => setKick(Math.max(0, kickLessons.indexOf(lesson)))} />
                    <DoPanel key={lesson.fid} lesson={lesson} day={day.day} kit={kit[lesson.fid] ?? null} state={state[lesson.fid] ?? { done: false, work: "", updatedAt: null }} project={project} subs={subs} docs={docs} onDoc={(doc) => setDocs((m) => ({ ...m, [doc.ref]: doc }))} onSub={(s) => setSubs((m) => ({ ...m, [`${s.fid}|${s.key}`]: s }))} onPickProject={(id) => void pickProject(id)} onDone={(d) => void setDone(lesson, d)} />
                  </div>
                )
                : <DoPanel key={lesson.fid} lesson={lesson} day={day.day} kit={kit[lesson.fid] ?? null} state={state[lesson.fid] ?? { done: false, work: "", updatedAt: null }} project={project} subs={subs} docs={docs} onDoc={(doc) => setDocs((m) => ({ ...m, [doc.ref]: doc }))} onSub={(s) => setSubs((m) => ({ ...m, [`${s.fid}|${s.key}`]: s }))} onPickProject={(id) => void pickProject(id)} onDone={(d) => void setDone(lesson, d)} />
            ) : null}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-2.5 sm:px-6">
            <button type="button" onClick={() => go(-1)} disabled={atStart} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-[var(--primary)] hover:bg-black/5 disabled:opacity-35"><MaterialSymbol className="text-[18px]" name="arrow_back" />Back</button>
            <span className="hidden text-[12.5px] font-semibold text-[var(--on-surface-variant)] sm:block">
              {sel.kind === "day" ? `${day.processes.length} process${day.processes.length === 1 ? "" : "es"} · ${lessons.length} lessons today` : sel.kind === "lesson" ? (simple ? `Lesson ${li + 1} of ${lessons.length}` : step === "guide" ? `Step ${si + 1} of ${STEPS.length} · lesson ${li + 1} of ${lessons.length}` : `Step ${si + 1} of ${STEPS.length} · lesson ${li + 1} of ${lessons.length}`) : `${process?.lessons.length} lessons in this process`}
            </span>
            {!atEnd && nextLabel ? (
              <button type="button" onClick={() => go(1)} className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-bold text-white">{nextLabel}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
            ) : <span />}
          </footer>
        </section>
      </div>
      {story && lesson && !simple ? <StoryMode key={`story-${lesson.fid}`} lesson={lesson} process={process} model={model} onClose={(finished) => { setStory(false); if (finished) setStep("overview"); }} /> : null}
      {celebrate ? <DayComplete day={day.day} title={day.title} before={celebrate.before} after={celebrate.after} next={hasNext ? nextDay : null} onClose={() => setCelebrate(null)} /> : null}
      {kick !== null ? (
        <KickoffBoard lessons={kickLessons} start={kick} onClose={(finished) => {
          setKick(null);
          if (finished) openLesson((kickLessons.find((l) => !state[l.fid]?.done) ?? kickLessons[0]).fid);
        }} />
      ) : null}
      {board && lesson && !simple ? <LearnBoard key={lesson.fid} lesson={lesson} process={process} model={model} onClose={(finished) => { setBoard(false); if (finished) setStep("overview"); }} onStory={hasStory ? () => { setBoard(false); setStory(true); } : undefined} /> : null}
    </DetailProvider>
  );
}

/* ---------- 1 · Learn: the board's front page — what it will teach, and a way back in ---------- */
function LearnStart({ lesson, onStart, onStory }: { lesson: Lesson; onStart: () => void; onStory?: () => void }) {
  const steps = lesson.workflows.reduce((n, w) => n + w.steps.length, 0);
  const know = new Set(lesson.workflows.flatMap((w) => w.steps.flatMap((s) => s.uses.map((u) => u.name)))).size;
  const docs = new Set(lesson.workflows.flatMap((w) => w.steps.filter((s) => s.out).map((s) => s.out))).size;
  return (
    <div className="grid min-h-full place-items-center py-6">
      <div className="grid w-full max-w-2xl justify-items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-[var(--deep-indigo)] text-white shadow-xl"><MaterialSymbol className="text-[32px] text-[#4fd1c5]" name="co_present" /></span>
        <div className="grid gap-1.5">
          <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Learn on the board</span>
          <h2 className="font-heading text-[clamp(1.4rem,2.6vw,2rem)] font-black uppercase leading-tight tracking-[-0.03em] text-[var(--primary)]">{lesson.title}</h2>
          <p className="text-[14px] text-[var(--on-surface-variant)]">A full-screen walk through this subprocess, one thing at a time: why, what, who, when and where — then the workflow, zoomed into every step, the documents it produces and the knowledge it uses.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-[12.5px] font-semibold text-[var(--primary)]">
          {[[steps, "steps"], [docs, "documents"], [know, "knowledge items"]].map(([n, l]) => <span key={String(l)} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-black/[0.06]"><b>{n}</b> {l}</span>)}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {BOARD_CHAPTERS.map((c, i) => <span key={c.id} className="flex items-center gap-1 rounded-lg bg-[#f1f2f3] px-2.5 py-1 text-[11.5px] font-bold text-black/55"><span className="font-mono text-[10px] opacity-60">{i + 1}</span><MaterialSymbol className="text-[14px]" name={c.icon} />{c.label}</span>)}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-full bg-[var(--electric-pink)] px-6 py-3 text-[13.5px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 transition-transform hover:-translate-y-0.5"><MaterialSymbol className="text-[20px]" name="play_arrow" />Start the board</button>
          {onStory ? <button type="button" onClick={onStory} className="flex items-center gap-2 rounded-full bg-[var(--deep-indigo)] px-6 py-3 text-[13.5px] font-black uppercase tracking-[0.06em] text-white shadow-lg transition-transform hover:-translate-y-0.5"><MaterialSymbol className="text-[20px] text-[#4fd1c5]" name="movie" />Watch the story</button> : null}
        </div>
        {onStory ? <span className="max-w-md text-[12.5px] text-[var(--on-surface-variant)]"><b className="text-[var(--primary)]">Story mode:</b> the same subprocess played out as an episode — a team and a client ({PROJECT.client}) working on a real project, step by step, with the documents filling in, the tools on screen and the challenges along the way.</span> : null}
        <span className="text-[12px] text-black/45">Already know it? Skip ahead with Next — the board is always here to replay.</span>
      </div>
    </div>
  );
}
