import type { Deliverable } from "./deliverables";
import type { LensEntry, Lesson, Template } from "./index";

/* The rubric a deliverable is graded on — as the book defines it (rubrics/<artifact>.md):
 * - what good looks like for the artifact, the producing workflow's criteria (and, on its last task, its checks),
 *   what each lens asks of it at this step, and three standard criteria: template, traceability, evidence;
 * - a decision brief is graded on the question, the branches, the recommendation and its evidence.
 * Each criterion scores 0 (missing) · 1 (partial) · 2 (meets). Pass: no 0s and at least 80% of the maximum.
 * The trainee self-scores before submitting; the reviewer's score is the grade. */

export type Score = 0 | 1 | 2;
export type Criterion = { id: string; text: string; source: string };
export type Scores = Record<string, Score>;
export type Grade = { total: number; max: number; pct: number; zeros: number; scored: number; count: number; pass: boolean };

export const SCORE_LABEL: Record<Score, string> = { 0: "Missing", 1: "Partial", 2: "Meets" };
export const PASS_PCT = 80;

type Get = { template: (id: string) => Template | null | undefined; lens: (id: string) => LensEntry | null | undefined };
const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);

/* a short, stable id for a criterion — safe as a database key */
export function criterionId(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `c${h.toString(36)}`;
}

export function rubricOf(lesson: Lesson, d: Deliverable, all: Deliverable[], get: Get): Criterion[] {
  const w = lesson.workflows.find((x) => x.id === d.workflowId);
  const step = w?.steps.find((x) => x.id === d.stepId) ?? null;
  const wc = (w?.contract ?? {}) as Record<string, unknown>;
  const flow = all.filter((x) => x.workflowId === d.workflowId);
  const last = flow[flow.length - 1]?.key === d.key;
  const out: Criterion[] = [];
  const add = (text: string, source: string) => { const id = criterionId(text); if (text && !out.some((c) => c.id === id)) out.push({ id, text, source }); };

  if (d.kind === "decision") {
    add(`States the question plainly: ${list(wc.decisions)[0] ?? step?.title ?? "the decision"}`, "Decision brief");
    for (const b of list(wc.branches)) add(`Covers the branch: ${b}`, "Workflow branch");
    add("Gives a recommendation and why", "Decision brief");
  } else {
    const t = d.template ? get.template(d.template) : undefined;
    for (const g of t?.good ?? []) add(g, "Artifact quality");
  }
  for (const c of list(wc.criteria)) add(c, `${w?.title ?? "Workflow"} criteria`);
  if (last && d.kind !== "decision") for (const c of list(wc.checks)) add(c, "Workflow check");
  for (const u of step?.lenses ?? []) { const l = get.lens(u.id); if (l && u.note) add(u.note, `${l.name} lens`); }
  if (d.kind === "artifact" && d.template) add("Follows every section or column of the template", "Template");
  if (d.kind !== "work") add("Carries its trace ID and links upstream IDs", "Traceability");
  add("Every claim cites evidence or is marked “Assumption:”", "Ground rules");
  return out;
}

export function gradeOf(criteria: Criterion[], scores: Partial<Scores> | null | undefined): Grade {
  const s = scores ?? {};
  const vals = criteria.map((c) => s[c.id]).filter((v): v is Score => v === 0 || v === 1 || v === 2);
  const total = vals.reduce<number>((a, v) => a + v, 0), max = criteria.length * 2;
  const zeros = vals.filter((v) => v === 0).length;
  const pct = max ? Math.round((total / max) * 100) : 0;
  return { total, max, pct, zeros, scored: vals.length, count: criteria.length, pass: vals.length === criteria.length && zeros === 0 && pct >= PASS_PCT };
}

/* the book's self-check prompt, with the rubric inline */
export function selfCheckPrompt(artifact: string, criteria: Criterion[], context?: string) {
  return [
    `Score my ${artifact} against this rubric. Each criterion: 0 (missing) · 1 (partial) · 2 (meets). Pass: no 0s and at least ${PASS_PCT}% of the maximum (${criteria.length * 2}).`,
    "",
    ...criteria.map((c, i) => `${i + 1}. ${c.text} (${c.source})`),
    "",
    "For every criterion below 2, quote the gap and propose the fix. Don't change the document yet.",
    context ? `\nContext: ${context}` : "",
    "\n--- my document ---\n",
  ].join("\n");
}
