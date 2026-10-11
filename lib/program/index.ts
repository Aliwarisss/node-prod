/* The 30-day program, built from the Node book by scripts/build-program-data.cjs (npm run program:data).
 * Server code only: reads lib/program/data/*.json from disk and hands pages just the slice they show. */
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "lib", "program", "data");
/* parsed once; in development re-parsed only when the file changes on disk (npm run program:data) */
const cache = new Map<string, { at: number; data: unknown }>();
function read<T>(file: string): T {
  const full = path.join(DATA, file);
  const at = process.env.NODE_ENV === "development" ? fs.statSync(full).mtimeMs : 0;
  const hit = cache.get(file);
  if (hit && hit.at === at) return hit.data as T;
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  cache.set(file, { at, data });
  return data as T;
}
/* a version stamp for data derived from the program files — changes when they're rebuilt */
export const dataVersion = () => (process.env.NODE_ENV === "development" ? fs.statSync(path.join(DATA, "index.json")).mtimeMs : 0);

/* ---------- types ---------- */
export type Ref = { name: string; ref: string | null };
export type LensUse = { id: string; note: string }; // a lens looking in at a point of the workflow, and what it checks there
export type Step = { id: string; title: string; actor: string; out: string; decision: boolean; template: string | null; ask: string; uses: Ref[]; lenses?: LensUse[] };
export type Loop = [string, string, string, string];
export type Contract = Record<string, Record<string, unknown> | undefined>;
export type Refs = { artifacts: Record<string, string | null>; knowledge: Record<string, string | null>; lenses: Record<string, string | null> };
export type Workflow = { id: string; title: string; summary: string; gate: string; steps: Step[]; loops: Loop[]; contract: Record<string, unknown>; entryUses: Ref[]; entryLenses?: LensUse[]; gateLenses?: LensUse[] };
export type QuizItem = { q: string; options: string[]; answer: number; why: string };
export type Lesson = {
  fid: string;
  code: string;
  title: string;
  summary: string;
  gate: string;
  contract: Contract | null;
  refs: Refs;
  workflows: Workflow[];
  objectives: string[];
  exercise: string;
  quiz: QuizItem[];
  prompt: string;
  criteria?: string[];
  /* Day 0's orientation lessons: short sections, each with a picture drawn from the month's real data */
  guide?: Guide;
};

/* ---------- Day 0 · the kick-off orientation (built by scripts/kickoff-guide.cjs) ---------- */
export type GuideStage = { id: string; n: string; name: string; track: string; days: string; gate: string; line: string; lessons: number; files: number; firstDay?: number };
export type GuideItem = { icon: string; name: string; what: string; n?: number };
export type GuideExample = {
  day: number; stage: string; chapter: string; lesson: string; code: string; workflow: string; gate: string; chapterLessons: number; dayChapters: number;
  steps: { id: string; title: string; decision: boolean }[];
  loops: { from: string; to: string; kind: string; label: string }[];
};
export type GuideVisual =
  | { kind: "stages"; stages: GuideStage[] }
  | { kind: "ladder"; rows: { level: string; icon: string; what: string; example: string }[] }
  | { kind: "steps"; steps: GuideItem[] }
  | { kind: "workflow"; example: GuideExample }
  | { kind: "cycle"; steps: GuideItem[]; back: GuideItem }
  | { kind: "kit"; layers: GuideItem[] }
  | { kind: "unlocks"; stages: GuideStage[] }
  | { kind: "xp"; rows: [string, number][] };
export type GuideSection = { icon: string; title: string; body?: string; points?: [string, string][]; visual?: GuideVisual };
export type Guide = { intro: string; sections: GuideSection[] };

/* every day, as a list to jump to (admins can open any day) */
export function dayLinks() {
  return daySummaries().map((d) => ({ day: d.day, title: d.title, stageId: d.act.id, stage: d.act.id === "kickoff" ? "Kick-off" : d.act.id === "capstone" ? "Capstone" : `${d.act.n} · ${d.act.name}`, lessons: d.lessonCount }));
}

export type DayProcess = {
  id: string;
  code: string;
  title: string;
  summary: string;
  gate: string;
  contract: Contract | null;
  refs?: Refs;
  loops: Loop[];
  subprocessIds?: string[];
  lessons: Lesson[];
};
export type ProgramDay = {
  day: number;
  kind: "kickoff" | "act" | "capstone";
  act: { id: string; n: string; name: string; track: string; gate: string; tagline?: string };
  title: string;
  goal: string;
  story?: string;
  processes: DayProcess[];
  gate: { title: string; criteria: string[] };
};
export type Template = { id: string; type: string; what: string; purpose: string; owner: string; users: string[]; good: string[]; tpl: Record<string, unknown> | null };
export type KnowledgeEntry = { name: string; type?: string; what?: string; how?: string[]; use?: string; pitfalls?: string[]; source?: string; says?: string[]; applies?: string; structure?: { kind?: string; items?: unknown[] } };
export type LensEntry = { id: string; name: string; group: string; icon: string; short: string; what?: string; asks?: string[]; concerns?: string[]; evidence?: string[]; decisions?: string[]; holder?: string };
export type ModelMeta = {
  contract: { id: string; name: string; icon: string; q: string; fields: [string, string, string][] }[];
  workflow: [string, string][];
  routes: Record<string, { label: string; icon: string; c: string }>;
  lifecycleLoops: Loop[];
};
export type DaySummary = { day: number; title: string; act: ProgramDay["act"]; lessonCount: number; lessonIds: string[] };

