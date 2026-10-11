/* Practice reps — five quick questions on one skill of the rubric, drawn from the lessons the trainee has reached:
 * the templates' quality points and structure, the workflows' criteria, decisions, branches and traceability, the
 * lenses' questions, and the ground rule on evidence. A rep is generated from a seed, so the server can check the
 * answers without storing the questions. Server code. */
import { getDay, getLens, getTemplate, type Lesson } from "./index";
import { SKILLS } from "./stats";

export type Question = { q: string; options: string[]; answer: number; why: string };
export const REP_SIZE = 5;
export const REP_XP_PER_CORRECT = 4; // up to 20 XP a rep
export const REPS_WITH_XP_PER_DAY = 3; // after that, practice is just practice

/* a small seeded random generator — the same seed gives the same rep */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
const clean = (s: string) => s.replace(/\s*[—-]?\s*\{[^}]*\}/g, "").trim();
const short = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
/* a template's name as people say it: its title, its sheet's name, or its id made readable */
const tplName = (t: { id: string; tpl: Record<string, unknown> | null }) => {
  const x = (t.tpl ?? {}) as { title?: string; file?: string; tab?: string };
  const raw = x.title ?? x.file?.replace(/\.(xlsx|csv|docx|pptx)$/i, "") ?? x.tab ?? t.id.replace(/-/g, " ");
  return clean(String(raw)).replace(/^\w/, (c) => c.toUpperCase());
};

/* the lessons the trainee has reached (at least Day 1) */
function reached(currentDay: number): Lesson[] {
  const out: Lesson[] = [];
  for (let d = 1; d <= Math.max(1, currentDay); d++) out.push(...(getDay(d)?.processes.flatMap((p) => p.lessons) ?? []));
  return out;
}

