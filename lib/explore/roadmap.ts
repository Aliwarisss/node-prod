/* Plans from the map: a learning roadmap for any role, how close someone is to each role, and the career graph
 * (roles linked by shared skills and subjects) with a path-finder between two roles. */
import { allRoles, allSkills, roleById, similarRoles, skillById, skillFolders, subjectById, subjectFolders } from "./index";
import type { SkillType } from "./skills";

/* kinds of skill where one is enough to start — you don't learn every language or framework, you pick one */
const CHOICE_TYPES = new Set<SkillType>(["Language", "Framework", "Runtime", "Library"]);
const ALWAYS_SOLO = new Set(["sql", "bash", "powershell", "html", "css"]); // not alternatives to anything — everyone learns these
const AREA_LABEL: Record<string, string> = { frontend: "front-end", backend: "back-end", "mobile-desktop": "mobile", "ai-ml": "AI", data: "data", databases: "database", "games-graphics": "game", embedded: "embedded" };
function choiceName(folder: string, type: SkillType) {
  if (folder === "testing") return "Pick a testing tool";
  if (type === "Language") return "Pick a language";
  const label = `${AREA_LABEL[folder] ?? skillFolders.find((x) => x.id === folder)?.name.toLowerCase() ?? ""} ${type.toLowerCase()}`.trim();
  return `Pick ${/^[aeiouAEIOU]/.test(label) ? "an" : "a"} ${label}`;
}

export type Status = "know" | "learning" | "want";
export type StepKind = "subject" | "skill";
/* a step is one subject or skill — or a choice ("pick a language: Python, Java or Go") where any one will do to start */
export type Step = { n: number; kind: StepKind; id: string; name: string; level: 1 | 2 | 3; weeks: number; prereqFor?: string; options?: string[] };
export type Stage = { level: 1 | 2 | 3; name: string; line: string; steps: Step[]; weeks: number };

/* rough effort, at about 10 hours a week */
export const HOURS_PER_WEEK = 10;
const WEEKS = { subject: [0, 2, 3, 4], skill: [0, 1, 2, 3] } as const;
const STAGES = [
  { level: 1 as const, name: "Foundations", line: "Get the basics solid." },
  { level: 2 as const, name: "Core", line: "The skills the job runs on." },
  { level: 3 as const, name: "Advanced", line: "What sets you apart." },
];

/* a role's roadmap: its subjects plus everything they build on, in learning order, then its tools — in three stages */
export function roleRoadmap(roleId: string): { stages: Stage[]; weeks: number; months: number; steps: Step[] } | null {
  const role = roleById.get(roleId);
  if (!role) return null;

  /* subjects, with prerequisites first (depth-first), remembering which role subject pulled each prerequisite in */
  const order: string[] = [], seen = new Set<string>(), why = new Map<string, string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const s = subjectById.get(id);
    if (!s) return;
    for (const p of s.first ?? []) { if (!role.subjects.includes(p) && !why.has(p)) why.set(p, s.name); visit(p); }
    order.push(id);
  };
  /* easiest first, and foundations before applied areas */
  const area = (id: string) => subjectFolders.findIndex((f) => f.subjects.some((s) => s.id === id));
  [...role.subjects].sort((a, b) => (subjectById.get(a)?.level ?? 2) - (subjectById.get(b)?.level ?? 2) || area(a) - area(b)).forEach((id) => visit(id));

  /* a subject's stage is never earlier than the stage of what it builds on */
  const stageOf = new Map<string, 1 | 2 | 3>();
  for (const id of order) {
    const s = subjectById.get(id)!;
    const fromFirst = Math.max(0, ...(s.first ?? []).map((p) => stageOf.get(p) ?? 0));
    stageOf.set(id, Math.max(s.level, fromFirst) as 1 | 2 | 3);
  }

  /* skills: alternatives of the same kind (languages, frameworks, runtimes, test tools…) become one "pick one" step */
  const skillSteps: Step[] = [];
  const groups = new Map<string, string[]>();
  for (const id of role.skills) {
    const k = skillById.get(id);
    if (!k) continue;
    const folder = allSkills.find((x) => x.id === id)!.folder;
    /* a runtime (Node.js) is a language choice too, wherever it's filed */
    const type: SkillType = k.type === "Runtime" ? "Language" : k.type;
    const key = ALWAYS_SOLO.has(id) ? `solo|${id}` : type === "Language" ? "languages|Language" : CHOICE_TYPES.has(type) || folder === "testing" ? `${folder}|${type}` : `solo|${id}`;
    groups.set(key, [...(groups.get(key) ?? []), id]);
  }
  for (const [key, ids] of groups) {
    const ks = ids.map((id) => skillById.get(id)!);
    const level = Math.min(...ks.map((k) => k.level)) as 1 | 2 | 3;
    if (ids.length === 1) { const k = ks[0]; skillSteps.push({ n: 0, kind: "skill", id: k.id, name: k.name, level: k.level, weeks: WEEKS.skill[k.level] }); continue; }
    const [folder, type] = key.split("|");
    const easiest = [...ks].sort((a, b) => a.level - b.level)[0];
    skillSteps.push({ n: 0, kind: "skill", id: easiest.id, name: choiceName(folder, type as SkillType), level, weeks: WEEKS.skill[level] + 1, options: ks.sort((a, b) => a.level - b.level).map((k) => k.id) });
  }

  /* within a stage: foundations before applied areas — as long as nothing comes before what it builds on */
  const topo = new Map(order.map((id, i) => [id, i]));
  const tidy = (ids: string[]) => {
    const sorted = [...ids].sort((a, b) => area(a) - area(b) || topo.get(a)! - topo.get(b)!);
    const pos = new Map(sorted.map((id, i) => [id, i]));
    const ok = sorted.every((id) => (subjectById.get(id)?.first ?? []).every((p) => !pos.has(p) || pos.get(p)! < pos.get(id)!));
    return ok ? sorted : ids;
  };

  let n = 0;
  const stages: Stage[] = STAGES.map((st) => {
    const subjects: Step[] = tidy(order.filter((id) => stageOf.get(id) === st.level)).map((id) => {
      const s = subjectById.get(id)!;
      return { n: 0, kind: "subject", id, name: s.name, level: s.level, weeks: WEEKS.subject[s.level], ...(why.has(id) ? { prereqFor: why.get(id) } : {}) };
    });
    const skills = skillSteps.filter((x) => x.level === st.level);
    const steps = [...subjects, ...skills].map((x) => ({ ...x, n: ++n }));
    return { ...st, steps, weeks: steps.reduce((w, x) => w + x.weeks, 0) };
  }).filter((st) => st.steps.length);

  const steps = stages.flatMap((s) => s.steps);
  const weeks = steps.reduce((w, x) => w + x.weeks, 0);
  return { stages, steps, weeks, months: Math.max(1, Math.round(weeks / 4.3)) };
}