export const TOTAL_DAYS = 30;

export const ACT_COLORS: Record<string, string> = {
  kickoff: "#d81b60", discover: "#6d48d8", plan: "#6d48d8", design: "#6d48d8",
  build: "#007373", verify: "#007373", release: "#007373", operate: "#a87b00", evolve: "#a87b00", capstone: "#d81b60",
};

/* ---------- access ---------- */
export function getDay(n: number): ProgramDay | null {
  if (!Number.isInteger(n) || n < 0 || n > TOTAL_DAYS) return null;
  try {
    return read<ProgramDay>(`day-${n}.json`);
  } catch {
    return null;
  }
}

export const daySummaries = () => read<DaySummary[]>("index.json");
export const lessonIdsOf = (d: ProgramDay) => d.processes.flatMap((p) => p.lessons.map((l) => l.fid));
export const getModel = () => read<ModelMeta>("model.json");

/* a stage (act) in depth: its days → processes → subprocess lessons, for the "now & next" view */
export type StageLesson = { fid: string; code: string; title: string };
export type StageDay = { day: number; title: string; processes: { code: string; title: string; gate: string; lessons: StageLesson[] }[] };
export type Stage = { id: string; n: string; name: string; track: string; gate: string; tagline: string; days: StageDay[] };
export function stageOf(actId: string): Stage | null {
  const days = daySummaries().filter((d) => d.act.id === actId);
  if (!days.length) return null;
  const a = days[0].act;
  return {
    id: a.id, n: a.n, name: a.name, track: a.track, gate: a.gate, tagline: a.tagline ?? "",
    days: days.map((s) => {
      const d = getDay(s.day)!;
      return {
        day: d.day,
        title: d.title,
        processes: d.processes.map((p) => ({ code: p.code, title: p.title, gate: p.gate, lessons: p.lessons.map((l) => ({ fid: l.fid, code: l.code, title: l.title })) })),
      };
    }),
  };
}

/* the templates, knowledge entries and lenses a day refers to — so the page ships only those */
/* one knowledge entry, by id (for boards in the workspace) */
export function getKnowledge(id: string): KnowledgeEntry | null {
  return id ? read<Record<string, KnowledgeEntry>>("knowledge.json")[id] ?? null : null;
}

/* a workspace document's ref is valid if it's a template, a knowledge board, or a lesson's own work */
export function isWorkspaceRef(ref: string) {
  if (ref.startsWith("lesson:")) return true;
  if (ref.startsWith("knowledge:")) return !!getKnowledge(ref.slice(10));
  return !!getTemplate(ref);
}

/* one lens, by id (for reviewers) */
export function getLens(id: string): LensEntry | null {
  return id ? read<Record<string, LensEntry>>("lenses.json")[id] ?? null : null;
}

/* one template, by id (for reviewers) */
export function getTemplate(id: string): Template | null {
  return id ? read<Record<string, Template>>("templates.json")[id] ?? null : null;
}

export function lookupsFor(d: ProgramDay) {
  const t = new Set<string>(), k = new Set<string>(), l = new Set<string>();
  const addRefs = (r?: Refs) => {
    if (!r) return;
    for (const v of Object.values(r.artifacts)) if (v) t.add(v);
    for (const v of Object.values(r.knowledge)) if (v) k.add(v);
    for (const v of Object.values(r.lenses)) if (v) l.add(v);
  };
  for (const p of d.processes) {
    addRefs(p.refs);
    for (const les of p.lessons) {
      addRefs(les.refs);
      for (const w of les.workflows) {
        for (const s of w.steps) {
          if (s.template) t.add(s.template);
          for (const u of s.uses) if (u.ref) k.add(u.ref);
          for (const x of s.lenses ?? []) l.add(x.id);
        }
        for (const u of w.entryUses) if (u.ref) k.add(u.ref);
        for (const x of [...(w.entryLenses ?? []), ...(w.gateLenses ?? [])]) l.add(x.id);
      }
    }
  }
  const T = read<Record<string, Template>>("templates.json");
  const K = read<Record<string, KnowledgeEntry>>("knowledge.json");
  const L = read<Record<string, LensEntry>>("lenses.json");
  const pick = <V,>(src: Record<string, V>, ids: Set<string>) => Object.fromEntries([...ids].filter((id) => src[id]).map((id) => [id, src[id]]));
  return { templates: pick(T, t), knowledge: pick(K, k), lenses: pick(L, l) };
}
export type Lookups = ReturnType<typeof lookupsFor>;
