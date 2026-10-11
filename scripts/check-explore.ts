/* checks the Explore map: every reference resolves, ids are unique, the menu's picks and counts match.
 * npx tsx scripts/check-explore.ts */
import { allRoles, allSkills, allSubjects, domains, exists, exploreCounts, stacks, type Kind } from "../lib/explore";
import { menuCounts, menuDomains, menuPopular, menuRoles, menuSkills, menuSubjects } from "../lib/explore/menu";

const bad: string[] = [];
const need = (kind: Kind, id: string, from: string) => { if (!exists(kind, id)) bad.push(`${from} → unknown ${kind} "${id}"`); };

for (const r of allRoles) { r.skills.forEach((x) => need("skill", x, `role ${r.id}`)); r.subjects.forEach((x) => need("subject", x, `role ${r.id}`)); }
for (const s of stacks) s.parts.forEach((x) => need("skill", x, `stack ${s.id}`));
for (const s of allSubjects) (s.first ?? []).forEach((x) => need("subject", x, `subject ${s.id}`));
for (const d of domains) { d.roles.forEach((x) => need("role", x, `domain ${d.id}`)); d.skills.forEach((x) => need("skill", x, `domain ${d.id}`)); d.subjects.forEach((x) => need("subject", x, `domain ${d.id}`)); }
menuSkills.forEach((f) => f.picks.forEach((p) => need("skill", p.id, "menu")));
menuRoles.forEach((f) => f.picks.forEach((p) => need("role", p.id, "menu")));
menuSubjects.forEach((f) => f.picks.forEach((p) => need("subject", p.id, "menu")));
menuDomains.forEach((p) => need("domain", p.id, "menu"));
menuPopular.forEach((p) => need(p.kind as Kind, p.id, "menu popular"));

const dups = (kind: string, ids: string[]) => ids.filter((x, i) => ids.indexOf(x) !== i).forEach((x) => bad.push(`duplicate ${kind} id "${x}"`));
dups("skill", allSkills.map((x) => x.id)); dups("role", allRoles.map((x) => x.id)); dups("subject", allSubjects.map((x) => x.id));
dups("stack", stacks.map((x) => x.id)); dups("domain", domains.map((x) => x.id));

for (const k of ["skills", "roles", "subjects", "domains"] as const) if (menuCounts[k] !== exploreCounts[k]) bad.push(`menuCounts.${k} is ${menuCounts[k]} but the data has ${exploreCounts[k]}`);

const lonelySkills = allSkills.filter((s) => !allRoles.some((r) => r.skills.includes(s.id)) && !stacks.some((x) => x.parts.includes(s.id)) && !domains.some((d) => d.skills.includes(s.id))).map((s) => s.id);
const lonelySubjects = allSubjects.filter((s) => !allRoles.some((r) => r.subjects.includes(s.id))).map((s) => s.id);
console.log(JSON.stringify({ counts: exploreCounts, problems: bad, notLinkedToAnyRoleOrStack: { skills: lonelySkills, subjects: lonelySubjects } }, null, 1));
if (bad.length) process.exit(1);
