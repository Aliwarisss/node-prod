"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { Lesson } from "@/lib/program";
import { boardTemplate } from "@/lib/program/boards";
import { deliverablesOf, linksOf, type Deliverable } from "@/lib/program/deliverables";
import type { KitRef, LessonKit } from "@/lib/program/kit";
import { reactionOf } from "@/lib/program/reactions";
import type { LessonState } from "@/lib/program/progress";
import { PROJECTS, type Project } from "@/lib/program/projects";
import { gradeOf, PASS_PCT, rubricOf, SCORE_LABEL, selfCheckPrompt, type Criterion, type Score } from "@/lib/program/rubrics";
import type { GradeView, SubmissionView, WorkspaceDocView } from "@/lib/program/submissions";
import { taskGuide, type SubTask } from "@/lib/program/task-guide";
import { cn } from "@/lib/utils";

import { AskButton } from "./ask-button";
import { LivingDoc } from "./living-doc";
import { KnowledgeChip, kicker, useDetail } from "./program-ui";
import { templateTitle } from "./template-view";

async function api(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Couldn’t save. Try again.");
  return data;
}

const STATUS: Record<string, { label: (to: string) => string; short: string; icon: string; cls: string; dot: string }> = {
  none: { label: () => "Not started", short: "To do", icon: "radio_button_unchecked", cls: "bg-[#f1f2f3] text-black/55", dot: "bg-black/20" },
  draft: { label: () => "In progress", short: "Doing", icon: "edit", cls: "bg-[#f1f2f3] text-black/65", dot: "bg-black/40" },
  submitted: { label: (to) => `With the ${to} for review`, short: "In review", icon: "schedule_send", cls: "bg-[#e8f1fb] text-[#075985]", dot: "bg-[#0284c7]" },
  changes: { label: () => "Changes requested", short: "Fix", icon: "replay", cls: "bg-[#fdecf2] text-[#8a0f3f]", dot: "bg-[#e91e63]" },
  approved: { label: (to) => `Approved by the ${to}`, short: "Approved", icon: "verified", cls: "bg-[#e6f3f3] text-[#005a5a]", dot: "bg-[var(--bridge-teal)]" },
};
const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const TYPE_TONE: Record<string, string> = { Standard: "#0f766e", Framework: "#6d48d8", Method: "#0284c7", Practice: "#c2410c", Technique: "#be185d", Pattern: "#4f46e5", Principle: "#a16207", Tool: "#475569" };

/* the client person playing a workflow role in this project ("Candidate sponsor" → the project's Sponsor) */
function personFor(project: Project | null, role: string) {
  if (/mentor/i.test(role)) return "a Node mentor";
  if (!project) return "";
  const r = role.toLowerCase();
  return project.people.find((p) => r.includes(p.role.toLowerCase()) || p.role.toLowerCase().includes(r))?.name ?? "";
}
const roleWithPerson = (project: Project | null, role: string) => { const p = personFor(project, role); return p ? `${role} (${p})` : role; };

/* a meter: how far a task is — its subtasks, the document filled, the submission */

/* a grade: total/max · % · pass or not */
export function GradeChip({ g, label, className }: { g: GradeView; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", g.pass ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#fdecf2] text-[#8a0f3f]", className)}>
      <MaterialSymbol className="text-[14px]" name={g.pass ? "grade" : "trending_down"} />{label ? `${label} ` : ""}{g.pct}%<span className="font-semibold opacity-70">· {g.total}/{g.max} · {g.pass ? "pass" : "below pass"}</span>
    </span>
  );
}
const lessonOfRubric = (lookups: ReturnType<typeof useDetail>["lookups"]) => ({ template: (id: string) => lookups.templates[id], lens: (id: string) => lookups.lenses[id] });
const SCORE_TONE: Record<Score, string> = { 0: "bg-[#e91e63] text-white", 1: "bg-[#f5b400] text-[#3d2b00]", 2: "bg-[var(--bridge-teal)] text-white" };

