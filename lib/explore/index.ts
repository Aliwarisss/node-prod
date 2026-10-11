/* Explore — the map of computer science as one tree, with lookups and the relationships between things:
 * which roles use a skill, which skills travel together, which roles are alike, what a subject leads to.
 * The header menu doesn't import this (it's large) — it uses lib/explore/menu.ts. */
import { domains, type Domain } from "./domains";
import { allRoles, roleFolders, type Role } from "./roles";
import { allSkills, skillFolders, stacks, type Skill, type Stack } from "./skills";
import { allSubjects, subjectFolders, type Subject } from "./subjects";

export { domains, roleFolders, skillFolders, stacks, subjectFolders };
export type { Domain, Role, Skill, Stack, Subject };

export type Kind = "skill" | "stack" | "role" | "subject" | "domain";
export type ItemKey = `${Kind}:${string}`;

/* the tree: sections → folders → items */
export type TreeFolder = { id: string; name: string; icon: string; color?: string; line: string; kind: Kind; items: string[] };
export type TreeSection = { id: string; name: string; icon: string; color: string; line: string; kind: Kind; folders: TreeFolder[] };
export const tree: TreeSection[] = [
  { id: "skills", name: "Skills & tools", icon: "code", color: "#0b72c4", kind: "skill", line: "Languages, frameworks, databases, platforms and tools.",
    folders: skillFolders.map((f) => ({ id: f.id, name: f.name, icon: f.icon, line: f.line, kind: "skill", items: f.skills.map((x) => x.id) })) },
  { id: "stacks", name: "Stacks", icon: "stacks", color: "#0f766e", kind: "stack", line: "Skills that are used together.",
    folders: [{ id: "all", name: "Popular stacks", icon: "stacks", line: "Skills that are used together.", kind: "stack", items: stacks.map((x) => x.id) }] },
  { id: "roles", name: "Roles & careers", icon: "badge", color: "#e91e63", kind: "role", line: "The jobs people do across computing.",
    folders: roleFolders.map((f) => ({ id: f.id, name: f.name, icon: f.icon, color: f.color, line: f.line, kind: "role", items: f.roles.map((x) => x.id) })) },
  { id: "subjects", name: "Subjects", icon: "school", color: "#6d48d8", kind: "subject", line: "The body of knowledge, from foundations to frontiers.",
    folders: subjectFolders.map((f) => ({ id: f.id, name: f.name, icon: f.icon, color: f.color, line: f.line, kind: "subject", items: f.subjects.map((x) => x.id) })) },
  { id: "domains", name: "Domains", icon: "public", color: "#c49000", kind: "domain", line: "The fields and industries software is built for.",
    folders: [{ id: "all", name: "Industries & fields", icon: "public", line: "The fields and industries software is built for.", kind: "domain", items: domains.map((x) => x.id) }] },
];

/* lookups */
export const skillById = new Map(allSkills.map((x) => [x.id, x]));
export const subjectById = new Map(allSubjects.map((x) => [x.id, x]));
export const roleById = new Map(allRoles.map((x) => [x.id, x]));
export const stackById = new Map(stacks.map((x) => [x.id, x]));
export const domainById = new Map(domains.map((x) => [x.id, x]));
export const nameOf = (kind: Kind, id: string) =>
  (kind === "skill" ? skillById.get(id)?.name : kind === "role" ? roleById.get(id)?.name : kind === "subject" ? subjectById.get(id)?.name : kind === "stack" ? stackById.get(id)?.name : domainById.get(id)?.name) ?? id;
export const exists = (kind: Kind, id: string) =>
  (kind === "skill" ? skillById : kind === "role" ? roleById : kind === "subject" ? subjectById : kind === "stack" ? stackById : domainById).has(id);

/* where an item lives in the tree */
export function locate(kind: Kind, id: string): { section: TreeSection; folder: TreeFolder } | null {
  for (const s of tree) if (s.kind === kind) for (const f of s.folders) if (f.items.includes(id)) return { section: s, folder: f };
  return null;
}

/* relationships */
export const rolesWithSkill = (id: string) => allRoles.filter((x) => x.skills.includes(id));
export const rolesWithSubject = (id: string) => allRoles.filter((x) => x.subjects.includes(id));
export const stacksWithSkill = (id: string) => stacks.filter((x) => x.parts.includes(id));
export const domainsWith = (kind: "skill" | "role" | "subject", id: string) =>
  domains.filter((d) => (kind === "skill" ? d.skills : kind === "role" ? d.roles : d.subjects).includes(id));
export const leadsTo = (subjectId: string) => allSubjects.filter((x) => x.first?.includes(subjectId));

/* skills that appear alongside this one — in roles and stacks */
export function relatedSkills(id: string, n = 8) {
  const score = new Map<string, number>();
  for (const group of [...allRoles.map((x) => x.skills), ...stacks.map((x) => x.parts)]) {
    if (!group.includes(id)) continue;
    for (const other of group) if (other !== id) score.set(other, (score.get(other) ?? 0) + 1);
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => skillById.get(k)!).filter(Boolean);
}

/* roles that share the most skills and subjects with this one */
export function similarRoles(id: string, n = 5) {
  const me = roleById.get(id);
  if (!me) return [];
  const mine = new Set([...me.skills, ...me.subjects]);
  return allRoles
    .filter((x) => x.id !== id)
    .map((x) => { const theirs = [...x.skills, ...x.subjects]; const shared = theirs.filter((t) => mine.has(t)).length; return { role: x, score: shared / (mine.size + theirs.length - shared) }; })
    .filter((x) => x.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.role);
}

export const exploreCounts = { skills: allSkills.length, stacks: stacks.length, roles: allRoles.length, subjects: allSubjects.length, domains: domains.length };
export { allRoles, allSkills, allSubjects };
export const LEVELS = { skill: ["", "Beginner-friendly", "Intermediate", "Advanced"], subject: ["", "Intro", "Core", "Advanced"] } as const;
