import type { Deliverable } from "./deliverables";
import type { KnowledgeEntry, LensEntry, Lesson, Template } from "./index";

/* How to do one task, following the workflow: what applies before you start, which knowledge to use along the way
 * (and how — as to-dos), what each lens will look for at this step (things to see and query), and what to check before
 * you submit. Every to-do is a subtask the trainee ticks off; the reviewer verifies the same things at the gate. */

export type When = "before" | "along" | "see" | "check";
export type SubTask = { id: string; when: When; text: string; source: string };
export type KnowUse = { name: string; ref: string | null; type: string; when: "before" | "along"; what: string };
export type LensLook = { id: string; name: string; icon: string; holder: string; note: string; asks: string[] };
export type TaskGuide = { knowledge: KnowUse[]; lenses: LensLook[]; subtasks: SubTask[] };

type Lookups = { templates: Record<string, Template>; knowledge: Record<string, KnowledgeEntry>; lenses: Record<string, LensEntry> };
const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const id = (when: When, text: string) => `${when}:${text}`.slice(0, 300);
export const KNOW_ORDER = ["Standard", "Framework", "Method", "Practice", "Technique", "Pattern", "Principle", "Tool"];

export function taskGuide(lesson: Lesson, d: Deliverable, all: Deliverable[], lookups: Lookups): TaskGuide {
  const w = lesson.workflows.find((x) => x.id === d.workflowId);
  const step = w?.steps.find((x) => x.id === d.stepId) ?? null;
  const wc = (w?.contract ?? {}) as Record<string, unknown>;
  const mine = all.filter((x) => x.workflowId === d.workflowId);
  const firstInFlow = mine[0]?.key === d.key, lastInFlow = mine[mine.length - 1]?.key === d.key;
  const sub: SubTask[] = [];
  const knowledge: KnowUse[] = [];
  const push = (when: When, text: string, source: string) => { if (text && !sub.some((x) => x.id === id(when, text))) sub.push({ id: id(when, text), when, text, source }); };

  /* before: the workflow's preconditions and the knowledge that applies from the start (on its first task) */
  if (w && firstInFlow) {
    for (const p of list(wc.preconditions)) push("before", p, "Precondition");
    for (const u of w.entryUses) {
      const k = u.ref ? lookups.knowledge[u.ref] : undefined;
      knowledge.push({ name: u.name, ref: u.ref, type: k?.type ?? "Knowledge", when: "before", what: k?.what ?? "" });
      const how = (k?.how ?? []).slice(0, 2);
      if (how.length) how.forEach((h) => push("before", h, `${u.name} · ${k?.type ?? "knowledge"}`));
      else push("before", `Apply ${u.name} from the start`, `${u.name} · ${k?.type ?? "knowledge"}`);
    }
  }

  /* along: the knowledge this step uses, and how — its first steps as to-dos */
  for (const u of step?.uses ?? []) {
    const k = u.ref ? lookups.knowledge[u.ref] : undefined;
    knowledge.push({ name: u.name, ref: u.ref, type: k?.type ?? "Knowledge", when: "along", what: k?.what ?? "" });
    const how = (k?.how ?? []).slice(0, 3);
    if (how.length) how.forEach((h) => push("along", h, `${u.name} · ${k?.type ?? "knowledge"}`));
    else if (k?.says?.length) push("along", `Apply: ${k.says[0]}`, `${u.name} · ${k.type ?? "principle"}`);
    else push("along", `Apply ${u.name}`, k?.type ?? "Knowledge");
  }
  if (d.kind === "decision") {
    push("along", `State the question plainly: ${list(wc.decisions)[0] ?? step?.title ?? "the decision"}`, "Decision brief");
    push("along", "Lay out the options and what each one leads to", "Decision brief");
    for (const b of list(wc.branches)) push("along", `Spell out the branch: ${b}`, "Workflow branch");
    push("along", "Give your recommendation and why", "Decision brief");
  }

  /* see: what each lens looks for at this step — things to see and to ask */
  const lenses: LensLook[] = [];
  for (const u of step?.lenses ?? []) {
    const l = lookups.lenses[u.id];
    if (!l) continue;
    lenses.push({ id: l.id, name: l.name, icon: l.icon, holder: list(l.holder)[0] ?? "", note: u.note, asks: (l.asks ?? []).slice(0, 2) });
    if (u.note) push("see", u.note, `${l.name} lens`);
  }

  /* check: what good looks like, and — on the workflow's last task — its checks */
  const t = d.template ? lookups.templates[d.template] : undefined;
  for (const g of t?.good ?? []) push("check", g, "Good looks like");
  if (lastInFlow) for (const c of list(wc.checks)) push("check", c, "Workflow check");

  knowledge.sort((a, b) => (a.when === b.when ? KNOW_ORDER.indexOf(a.type) - KNOW_ORDER.indexOf(b.type) : a.when === "before" ? -1 : 1));
  return { knowledge, lenses, subtasks: sub };
}