/* the rubric: 0 · 1 · 2 on each criterion — yours, and the reviewer's once graded */
export function RubricTable({ rubric, scores, theirs, theirsLabel = "Reviewer", disabled, onScore }: { rubric: Criterion[]; scores: Record<string, number>; theirs?: Record<string, number> | null; theirsLabel?: string; disabled?: boolean; onScore?: (id: string, s: Score | null) => void }) {
  return (
    <ol className="grid gap-1">
      {rubric.map((c, i) => {
        const mine = scores[c.id] as Score | undefined, rev = theirs?.[c.id] as Score | undefined;
        return (
          <li key={c.id} className={cn("grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-1", theirsLabel === "Reviewer" && rev !== undefined && rev < 2 && "bg-[#fff4f7]")}>
            <span className="text-[11px] font-bold text-black/35">{i + 1}</span>
            <span className="grid min-w-0"><span className="text-[13px] leading-5 text-[var(--primary)]">{c.text}</span><span className="text-[10.5px] font-semibold text-black/40">{c.source}</span></span>
            <span className="flex items-center gap-2">
              {rev !== undefined ? <span title={`${theirsLabel}: ${SCORE_LABEL[rev]}`} className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-black", SCORE_TONE[rev])}>{theirsLabel} {rev}</span> : null}
              <span className="flex overflow-hidden rounded-lg border border-black/10" role="radiogroup" aria-label={c.text}>
                {([0, 1, 2] as Score[]).map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={mine === s} disabled={disabled} title={SCORE_LABEL[s]} onClick={() => onScore?.(c.id, mine === s ? null : s)} className={cn("w-7 py-1 text-[12px] font-black transition-colors disabled:cursor-default", mine === s ? SCORE_TONE[s] : "bg-white text-black/40 enabled:hover:bg-[#f1f2f3]")}>{s}</button>
                ))}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- the agent kit, in the lesson ---------- */
const KIT_LAYER: Record<string, { label: string; icon: string; tone: string }> = {
  commands: { label: "Command", icon: "terminal", tone: "#0284c7" }, workflows: { label: "Workflow spec", icon: "account_tree", tone: "#6d48d8" }, skills: { label: "Skill", icon: "school", tone: "#be185d" },
  agents: { label: "Subagent", icon: "groups_3", tone: "#007373" }, rubrics: { label: "Rubric", icon: "grading", tone: "#c49000" }, templates: { label: "Template", icon: "description", tone: "#c2410c" },
  context: { label: "Context", icon: "description", tone: "#0d1117" }, readme: { label: "Read me", icon: "menu_book", tone: "#0d1117" }, tools: { label: "Tools", icon: "cable", tone: "#475569" },
  guardrails: { label: "Guardrails", icon: "shield", tone: "#a3104a" }, memory: { label: "Memory", icon: "folder_open", tone: "#64748b" },
};
const kitHref = (kit: LessonKit, lessonFid: string, file?: string) => `/dashboard/kit?act=${kit.act}&lesson=${encodeURIComponent(lessonFid)}${file ? `&file=${encodeURIComponent(file)}` : ""}`;
const commandOf = (refs: KitRef[]) => refs.find((r) => r.layer === "commands")?.path.replace(/^commands\//, "").replace(/\.md$/, "");
function KitChip({ r, href }: { r: KitRef; href: string }) {
  const L = KIT_LAYER[r.layer] ?? { label: r.layer, icon: "description", tone: "#475569" };
  const name = r.path.split("/").slice(-1)[0] === "SKILL.md" ? r.path.split("/").slice(-2)[0] : r.path.split("/").pop()!.replace(/\.md$/, "");
  return (
    <a href={href} title={`${r.title} — ${r.path}`} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-black/[0.07] bg-white px-2 py-1 text-[12px] transition-colors hover:border-black/25">
      <MaterialSymbol className="text-[15px]" name={L.icon} style={{ color: L.tone }} />
      <span className="truncate font-mono text-[11.5px] text-[var(--primary)]">{name}</span>
    </a>
  );
}

/* the lesson's slice of its stage's kit: locked until the stage is reached */
function KitStrip({ kit, lesson }: { kit: LessonKit; lesson: Lesson }) {
  const refs = [...kit.lesson, ...Object.values(kit.steps).flat()];
  const count = new Set(refs.map((r) => r.path)).size;
  const by = (layer: string) => new Set(refs.filter((r) => r.layer === layer).map((r) => r.path)).size;
  const kickoff = lesson.fid.startsWith("kickoff.");
  if (!kit.unlocked) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-[#fafafa] px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-black/[0.06]"><MaterialSymbol className="text-[19px] text-black/40" name="lock" /></span>
        <span className="grid min-w-0 flex-1 leading-tight"><b className="text-[13.5px] text-[var(--primary)]">Agent kit · {kit.stage} unlocks on Day {kit.firstDay}</b><span className="text-[12px] text-[var(--on-surface-variant)]">{kickoff ? "Make the folder now — when Discover opens, drop the kit in: context file, commands, skills, subagents, rubrics." : "When you reach this stage, the command, skills and reviewers for each task open here."}</span></span>
        <a href={`/dashboard/kit?act=${kit.act}`} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--primary)] ring-1 ring-black/10">See what’s in it</a>
      </section>
    );
  }
  return (
    <section className="grid gap-2 rounded-2xl bg-[var(--deep-indigo)] px-4 py-3 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#4fd1c5]/15"><MaterialSymbol className="text-[19px] text-[#4fd1c5]" name="smart_toy" /></span>
        <span className="grid min-w-0 flex-1 leading-tight">
          <b className="text-[13.5px]">Agent kit · {kickoff ? `${kit.stage} — set it up` : "this lesson"}</b>
          <span className="text-[12px] text-white/60">{kickoff ? `${kit.shared.length} root files to start your project folder with` : [by("workflows") ? `${by("workflows")} workflow spec${by("workflows") > 1 ? "s" : ""}` : "", by("commands") ? `${by("commands")} commands` : "", by("skills") ? `${by("skills")} skills` : "", by("agents") ? `${by("agents")} subagents` : "", by("rubrics") ? `${by("rubrics")} rubrics` : ""].filter(Boolean).join(" · ") || `${count} files`}</span>
        </span>
        <a href={kitHref(kit, lesson.fid)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold hover:bg-white/15"><MaterialSymbol className="text-[15px]" name="folder_open" />Open in the kit</a>
      </div>
      {kickoff ? <div className="flex flex-wrap gap-1.5">{kit.shared.map((r) => <KitChip key={r.path} r={r} href={kitHref(kit, lesson.fid, r.path)} />)}</div> : null}
    </section>
  );
}

/* ---------- the practice project picker (day 0) ---------- */
export function ProjectPicker({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-5">
      <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Pick your practice project</span>
      <p className="text-[13.5px] text-[var(--on-surface-variant)]">You’ll carry it through the whole month: every document you build is about this client, and you’ll submit each one to the role that receives it — a Node mentor plays them.</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((p) => {
          const on = current === p.id;
          return (
            <button key={p.id} type="button" onClick={() => onPick(p.id)} className={cn("flex items-start gap-3 rounded-2xl border bg-white p-3 text-left transition-all hover:-translate-y-0.5", on ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15" : "border-black/[0.08]")}>
              <span className="flex size-10 flex-none items-center justify-center rounded-xl text-white" style={{ background: p.color }}><MaterialSymbol className="text-[21px]" name={p.icon} /></span>
              <span className="grid min-w-0 gap-0.5">
                <span className="flex items-center gap-1.5"><b className="text-[14px] text-[var(--primary)]">{p.client}</b>{on ? <MaterialSymbol className="text-[16px] text-[var(--bridge-teal)]" name="check_circle" /> : null}</span>
                <span className="text-[12px] font-semibold text-black/55">{p.name} · {p.industry}</span>
                <span className="text-[12.5px] leading-5 text-[var(--on-surface-variant)]">{p.brief}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- one row of the step-by-step ---------- */
function StepRow({ id, n, done, why, children, aside }: { id: string; n: number; done: boolean; why?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <li id={id} className="grid scroll-mt-4 grid-cols-[28px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-b sm:grid-cols-[28px_minmax(0,1fr)_auto] border-black/[0.05] py-3 last:border-0 target:rounded-xl target:bg-[#fff8fb]">
      <span className={cn("mt-0.5 flex size-7 items-center justify-center rounded-full text-[12px] font-black transition-colors", done ? "bg-[var(--bridge-teal)] text-white" : "bg-[#f1f2f3] text-black/50")}>{done ? <MaterialSymbol className="text-[16px]" name="check" /> : n}</span>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5">{children}{why ? <span className="text-[11.5px] leading-5 text-black/40">{why}</span> : null}</div>
      {aside ? <div className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1">{aside}</div> : null}
    </li>
  );
}
function Tick({ item, ticks, disabled, onTick, children }: { item: SubTask; ticks: string[]; disabled: boolean; onTick: (id: string, on: boolean) => void; children?: ReactNode }) {
  const on = ticks.includes(item.id);
  return (
    <label className={cn("flex cursor-pointer items-start gap-2 rounded-lg px-1 py-0.5 text-[13px] leading-5", disabled && "cursor-default")}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => onTick(item.id, e.target.checked)} className="mt-0.5 size-4 flex-none accent-[var(--bridge-teal)]" />
      <span className={cn(on ? "text-black/45 line-through decoration-black/25" : "text-[var(--primary)]")}>{children ?? item.text}</span>
    </label>
  );
}

/* the lesson's tasks as breadcrumbs: where you stand is lit, what's done is ticked — click any crumb to go there */
type Crumb = { key: string; label: string; status: string; decision: boolean };
function TaskCrumbs({ tasks, current, note, onGo }: { tasks: Crumb[]; current: string; note?: string; onGo: (key: string) => void }) {
  const all = [...tasks, { key: "wrap", label: "Wrap up", status: tasks.every((x) => x.status === "submitted" || x.status === "approved") ? "approved" : "none", decision: false }];
  return (
    <nav aria-label="Your tasks">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[12px]">
        {all.map((c, i) => {
          const now = c.key === current, done = c.status === "approved" || c.status === "submitted", back = c.status === "changes";
          return (
            <li key={c.key} className="flex items-center gap-1">
              {i ? <MaterialSymbol className={cn("text-[14px]", done || now ? "text-[var(--bridge-teal)]" : "text-black/25")} name="chevron_right" /> : null}
              <button type="button" onClick={() => onGo(c.key)} aria-current={now ? "step" : undefined} title={c.key === "wrap" ? "Wrap up the lesson" : `${c.label} — ${STATUS[c.status]?.short ?? "To do"}`}
                className={cn("flex max-w-[340px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-semibold transition-colors",
                  now ? "bg-[var(--electric-pink)] text-white shadow-sm shadow-pink-500/30" : back ? "bg-[#fdecf2] text-[#a3104a] hover:bg-[#fbdbe7]" : done ? "bg-[#e6f3f3] text-[#005a5a] hover:bg-[#d5ecec]" : "bg-[#f1f2f3] text-black/55 hover:bg-[#e6e8ea] hover:text-[var(--primary)]")}>
                {now ? <span className="relative flex size-2 flex-none"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span>
                  : <MaterialSymbol className="flex-none text-[15px]" name={c.key === "wrap" ? "flag" : c.status === "approved" ? "check_circle" : c.status === "submitted" ? "send" : back ? "replay" : c.decision ? "help" : "radio_button_unchecked"} />}
                <span className="truncate">{c.label}</span>
                {now && note ? <span className="flex-none rounded-full bg-white/20 px-1.5 text-[10.5px] font-bold">{note}</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- one task: step by step, the tool, then submit ---------- */
function TaskView({ d, all, sub, docs, lesson, day, project, kit, onSaved, onDoc, onGo, crumbs }: { crumbs: Crumb[]; d: Deliverable; idx: number; total: number; all: Deliverable[]; sub: SubmissionView | undefined; docs: Record<string, WorkspaceDocView>; lesson: Lesson; day: number; project: Project | null; kit: LessonKit | null; onSaved: (s: SubmissionView) => void; onDoc: (doc: WorkspaceDocView) => void; onGo: (key: string) => void }) {
  const { lookups } = useDetail();
  const { pushToast } = useToast();
  const t = d.template ? lookups.templates[d.template] ?? null : null;
  const g = taskGuide(lesson, d, all, lookups);
  const w = lesson.workflows.find((x) => x.id === d.workflowId);
  const step = w?.steps.find((x) => x.id === d.stepId) ?? null;
  const wc = (w?.contract ?? {}) as Record<string, unknown>;
  const [ticks, setTicks] = useState<string[]>(sub?.ticks ?? []);
  const [scores, setScores] = useState<Record<string, number>>(sub?.selfScores ?? {});
  const [promptCopied, setPromptCopied] = useState(false);
  const rubric = rubricOf(lesson, d, all, lessonOfRubric(lookups));
  const self = gradeOf(rubric, scores as Record<string, Score>);
  const reviewed = [...(sub?.history ?? [])].reverse().find((h) => h.kind !== "submitted" && h.scores);
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<string | null>(null);
  const [cmdCopied, setCmdCopied] = useState(false);
  const kitRefs = kit?.unlocked ? (kit.steps[d.key] ?? []) : [];
  /* the task's two views: its steps, and what the agent kit gives you for it */
  const [pane, setPane] = useState<"steps" | "kit" | "review">(sub?.status === "changes" ? "review" : "steps");
  const command = commandOf(kitRefs);
  const [copied, setCopied] = useState(false);
  const status = sub?.status ?? "none";
  const locked = status === "submitted" || status === "approved";
  const reviewer = roleWithPerson(project, d.to);
  const lastChange = [...(sub?.history ?? [])].reverse().find((h) => h.kind === "changes");
  const doc = docs[d.ref];
  const filled = !!doc && ((doc.text ?? "").trim().length >= 20 || !!doc.upload);
  /* the to-dos to tick; the "check" points are graded on the rubric instead */
  const todo = g.subtasks.filter((x) => x.when !== "check");
  const open = todo.filter((x) => !ticks.includes(x.id));
  const scoredOk = self.scored === self.count && self.zeros === 0;
  const links = linksOf(lesson, d, all);
  const out = d.kind === "decision" ? "the decision" : `the ${d.artifact}`;
  const docTitle = d.kind === "decision" ? `Decision brief — ${step?.title ?? d.step}` : d.kind === "work" ? `Your work — ${lesson.title}` : t ? templateTitle(t) : d.artifact;
  const starter = d.kind === "decision" ? `# Decision brief — ${step?.title ?? d.step}\n\n## The question\n${list(wc.decisions)[0] ?? step?.title ?? ""}\n\n## Options and what each leads to\n${list(wc.branches).map((b) => `- ${b}`).join("\n") || "- Yes → \n- No → "}\n\n## What we know (evidence)\n\n## My recommendation\n\n## What I need from you\n` : undefined;

  async function tick(item: string, on: boolean) {
    setTicks((cur) => (on ? [...cur, item] : cur.filter((x) => x !== item)));
    try { const v = (await api("/api/program/submissions", { action: "tick", day, fid: lesson.fid, key: d.key, item, on })) as unknown as SubmissionView; setTicks(v.ticks); onSaved(v); }
    catch { setTicks((cur) => (on ? cur.filter((x) => x !== item) : [...cur, item])); }
  }
  async function score(criterion: string, s: Score | null) {
    const prev = scores;
    setScores((cur) => { const n = { ...cur }; if (s === null) delete n[criterion]; else n[criterion] = s; return n; });
    try { const v = (await api("/api/program/submissions", { action: "score", day, fid: lesson.fid, key: d.key, criterion, score: s })) as unknown as SubmissionView; setScores(v.selfScores); onSaved(v); }
    catch (e) { setScores(prev); pushToast({ variant: "error", title: "Score not saved", description: e instanceof Error ? e.message : "Try again." }); }
  }
  async function submit() {
    setBusy(true);
    try {
      onSaved((await api("/api/program/submissions", { action: "submit", day, fid: lesson.fid, key: d.key })) as unknown as SubmissionView);
      pushToast({ variant: "success", title: d.kind === "decision" ? `Decision requested from the ${d.to}` : `Submitted to the ${d.to}`, description: "A mentor reviews it as that role." });
      window.dispatchEvent(new Event("node:badges"));
    } catch (e) {
      pushToast({ variant: "error", title: "Not submitted", description: e instanceof Error ? e.message : "Try again." });
    } finally { setBusy(false); }
  }

  /* the step-by-step, in the order the work runs */
  const ofK = (k: { name: string; type: string }) => (x: SubTask) => (x.when === "before" || x.when === "along") && (x.source.startsWith(`${k.name} ·`) || (x.source === k.type && x.text.endsWith(k.name)));
  const before = g.subtasks.filter((x) => x.when === "before" && !g.knowledge.some((k) => ofK(k)(x)));
  const along = g.subtasks.filter((x) => x.when === "along");
  const allDone = (items: SubTask[]) => items.every((x) => ticks.includes(x.id));
  let n = 0;
  const rows: ReactNode[] = [];
  if (before.length) rows.push(
    <StepRow key="before" id="s-before" n={++n} done={allDone(before)} why={<>so you start from something solid{links.input.length ? <> — <b>{links.input.map((x) => x.label).join(", ")}</b></> : null}</>}>
      <b className="text-[14px] text-[var(--primary)]">Make sure you can start</b>
      {before.map((x) => <Tick key={x.id} item={x} ticks={ticks} disabled={locked} onTick={tick} />)}
    </StepRow>,
  );
  for (const k of g.knowledge) {
    const items = g.subtasks.filter(ofK(k));
    const entry = k.ref ? lookups.knowledge[k.ref] : undefined;
    const bt = entry && k.ref ? boardTemplate(entry, k.ref) : null;
    const tone = TYPE_TONE[k.type] ?? "#475569";
    rows.push(
      <StepRow key={`k-${k.name}`} id={`s-k-${k.name.replace(/\W+/g, "-")}`} n={++n} done={items.length ? allDone(items) : false} why={k.when === "before" ? <>frames the whole workflow — every task here should follow it</> : <>gives you what goes into {out}{entry?.use ? <> — {/^to\s/i.test(entry.use) ? <>it helps you {entry.use.replace(/^to\s+/i, "")}</> : <>it’s good for {lc(entry.use)}</>}</> : null}</>} aside={bt ? <button type="button" onClick={() => setBoard(board === k.name ? null : k.name)} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors", board === k.name ? "bg-[var(--deep-indigo)] text-white" : "bg-[#fff6c2] text-[#5c4a00] hover:bg-[#ffef99]")}><MaterialSymbol className="text-[16px]" name="sticky_note_2" />{board === k.name ? "Close the board" : "Open the board"}</button> : undefined}>
        <span className="flex flex-wrap items-center gap-2">
          <b className="text-[14px] text-[var(--primary)]">{k.when === "before" ? "Apply" : "Use"}</b>
          <KnowledgeChip name={k.name} refId={k.ref} />
          <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white" style={{ background: tone }}>{k.type}</span>
          <span className="text-[11.5px] text-black/40">{k.when === "before" ? "throughout this workflow" : "in this step"}</span>
        </span>
        {k.what ? (
          <details className="group text-[12.5px] leading-5 text-[var(--on-surface-variant)]">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[12px] font-semibold text-black/45 hover:text-[var(--primary)]"><MaterialSymbol className="text-[15px]" name="info" />What is this?<MaterialSymbol className="text-[15px] transition-transform group-open:rotate-180" name="expand_more" /></summary>
            <p className="pt-1">{k.what}</p>
          </details>
        ) : null}
        {items.map((x) => <Tick key={x.id} item={x} ticks={ticks} disabled={locked} onTick={tick} />)}
        {bt && board === k.name ? <div className="pt-1"><LivingDoc key={bt.id} docRef={bt.id} t={bt} title={k.name} initial={docs[bt.id]} disabled={false} onSaved={onDoc} /></div> : null}
      </StepRow>,
    );
  }
  const loose = along.filter((x) => !g.knowledge.some((k) => ofK(k)(x)));
  if (loose.length) rows.push(
    <StepRow key="brief" id="s-brief" n={++n} done={allDone(loose)} why={<>this is what the {reviewer} needs in front of them to decide</>}>
      <b className="text-[14px] text-[var(--primary)]">{d.kind === "decision" ? "Prepare the decision brief" : "Work it through"}</b>
      {loose.map((x) => <Tick key={x.id} item={x} ticks={ticks} disabled={locked} onTick={tick} />)}
    </StepRow>,
  );
  for (const ln of g.lenses) {
    const item = g.subtasks.find((x) => x.when === "see" && x.text === ln.note);
    rows.push(
      <StepRow key={`l-${ln.id}`} id={`s-l-${ln.id}`} n={++n} done={item ? ticks.includes(item.id) : true} why={<>the {reviewer} will look at {out} through this lens — answer it in the document</>}>
        <span className="flex flex-wrap items-center gap-2"><b className="text-[14px] text-[var(--primary)]">Query with the</b><span className="flex items-center gap-1 rounded-md bg-[#fff6d6] px-2 py-0.5 text-[12.5px] font-bold text-[#6b4f00]"><MaterialSymbol className="text-[15px]" name={ln.icon} />{ln.name} lens</span>{ln.holder ? <span className="text-[11.5px] text-black/45">as the {roleWithPerson(project, ln.holder)} would</span> : null}</span>
        {item ? <Tick item={item} ticks={ticks} disabled={locked} onTick={tick}>{ln.note}</Tick> : null}
        {ln.asks.length ? <span className="text-[12px] leading-5 text-black/50">They’ll also ask: {ln.asks.map((a) => `“${a}”`).join(" ")}</span> : null}
      </StepRow>,
    );
  }
  /* what still stands between this task and submitting it — said plainly */
  const nextUp = locked ? STATUS[status].label(d.to)
    : !filled ? `Write ${out} in the editor`
    : open.length ? `Tick the ${open.length} step${open.length === 1 ? "" : "s"} left`
    : self.scored < self.count ? `Self-check: ${self.count - self.scored} of ${self.count} left to score`
    : self.zeros ? `Fix the ${self.zeros} you scored 0`
    : self.pass ? "Ready to submit" : `Your self-check is ${self.pct}% — under the ${PASS_PCT}% pass`;
  const ready = !locked && filled && open.length === 0 && scoredOk;
  const [focus, setFocus] = useState(false); // the editor full width
  /* the self-check opens itself once there's something to check (a draft, or a score) — or by hand */
  const [checkOpen, setCheckOpen] = useState<boolean | null>(null);
  const showCheck = checkOpen ?? (filled || self.scored > 0 || locked);
  const hasAgent = (!!kit && kitRefs.length > 0) || !!step?.ask;
  const hereNote = status === "approved" ? "" : status === "submitted" ? "in review" : status === "changes" ? "rework" : filled && open.length === 0 ? `self-check ${self.scored}/${rubric.length}` : `${todo.length - open.length}/${todo.length} steps`;

  /* the agent: the command to run, the kit files for this task, and the prompt */
  const agentPane = (
    <div className="grid gap-3 p-4">
      {kit && kitRefs.length ? (
        <>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn(kicker, "flex items-center gap-1.5 text-[9.5px] text-[#0284c7]")}><MaterialSymbol className="text-[14px]" name="smart_toy" />{kit.stage} kit · for this task</span>
            <a href={kitHref(kit, lesson.fid, kitRefs[0].path)} className="text-[12px] font-bold text-[var(--bridge-teal)]">Open in the kit →</a>
          </span>
          {command ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#0d1117] px-3 py-2 font-mono text-[12.5px] text-[#e6edf3]">
              <span className="text-[#4fd1c5]">$</span><span className="min-w-0 flex-1 truncate">/{command} {project ? `"${project.client}"` : "<initiative>"}</span>
              <button type="button" onClick={() => void navigator.clipboard.writeText(`/${command} ${project ? `"${project.client}"` : ""}`.trim()).then(() => { setCmdCopied(true); setTimeout(() => setCmdCopied(false), 1500); })} className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-sans text-[11px] font-bold hover:bg-white/20"><MaterialSymbol className="text-[14px]" name={cmdCopied ? "check" : "content_copy"} />{cmdCopied ? "Copied" : "Copy"}</button>
            </div>
          ) : null}
          <span className="text-[12px] leading-5 text-[var(--on-surface-variant)]">{d.kind === "decision" ? "Run it to have your agent prepare the decision brief — it never decides." : "Run it in your project folder: your agent drafts with the skills below, the reviewers check it against the rubric — then you check it."}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["skills", "agents", "rubrics", "templates"] as const).map((layer) => {
              const files = kitRefs.filter((r) => r.layer === layer);
              return files.length ? (
                <div key={layer} className="grid content-start gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-black/45">{layer === "agents" ? "Reviewers & helpers" : layer === "rubrics" ? "Rubric" : layer === "templates" ? "Template" : "Skills"}</span>
                  <div className="flex flex-wrap gap-1.5">{files.map((r) => <KitChip key={r.path} r={r} href={kitHref(kit, lesson.fid, r.path)} />)}</div>
                </div>
              ) : null;
            })}
          </div>
        </>
      ) : null}
      {step?.ask ? (
        <div className="grid gap-2.5 rounded-2xl bg-[var(--deep-indigo)] px-4 py-3.5 text-white">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn(kicker, "flex items-center gap-1.5 text-[9.5px] text-[#4fd1c5]")}><MaterialSymbol className="text-[15px]" name="chat" />Ask your agent · the prompt</span>
            <button type="button" onClick={() => void navigator.clipboard.writeText(`${step.ask}${project ? `\n\nContext: ${project.client} — ${project.brief} ${project.today}` : ""}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })} className="flex items-center gap-1 rounded-full bg-[#4fd1c5] px-3 py-1 text-[11.5px] font-bold text-[#0d1117] hover:brightness-110"><MaterialSymbol className="text-[15px]" name={copied ? "check" : "content_copy"} />{copied ? "Copied" : "Copy the prompt"}</button>
          </span>
          <div className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[12.5px] leading-6 text-[#e6edf3]">
            <p className="whitespace-pre-wrap">{step.ask}</p>
            {project ? <p className="whitespace-pre-wrap border-t border-white/10 pt-2 text-white/55"><span className="text-[#ffd666]">Context:</span> {project.client} — {project.brief} {project.today}</p> : null}
          </div>
          <span className="text-[11.5px] leading-5 text-white/50">Paste it into your agent with the kit loaded. Check what comes back against the self-check — your agent drafts, you decide.</span>
        </div>
      ) : null}
    </div>
  );

  /* the review thread: what the reviewer said, in their own voice */
  const reviewPane = (
    <div className="grid gap-2 p-4">
      {(sub?.history ?? []).map((h, i) => (
        <div key={i} className="grid gap-1.5">
          {h.kind !== "submitted" ? (() => {
            const r = reactionOf({ project, role: d.to, kind: h.kind, artifact: d.artifact, pct: h.grade?.pct, comment: h.comment, seed: `${d.key}|${h.at}` });
            return (
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 flex-none items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: r.color }}>{r.initials}</span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="text-[11.5px] text-black/50"><b className="text-[var(--primary)]">{r.person}</b> · {r.role}</span>
                  <span className={cn("rounded-2xl rounded-tl-sm px-3 py-2 text-[13px] leading-5", h.kind === "changes" ? "bg-[#fff4f7] text-[#5c0a2a]" : "bg-[#effaf9] text-[#003f3f]")}>{r.text}</span>
                </span>
              </div>
            );
          })() : null}
          <div className={cn("flex items-start gap-2 rounded-xl px-3 py-2 text-[12.5px]", h.kind === "changes" ? "bg-[#fdecf2] text-[#5c0a2a]" : h.kind === "approved" ? "bg-[#e6f3f3] text-[#003f3f]" : "bg-[#f6f7f8] text-[var(--on-surface-variant)]")}>
            <MaterialSymbol className="mt-px text-[16px]" name={h.kind === "changes" ? "replay" : h.kind === "approved" ? "verified" : "send"} />
            <span suppressHydrationWarning><b>{h.kind === "submitted" ? `You submitted to the ${d.to}` : `${h.role} ${h.kind === "approved" ? (d.kind === "decision" ? "decided yes" : "approved it") : (d.kind === "decision" ? "decided no" : "asked for changes")}`}</b>{h.comment ? <>: “{h.comment}”</> : null}{h.grade ? <span className="ml-1.5 inline-block align-middle"><GradeChip g={h.grade} label={h.kind === "submitted" ? "Self-score" : "Graded"} /></span> : null}{h.kind !== "submitted" && h.scores ? (() => { const gaps = rubric.filter((c) => h.scores![c.id] !== undefined && h.scores![c.id] < 2); return gaps.length ? <span className="mt-1 grid gap-0.5 text-[11.5px]">{gaps.map((c) => <span key={c.id}>· <b>{SCORE_LABEL[h.scores![c.id] as Score]}</b> — {c.text}</span>)}</span> : null; })() : null}{h.checks.length ? <span className="block text-[11.5px] opacity-75">Verified: {h.checks.join(" · ")}</span> : null}<span className="ml-1.5 text-[11px] opacity-60">{h.at ? new Date(h.at).toLocaleString() : ""}</span></span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid gap-3">
      {/* the task, in one line: where it comes from → what you build → how it's checked → who reviews it → what it feeds */}
      <header className="grid gap-2.5 overflow-hidden rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
        <TaskCrumbs tasks={crumbs} current={d.key} note={hereNote} onGo={onGo} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="grid min-w-0 flex-1 leading-tight">
            {d.by !== "You" ? <span className={cn(kicker, "text-[9.5px] text-black/45")}>You, as the {d.by}</span> : null}
            <b className="truncate text-[18px] text-[var(--primary)]">{d.kind === "decision" ? `Get the decision: ${step?.title ?? d.step}` : d.artifact}</b>
          </span>
          <span className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold", STATUS[status].cls)}><MaterialSymbol className="text-[15px]" name={STATUS[status].icon} />{d.kind === "decision" && status === "approved" ? "Decided: yes" : d.kind === "decision" && status === "changes" ? "Decided: no — rework" : STATUS[status].short}</span>
          </span>
        </div>
        {lastChange && status === "changes" ? <div className="flex items-start gap-2 rounded-xl bg-[#fdecf2] px-3 py-2.5 text-[13px] text-[#5c0a2a]"><MaterialSymbol className="mt-px text-[17px]" name="replay" /><span><b>{lastChange.role}:</b> “{lastChange.comment}”</span></div> : null}
      </header>

      {/* the workspace: the task's steps on the left, the document open beside them */}
      <div className={cn("grid items-start gap-3", !focus && "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]")}>
        {!focus ? (
          <section className="relative grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
            <nav className="flex gap-1 overflow-x-auto border-b border-black/[0.06] px-2 pt-2" role="tablist" aria-label="This task">
              {([
                ["steps", "Steps", "checklist", `${todo.length - open.length}/${todo.length}`],
                ...(hasAgent ? [["kit", "Agent", "smart_toy", kitRefs.length ? `${kitRefs.length + (command ? 1 : 0)}` : ""] as const] : []),
                ...(sub?.history.length ? [["review", "Review", "rate_review", `${sub.history.length}`] as const] : []),
              ] as const).map(([id, label, icon, count]) => (
                <button key={id} type="button" role="tab" aria-selected={pane === id} onClick={() => setPane(id)}
                  className={cn("-mb-px flex flex-none items-center gap-1.5 border-b-[3px] px-3 py-2.5 text-[13px] font-bold transition-colors", pane === id ? "border-[var(--electric-pink)] text-[var(--primary)]" : "border-transparent text-black/50 hover:text-[var(--primary)]")}>
                  <MaterialSymbol className={cn("text-[17px]", pane === id && "text-[var(--electric-pink)]")} name={icon} />{label}
                  {count ? <span className="rounded-full bg-black/[0.05] px-1.5 py-px text-[10.5px] text-black/50">{count}</span> : null}
                </button>
              ))}
            </nav>

            {pane === "steps" ? (
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
                {rows.length ? <ol className="min-w-0 px-4">{rows}</ol> : null}
                {/* check it before you submit: the same rubric the reviewer grades on */}
                <div id="s-rubric" className="grid scroll-mt-4 gap-2 border-t border-black/[0.06] bg-[#fbfbfc] px-4 py-3.5">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onClick={() => setCheckOpen(!showCheck)} aria-expanded={showCheck} className="flex items-center gap-2 text-left">
                      <MaterialSymbol className={cn("text-[18px] text-black/40 transition-transform", showCheck && "rotate-90")} name="chevron_right" />
                      <b className="text-[14px] text-[var(--primary)]">Self-check</b>
                      {self.scored ? <GradeChip g={self} label="You:" /> : <span className="text-[11.5px] text-black/45">{rubric.length} criteria{filled ? "" : " · once your draft is written"}</span>}
                      {sub?.grade ? <GradeChip g={sub.grade} label={`${d.to}:`} /> : null}
                    </button>
                    {showCheck ? <button type="button" onClick={() => void navigator.clipboard.writeText(selfCheckPrompt(d.kind === "decision" ? "decision brief" : d.artifact, rubric, project ? `${project.client} — ${project.brief}` : undefined) + (doc?.text ?? "")).then(() => { setPromptCopied(true); setTimeout(() => setPromptCopied(false), 1600); })} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[var(--primary)] ring-1 ring-black/10 hover:ring-black/30"><MaterialSymbol className="text-[15px]" name={promptCopied ? "check" : "smart_toy"} />{promptCopied ? "Copied" : "Ask your agent to score it"}</button> : null}
                  </span>
                  {showCheck ? (
                    <>
                      <span className="text-[12px] leading-5 text-black/50">Score your own work: 0 missing · 1 partial · 2 meets. The {reviewer} grades it on these same criteria — it passes at {PASS_PCT}% with no 0s.</span>
                      <RubricTable rubric={rubric} scores={scores} theirs={reviewed?.scores} disabled={locked} onScore={(id, s) => void score(id, s)} />
                    </>
                  ) : null}
                </div>
              </div>
            ) : pane === "kit" ? agentPane : reviewPane}

            {/* what's left, and submit — always in reach */}
            <footer id="s-submit" className="sticky bottom-0 z-[1] flex flex-wrap items-center gap-3 border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur">
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className={cn("text-[13px] font-bold", ready ? "text-[var(--bridge-teal)]" : locked ? "text-[#075985]" : "text-[var(--primary)]")}>{nextUp}</span>
                <span className="text-[11.5px] text-black/45">Goes to the {reviewer}{links.next ? <> · then feeds <b>{links.next.label}</b></> : null}</span>
              </span>
              {!locked ? (
                <button type="button" disabled={busy || !ready} onClick={() => void submit()} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.05em] text-white shadow-md shadow-pink-500/20 disabled:cursor-not-allowed disabled:bg-[#e3e5e6] disabled:text-black/50 disabled:shadow-none">
                  <MaterialSymbol className="text-[16px]" name={d.kind === "decision" ? "gavel" : "send"} />{busy ? "Submitting…" : status === "changes" ? "Resubmit" : d.kind === "decision" ? "Ask to decide" : "Submit"}
                </button>
              ) : null}
            </footer>
          </section>
        ) : null}

        {/* the document, always open — it saves as you type */}
        <section id="the-doc" className="grid scroll-mt-4 gap-2 xl:sticky xl:top-0">
          <span className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className={cn(kicker, "flex items-center gap-1.5 text-[9.5px] text-black/45")}><MaterialSymbol className="text-[14px]" name="edit_document" />{d.kind === "decision" ? "The decision brief" : `The ${d.artifact}`}{project ? ` · ${project.client}` : ""} · saves as you type</span>
            <button type="button" onClick={() => setFocus((v) => !v)} className="hidden items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[var(--primary)] ring-1 ring-black/10 hover:ring-black/30 xl:flex" title={focus ? "Show the steps beside the editor" : "Give the editor the full width"}>
              <MaterialSymbol className="text-[15px]" name={focus ? "close_fullscreen" : "open_in_full"} />{focus ? "Show the steps" : "Focus"}
            </button>
          </span>
          <LivingDoc key={d.ref} docRef={d.ref} t={t} title={docTitle} initial={doc} disabled={locked} onSaved={onDoc} starter={starter} />
          {focus ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
              <span className="min-w-0 flex-1 text-[13px] font-bold text-[var(--primary)]">{nextUp}</span>
              <button type="button" onClick={() => setFocus(false)} className="rounded-full bg-[var(--primary)] px-4 py-2 text-[12.5px] font-bold text-white">Back to the steps</button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ---------- 7 · Do it: the scenario, your tasks (each step by step, in a tool), then wrap up ---------- */
export function DoPanel({ lesson: l, day, state, project, subs, docs, kit = null, onSub, onDoc, onPickProject, onDone }: {
  lesson: Lesson; day: number; state: LessonState; project: Project | null; subs: Record<string, SubmissionView>; docs: Record<string, WorkspaceDocView>; kit?: LessonKit | null;
  onSub: (s: SubmissionView) => void; onDoc: (d: WorkspaceDocView) => void; onPickProject: (id: string) => void; onDone: (d: boolean) => void;
}) {
  const deliverables = deliverablesOf(l);
  const [tab, setTab] = useState<string>(() => (deliverables.find((d) => !["submitted", "approved"].includes(subs[`${l.fid}|${d.key}`]?.status ?? "")) ?? deliverables[0])?.key ?? "wrap");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [brief, setBrief] = useState(false);
  const subOf = (d: Deliverable) => subs[`${l.fid}|${d.key}`];
  const handed = deliverables.filter((d) => ["submitted", "approved"].includes(subOf(d)?.status ?? "")).length;
  const allIn = handed === deliverables.length;
  const picking = /pick your project/i.test(l.title);
  const criteria = [...(Array.isArray((l.contract ?? {}).controls?.criteria) ? ((l.contract ?? {}).controls!.criteria as string[]) : []), ...(l.criteria ?? [])];
  const mainRole = deliverables.find((d) => d.by !== "You")?.by;
  const cur = deliverables.findIndex((d) => d.key === tab);
  const crumbs: Crumb[] = deliverables.map((d) => ({ key: d.key, label: d.kind === "decision" ? d.artifact.replace(/^Decision · /, "Decide: ") : d.artifact, status: subOf(d)?.status ?? "none", decision: d.kind === "decision" }));
  /* the lesson's grade: the average of what's been graded */
  const graded = deliverables.map((d) => subOf(d)?.grade).filter((x): x is GradeView => !!x);
  const lessonGrade: GradeView | null = graded.length ? { total: graded.reduce((a, x) => a + x.total, 0), max: graded.reduce((a, x) => a + x.max, 0), pct: Math.round(graded.reduce((a, x) => a + x.pct, 0) / graded.length), pass: graded.every((x) => x.pass) } : null;

  return (
    <div className="grid gap-4">
      {picking ? <ProjectPicker current={project?.id ?? ""} onPick={onPickProject} /> : null}

      {/* the context, in one bar: the project and your role (the brief on demand), the lesson's progress, the kit, help */}
      {!picking ? (
        <section className="grid overflow-hidden rounded-2xl text-white" style={{ background: project ? `linear-gradient(120deg, #0d1117 0%, #0d1117 65%, color-mix(in srgb, ${project.color} 45%, #0d1117) 100%)` : "#0d1117" }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
            {project ? (
              <button type="button" onClick={() => setBrief((v) => !v)} className="flex min-w-0 items-center gap-2.5 text-left" aria-expanded={brief}>
                <span className="flex size-9 flex-none items-center justify-center rounded-xl" style={{ background: project.color }}><MaterialSymbol className="text-[19px]" name={project.icon} /></span>
                <span className="grid min-w-0 leading-tight">
                  <span className="truncate text-[13.5px] font-bold">{project.client} · {project.name}</span>
                  <span className="flex items-center gap-1 truncate text-[11.5px] text-white/60">{mainRole ? <>You’re the <b className="text-white/90">{mainRole}</b> · </> : null}{brief ? "Hide the brief" : "Read the brief"}<MaterialSymbol className={cn("text-[15px] transition-transform", brief && "rotate-180")} name="expand_more" /></span>
                </span>
              </button>
            ) : !l.fid.startsWith("kickoff.") ? (
              <span className="flex items-center gap-2 text-[12.5px] text-[#ffd666]"><MaterialSymbol className="text-[18px]" name="info" />Pick your practice project on Day 0 — every task is about it.</span>
            ) : <span className="text-[12.5px] text-white/70">Day 0 · kick-off</span>}
            <span className="ml-auto flex flex-wrap items-center gap-2">
              {kit ? (kit.unlocked ? (
                <>
                  <a href={kitHref(kit, l.fid)} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-bold hover:bg-white/15" title="Open this lesson's agent kit"><MaterialSymbol className="text-[15px]" name="smart_toy" />Kit</a>
                </>
              ) : <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] text-white/60"><MaterialSymbol className="text-[14px]" name="lock" />Kit opens Day {kit.firstDay}</span>) : null}
              <AskButton day={day} dayTitle="" lesson={{ fid: l.fid, code: l.code, title: l.title }} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-bold hover:bg-white/15"><MaterialSymbol className="text-[15px]" name="help" />Ask</AskButton>
            </span>
          </div>
          {project && brief ? (
            <div className="grid gap-3 border-t border-white/10 px-4 py-3 text-[13px] leading-6 text-white/80 md:grid-cols-3">
              <p><b className="text-white">The problem.</b> {project.problem} {project.today} <b className="text-white">Why now:</b> {project.whyNow}</p>
              <div className="grid gap-1"><b className="text-white">Systems today</b>{project.systems.map((x) => <span key={x}>· {x}</span>)}</div>
              <div className="grid gap-1"><b className="text-white">In numbers · constraints</b>{[...project.numbers, ...project.constraints].map((x) => <span key={x}>· {x}</span>)}</div>
              <div className="flex flex-wrap gap-1.5 md:col-span-3">{project.people.map((p) => <span key={p.role} className="rounded-lg bg-white/10 px-2 py-1 text-[12px]"><b className="text-white">{p.role}</b> · {p.name}</span>)}</div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* the capstone: the certificate it ends with */}
      {l.fid.startsWith("capstone.") ? (
        <Link href="/dashboard/certificate" className="flex items-center gap-3 rounded-2xl bg-[var(--deep-indigo)] px-4 py-3 text-white transition-transform hover:-translate-y-px">
          <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-[#d4a017]"><MaterialSymbol className="text-[22px]" filled name="workspace_premium" /></span>
          <span className="grid min-w-0 flex-1 leading-tight"><b className="text-[14px]">Your certificate</b><span className="text-[12.5px] text-white/60">Issued when you finish Day 30 — see it, claim it, add it to LinkedIn.</span></span>
          <MaterialSymbol className="text-[20px] text-white/60" name="arrow_forward" />
        </Link>
      ) : null}
      {kit && l.fid.startsWith("kickoff.") ? <KitStrip kit={kit} lesson={l} /> : null}

        <div className="min-w-0">
          {l.fid.startsWith("kickoff.") ? (
            <KickoffDo lesson={l} day={day} state={state} needsProject={picking && !project} onDone={onDone} />
          ) : cur >= 0 ? (
            <TaskView key={`${l.fid}|${deliverables[cur].key}`} d={deliverables[cur]} idx={cur} total={deliverables.length} all={deliverables} sub={subOf(deliverables[cur])} docs={docs} lesson={l} day={day} project={project} kit={kit} onSaved={onSub} onDoc={onDoc} onGo={(k) => setTab(k)} crumbs={crumbs} />
          ) : (
            <div className="grid gap-4">
            {crumbs.length ? <section className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3"><TaskCrumbs tasks={crumbs} current="wrap" onGo={setTab} /></section> : null}
            <div className="grid gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 lg:grid-cols-2">
              <div className="grid content-start gap-3">
                <span className="flex flex-wrap items-center justify-between gap-2"><span className={cn(kicker, "text-black/45")}>Your submissions</span>{lessonGrade ? <GradeChip g={lessonGrade} label={`Lesson grade · ${graded.length}/${deliverables.length} graded ·`} /> : null}</span>
                <ul className="grid gap-1.5">
                  {deliverables.map((d) => { const s = subOf(d)?.status ?? "none"; return <li key={d.key}><button type="button" onClick={() => setTab(d.key)} className="flex w-full items-center gap-2 rounded-xl border border-black/[0.06] px-3 py-2 text-left text-[13px] hover:bg-[#f8f9fa]"><span className={cn("size-2 rounded-full", STATUS[s].dot)} /><b className="min-w-0 flex-1 truncate text-[var(--primary)]">{d.artifact}</b><span className="text-[11.5px] text-black/45">→ {d.to}</span>{subOf(d)?.grade ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", subOf(d)!.grade!.pass ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#fdecf2] text-[#8a0f3f]")}>{subOf(d)!.grade!.pct}%</span> : null}<span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS[s].cls)}>{STATUS[s].short}</span></button></li>; })}
                </ul>
                {criteria.length ? (
                  <div className="grid gap-1.5 rounded-xl bg-[#fdf8ea] p-3">
                    <span className={cn(kicker, "text-[9.5px] text-[#8a6500]")}>The gate checks{l.gate ? ` · ${l.gate}` : ""}</span>
                    <ul className="grid gap-1">{criteria.map((c) => <li key={c} className="flex gap-1.5 text-[13px] text-[var(--primary)]"><MaterialSymbol className="mt-px text-[16px] text-[#c49000]" name="task_alt" />{c}</li>)}</ul>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {state.done ? (
                    <button type="button" onClick={() => onDone(false)} className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-[13.5px] font-bold text-[var(--on-surface-variant)] hover:border-black/30"><MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="check_circle" />Completed — undo</button>
                  ) : (
                    <button type="button" disabled={!allIn} onClick={() => onDone(true)} className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-[13.5px] font-black uppercase tracking-[0.06em] text-white disabled:cursor-not-allowed disabled:bg-[#e3e5e6] disabled:text-black/60"><MaterialSymbol className="text-[18px]" name="task_alt" />Mark lesson complete</button>
                  )}
                  {!allIn && !state.done ? <span className="text-[13px] text-[var(--on-surface-variant)]">Submit every task first ({deliverables.length - handed} left).</span> : null}
                </div>
              </div>
              {l.quiz.length ? (
                <div className="grid content-start gap-3">
                  <span className={cn(kicker, "text-black/45")}>Check yourself</span>
                  {l.quiz.map((q, qi) => {
                    const picked = answers[qi];
                    return (
                      <div key={q.q} className="grid gap-1.5">
                        <b className="text-[13.5px] text-[var(--primary)]">{q.q}</b>
                        {q.options.map((o, oi) => {
                          const chosen = picked === oi, right = oi === q.answer;
                          return (
                            <button key={o} type="button" onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))} className={cn("flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-[13px] transition-colors", picked === undefined ? "border-black/10 hover:border-black/30" : right ? "border-[var(--bridge-teal)] bg-[#e6f3f3] text-[#005a5a]" : chosen ? "border-[#a3104a]/40 bg-[#fdecf2] text-[#a3104a]" : "border-black/10 text-[var(--on-surface-variant)]")}>
                              <MaterialSymbol className="text-[16px]" name={picked === undefined ? "radio_button_unchecked" : right ? "check_circle" : chosen ? "cancel" : "radio_button_unchecked"} />{o}
                            </button>
                          );
                        })}
                        {picked !== undefined ? <p className="text-[12.5px] text-[var(--on-surface-variant)]"><b className="text-[var(--primary)]">{picked === q.answer ? "Right. " : "Not quite. "}</b>{q.why}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            </div>
          )}
        </div>
    </div>
  );
}

/* ---------- Day 0: no reviewer, no hand-in — do what the lesson asks, tick its checks, move on ---------- */
const KICKOFF_LINKS: Record<string, { href: string; label: string; icon: string }> = {
  "kickoff.kickoff.month": { href: "/dashboard/roadmap", label: "Open My program", icon: "map" },
  "kickoff.kickoff.kit": { href: "/dashboard/kit", label: "Open the Agent kit", icon: "smart_toy" },
  "kickoff.kickoff.community": { href: "/dashboard/feed", label: "Say hello on the Feed", icon: "forum" },
};

function KickoffDo({ lesson: l, day, state, needsProject, onDone }: { lesson: Lesson; day: number; state: LessonState; needsProject: boolean; onDone: (d: boolean) => void }) {
  const { pushToast } = useToast();
  const checks = l.criteria ?? [];
  const [ticked, setTicked] = useState<boolean[]>(() => checks.map(() => state.done));
  const [note, setNote] = useState(state.work ?? "");
  const [saved, setSaved] = useState<"" | "saving" | "saved">("");
  const link = KICKOFF_LINKS[l.fid];
  const ready = ticked.every(Boolean) && !needsProject;
  const save = async () => {
    if (note === (state.work ?? "")) return;
    setSaved("saving");
    try { await api("/api/program/progress", { action: "work", day, fid: l.fid, work: note }); setSaved("saved"); }
    catch (e) { setSaved(""); pushToast({ variant: "error", title: e instanceof Error ? e.message : "Couldn’t save." }); }
  };
  return (
    <section className="grid gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <span className={cn(kicker, "text-black/45")}>Your turn</span>
        <p className="text-[14.5px] leading-6 text-[var(--primary)]">{l.exercise}</p>
        {link ? <Link href={link.href} target="_blank" className="flex w-fit items-center gap-1.5 rounded-full bg-[#f1f2f3] px-3 py-1.5 text-[12.5px] font-bold text-[var(--primary)] hover:bg-[#e6e8ea]"><MaterialSymbol className="text-[16px]" name={link.icon} />{link.label}<MaterialSymbol className="text-[14px] text-black/40" name="open_in_new" /></Link> : null}
        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-[12px] text-black/50"><span>Your note <span className="text-black/35">· optional, just for you</span></span><span>{saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : ""}</span></span>
          <textarea value={note} onChange={(e) => { setNote(e.target.value); setSaved(""); }} onBlur={() => void save()} rows={4} maxLength={20000} placeholder="Jot your answer here — you can come back to it later." className="w-full resize-y rounded-xl border border-black/10 bg-[#fafbfb] px-3 py-2 text-[13.5px] leading-6 outline-none focus:border-black/30" />
        </label>
      </div>
      <div className="grid content-start gap-3">
        <span className={cn(kicker, "text-black/45")}>Before you move on</span>
        <ul className="grid gap-1.5">
          {checks.map((c, i) => (
            <li key={c}>
              <button type="button" role="checkbox" aria-checked={ticked[i]} disabled={state.done} onClick={() => setTicked((t) => t.map((x, j) => (j === i ? !x : x)))} className={cn("flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-[13.5px] transition-colors", ticked[i] ? "border-[var(--bridge-teal)]/40 bg-[#e6f3f3] text-[#005a5a]" : "border-black/10 text-[var(--primary)] hover:border-black/30")}>
                <MaterialSymbol className="mt-px text-[18px]" name={ticked[i] ? "check_box" : "check_box_outline_blank"} />{c}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {state.done ? (
            <button type="button" onClick={() => { setTicked(checks.map(() => false)); onDone(false); }} className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-[13.5px] font-bold text-[var(--on-surface-variant)] hover:border-black/30"><MaterialSymbol className="text-[18px] text-[var(--bridge-teal)]" name="check_circle" />Completed — undo</button>
          ) : (
            <button type="button" disabled={!ready} onClick={() => { void save(); onDone(true); }} className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-[13.5px] font-black uppercase tracking-[0.06em] text-white disabled:cursor-not-allowed disabled:bg-[#e3e5e6] disabled:text-black/60"><MaterialSymbol className="text-[18px]" name="task_alt" />Mark lesson complete</button>
          )}
          {!state.done && !ready ? <span className="text-[13px] text-[var(--on-surface-variant)]">{needsProject ? "Pick your project above first." : "Tick each check when it’s true."}</span> : null}
        </div>
      </div>
    </section>
  );
}