/* how close someone is to a role: know = 1, learning = ½ — over the role's subjects and its skill steps
   (a "pick one" step counts once, and is done when any of its options is) */
export function roleMatch(roleId: string, items: Record<string, Status>) {
  const role = roleById.get(roleId);
  const plan = roleRoadmap(roleId);
  if (!role || !plan) return null;
  const val = (k: string) => (items[k] === "know" ? 1 : items[k] === "learning" ? 0.5 : 0);
  const skillSteps = plan.steps.filter((s) => s.kind === "skill");
  const stepVal = (s: Step) => Math.max(...(s.options ?? [s.id]).map((o) => val(`skill:${o}`)));
  const score = role.subjects.reduce((n, id) => n + val(`subject:${id}`), 0) + skillSteps.reduce((n, s) => n + stepVal(s), 0);
  const total = role.subjects.length + skillSteps.length;
  const openSteps = skillSteps.filter((s) => stepVal(s) < 1);
  return {
    pct: Math.round((score / total) * 100), total,
    skillGap: openSteps.length,
    missingSkills: openSteps.flatMap((s) => s.options ?? [s.id]), // every option of an open choice is a way to close it
    missingSubjects: role.subjects.filter((id) => items[`subject:${id}`] !== "know"),
  };
}
export const closestRoles = (items: Record<string, Status>, n = 5) =>
  allRoles.map((r) => ({ role: r, pct: roleMatch(r.id, items)!.pct })).filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, n);

/* the career graph: each role linked to the roles most like it */
export type Edge = { a: string; b: string; w: number };
export function careerEdges(perRole = 6): Edge[] {
  const out = new Map<string, Edge>();
  for (const r of allRoles) {
    const mine = new Set([...r.skills, ...r.subjects]);
    for (const other of similarRoles(r.id, perRole)) {
      const theirs = [...other.skills, ...other.subjects];
      const shared = theirs.filter((t) => mine.has(t)).length;
      const w = shared / (mine.size + theirs.length - shared);
      const key = [r.id, other.id].sort().join("|");
      if (!out.has(key)) out.set(key, { a: r.id, b: other.id, w });
    }
  }
  return [...out.values()];
}

/* the easiest way from one role to another — each step goes to a closely related role (Dijkstra, cost = 1 − likeness) */
export function careerPath(from: string, to: string, edges: Edge[]): string[] | null {
  if (from === to) return [from];
  const adj = new Map<string, { to: string; cost: number }[]>();
  for (const e of edges) {
    adj.set(e.a, [...(adj.get(e.a) ?? []), { to: e.b, cost: 1 - e.w }]);
    adj.set(e.b, [...(adj.get(e.b) ?? []), { to: e.a, cost: 1 - e.w }]);
  }
  const dist = new Map<string, number>([[from, 0]]), prev = new Map<string, string>(), done = new Set<string>();
  while (true) {
    let cur: string | null = null, best = Infinity;
    for (const [k, d] of dist) if (!done.has(k) && d < best) { best = d; cur = k; }
    if (!cur) return null;
    if (cur === to) break;
    done.add(cur);
    for (const { to: nxt, cost } of adj.get(cur) ?? []) {
      const d = best + cost;
      if (d < (dist.get(nxt) ?? Infinity)) { dist.set(nxt, d); prev.set(nxt, cur); }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return path;
}

/* what to add on each hop of a path: the next role's skills you don't get from the roles before it */
export function pathGains(path: string[]) {
  const have = new Set<string>();
  return path.map((id, i) => {
    const r = roleById.get(id)!;
    const add = i === 0 ? [] : r.skills.filter((s) => !have.has(s));
    r.skills.forEach((s) => have.add(s));
    return { id, add };
  });
}