type Pool = { stem: string; right: string; wrong: string[]; why: string };
function pools(skill: string, lessons: Lesson[]): Pool[] {
  const wfs = lessons.flatMap((l) => l.workflows.map((w) => ({ l, w, c: (w.contract ?? {}) as Record<string, unknown> })));
  const tplIds = [...new Set(lessons.flatMap((l) => l.workflows.flatMap((w) => w.steps.map((s) => s.template).filter((x): x is string => !!x))))];
  const tpls = tplIds.map((id) => getTemplate(id)).filter((t): t is NonNullable<typeof t> => !!t);
  const others = <T,>(xs: T[], i: number) => xs.filter((_, k) => k !== i);
  const out: Pool[] = [];
  switch (skill) {
    case "quality":
      tpls.forEach((t, i) => t.good.forEach((g) => out.push({ stem: `Which is a quality point for the ${tplName(t)}?`, right: g, wrong: others(tpls, i).flatMap((x) => x.good).filter((x) => !t.good.includes(x)), why: `“${g}” is on its rubric — what good looks like for this artifact.` })));
      break;
    case "template": {
      const parts = (t: (typeof tpls)[number]) => { const x = (t.tpl ?? {}) as { cols?: unknown[]; sections?: unknown[][]; fields?: unknown[][] }; return [...list(x.cols), ...(x.sections ?? []).map((s) => String(s[0])), ...(x.fields ?? []).map((f) => String(f[0]))].map((s) => s.replace(/^\d+\.\s*/, "")).filter(Boolean); };
      tpls.forEach((t, i) => parts(t).slice(0, 6).forEach((p) => out.push({ stem: `Which of these is part of the ${tplName(t)} template?`, right: p, wrong: others(tpls, i).flatMap(parts).filter((x) => !parts(t).includes(x)), why: `“${p}” is one of its sections or columns — a rubric point is following every one of them.` })));
      break;
    }
    case "workflow":
      wfs.forEach(({ w, c }, i) => list(c.criteria).forEach((cr) => out.push({ stem: `What must be true to pass the gate of “${w.title}”?`, right: cr, wrong: others(wfs, i).flatMap((x) => list(x.c.criteria)).filter((x) => x !== cr), why: `It’s that workflow’s criterion — the reviewer checks it before approving.` })));
      break;
    case "decisions":
      wfs.forEach(({ w, c }, i) => { const q = list(c.decisions)[0]; if (q) list(c.branches).forEach((b) => out.push({ stem: `In “${w.title}” the decision is “${q}” — which is one of its branches?`, right: b, wrong: others(wfs, i).flatMap((x) => list(x.c.branches)).filter((x) => !list(c.branches).includes(x)), why: `A decision brief lays out every branch — this is one of “${w.title}”’s.` })); });
      break;
    case "trace":
      wfs.forEach(({ w, c }, i) => list(c.traceability).forEach((tr) => out.push({ stem: `What does “${w.title}” link, for traceability?`, right: tr, wrong: others(wfs, i).flatMap((x) => list(x.c.traceability)).filter((x) => x !== tr), why: `Every artifact carries its ID and links the one it came from — here: ${tr}.` })));
      break;
    case "lenses": {
      const ids = [...new Set(lessons.flatMap((l) => l.workflows.flatMap((w) => w.steps.flatMap((s) => (s.lenses ?? []).map((u) => u.id)))))];
      const lenses = ids.map((id) => getLens(id)).filter((x): x is NonNullable<typeof x> => !!x);
      lenses.forEach((l, i) => (l.asks ?? []).slice(0, 3).forEach((a) => out.push({ stem: `Which lens asks: “${a}”`, right: `${l.name} lens`, wrong: others(lenses, i).map((x) => `${x.name} lens`), why: `It’s the ${l.name} lens — ${l.short || "how that role sees the work"}.` })));
      break;
    }
    case "evidence": {
      const good = [
        "Order errors rose 18% this quarter (source: ops report, 3 Oct).",
        "Assumption: clerks spend most of their time re-typing — to confirm in the interviews.",
        "Three of five interviewees named re-typing as their top pain (interview notes, P1–P5).",
        "Peak season starts in eight weeks (source: sales calendar).",
        "Assumption: the ERP can import a CSV — to check with IT.",
      ];
      const bad = [
        "Everyone hates the current process.",
        "The new system will obviously save a lot of time.",
        "Customers want a portal.",
        "This is clearly the most important problem we have.",
        "Automation will cut errors to zero.",
        "The team agrees this is urgent.",
      ];
      good.forEach((g) => out.push({ stem: "Which statement follows the ground rule: every claim cites evidence or is marked “Assumption:”?", right: g, wrong: bad, why: "It either names its source or is honestly marked as an assumption to test." }));
      break;
    }
  }
  return out.filter((p) => p.wrong.length >= 3 && p.right);
}

/* a rep: five questions on a skill, from the seed */
export function makeRep(skill: string, currentDay: number, seed: number): Question[] {
  if (!SKILLS.some((k) => k.key === skill)) return [];
  let lessons = reached(currentDay);
  let pool = pools(skill, lessons);
  if (pool.length < REP_SIZE) { lessons = reached(5); pool = pools(skill, lessons); } // early on, borrow from the stage
  const r = rng(seed);
  const shuffled = [...pool].sort(() => r() - 0.5);
  const seen = new Set<string>();
  const qs: Question[] = [];
  for (const p of shuffled) {
    if (qs.length >= REP_SIZE) break;
    if (seen.has(p.stem + p.right)) continue;
    seen.add(p.stem + p.right);
    const wrong = [...new Set(p.wrong.filter((w) => w !== p.right))].sort(() => r() - 0.5).slice(0, 3);
    if (wrong.length < 3) continue;
    const options = [...wrong, p.right].map((o) => short(o)).sort(() => r() - 0.5);
    qs.push({ q: short(p.stem, 200), options, answer: options.indexOf(short(p.right)), why: p.why });
  }
  return qs;
}
