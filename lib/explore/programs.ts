/* Where Node teaches things — which program (or masterclass) covers a skill or subject, and where in it.
 * Copy, Paste, Go's acts and days come from the program itself (lib/platform-data actModel), so a link like
 * "Agentic AI → Copy, Paste, Go · Build · Days 12–15" stays true if the schedule moves. Masterclass and Hello, World
 * entries point at programs that are still coming (status "soon"). */
import { flagship } from "@/lib/node-landing-data";
import { actModel, flagshipHref, masterclasses, programPath } from "@/lib/platform-data";

export type Coverage = { program: string; label: string; where: string; status: "live" | "soon"; href: string; color: string };

const act = (...ids: string[]) => {
  const acts = ids.map((id) => actModel.find((a) => a.id === id)!).filter(Boolean);
  const first = acts[0], last = acts.at(-1)!;
  const from = first.days.replace("Days ", "").split("–")[0], to = last.days.replace("Days ", "").split("–").at(-1);
  return `${acts.map((a) => a.name).join(" & ")} · Days ${from}–${to}`;
};
const cpg = (where: string): Coverage => ({ program: "copy-paste-go", label: flagship.name, where, status: "live", href: flagshipHref, color: "#e91e63" });
const masterclass = (title: string): Coverage => {
  const c = masterclasses.classes.find((x) => x.title === title);
  return { program: "masterclass", label: masterclasses.title, where: `“${title}” · ${c?.hours ?? 3}-hour masterclass`, status: "soon", href: `/programs#${masterclasses.id}`, color: masterclasses.color };
};
const EVERY_ACT = "Every act · Days 0–30";

/* subject / skill → where it's taught */
const COVERAGE: Record<string, Coverage[]> = {
  // subjects
  "subject:sdlc": [cpg(EVERY_ACT)],
  "subject:documentation": [cpg(`${EVERY_ACT} — the industry's own templates`)],
  "subject:requirements": [cpg(act("discover", "plan")), masterclass("Idea to PRD in a day")],
  "subject:user-research-subject": [cpg(act("discover"))],
  "subject:business-analysis": [cpg(act("discover"))],
  "subject:product-management": [cpg(act("discover", "plan"))],
  "subject:estimation": [cpg(act("plan"))],
  "subject:project-management": [cpg(act("plan"))],
  "subject:software-architecture": [cpg(act("design"))],
  "subject:system-design": [cpg(act("design"))],
  "subject:api-design": [cpg(act("design"))],
  "subject:data-modeling": [cpg(act("design"))],
  "subject:ux-design": [cpg(act("design"))],
  "subject:ai-assisted-dev": [cpg(act("build")), masterclass("Agents in your repo")],
  "subject:agentic-ai": [cpg(act("build")), masterclass("Agents in your repo")],
  "subject:prompt-engineering": [cpg(act("build")), masterclass("Prompts that ship")],
  "subject:version-control": [cpg(act("build"))],
  "subject:testing": [cpg(act("verify"))],
  "subject:secure-sdlc": [cpg(act("verify"))],
  "subject:appsec": [cpg(act("verify"))],
  "subject:devops-culture": [cpg(act("release")), masterclass("Deploy your first app")],
  "subject:sre": [cpg(act("operate"))],
  "subject:observability": [cpg(act("operate"))],
  "subject:incident-response": [cpg(act("operate"))],
  "subject:product-analytics-subject": [cpg(act("evolve"))],
  // skills
  "skill:ai-coding": [cpg(act("build")), masterclass("Agents in your repo")],
  "skill:agents": [cpg(act("build")), masterclass("Agents in your repo")],
  "skill:prompting": [cpg(act("build")), masterclass("Prompts that ship")],
  "skill:git": [cpg(act("build"))],
  "skill:github": [cpg(act("build"))],
  "skill:specs": [cpg(act("discover", "design")), masterclass("Idea to PRD in a day")],
  "skill:user-research": [cpg(act("discover"))],
  "skill:gh-actions": [cpg(act("release")), masterclass("Deploy your first app")],
  "skill:vercel": [masterclass("Deploy your first app")],
};

export const coverageFor = (kind: "skill" | "subject", id: string) => COVERAGE[`${kind}:${id}`] ?? [];

/* the programs that come after: a taste of every role, and a deep dive into one */
const helloWorld = programPath.find((p) => p.id === "hello-world");
const nano = programPath.find((p) => p.id === "nano-degree");
export const roleJourney = [
  ...(helloWorld ? [{ label: helloWorld.title, where: `${helloWorld.length} · taste this role before you choose`, status: "soon" as const, href: `/programs#${helloWorld.id}`, color: helloWorld.color }] : []),
  { label: flagship.name, where: "30 days · play this role on a real project, with AI agents", status: "live" as const, href: flagshipHref, color: "#e91e63" },
  ...(nano ? [{ label: nano.title, where: `${nano.length} · specialise in it`, status: "soon" as const, href: `/programs#${nano.id}`, color: nano.color }] : []),
];
