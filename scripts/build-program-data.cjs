/* Build the 30-day program's data from the Node book (the-book/sdlc).
 * Loads the book exactly as its index.html does (one shared global scope), then lays the 8 acts over 30 days:
 *   Day 0 kick-off · Days 1–27 the acts (a day = one or two processes; each subprocess = a lesson) · Days 28–30 capstone.
 * Keeps the book's depth: full NODE contracts (process + subprocess), every workflow with steps, loops and its
 * workflow contract, plus the templates, knowledge entries and lenses they reference.
 * Writes lib/program/data/: index.json, day-<n>.json, templates.json, knowledge.json, lenses.json, model.json
 * Run after the book changes:  npm run program:data */
/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BOOK = path.join(ROOT, "the-book", "sdlc") + "/";
const OUT = path.join(ROOT, "lib", "program", "data");
const LATER = ["plan", "design", "build", "verify", "release", "operate", "evolve"];
const files = ["model", "system", "roadmap", "knowledge", "lenses", "artifacts", "roles", "offer",
  "acts/discover-library", "acts/discover-units", "acts/discover", "acts/discover-depth", "acts/discover-agile", "acts/discover-prompts",
  ...LATER.flatMap((a) => [`acts/${a}-library`, `acts/${a}-units`, `acts/${a}`, `acts/${a}-depth`]), "acts/reconcile"];

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of files) vm.runInContext(fs.readFileSync(BOOK + f + ".js", "utf8"), ctx, { filename: f + ".js" });
const { NODE_ACTS: ACTS, NODE_ARTIFACTS: ARTIFACTS, NODE_KNOWLEDGE: KNOWLEDGE, NODE_LENSES: LENSES, NODE_MODEL: MODEL } = ctx;
const plain = (o) => JSON.parse(JSON.stringify(o ?? null)); // drop the vm realm's prototypes

const PLAN = [
  { act: "discover", n: "I", name: "Discover", days: [1, 2, 3, 4, 5], track: "discovery" },
  { act: "plan", n: "II", name: "Plan", days: [6, 7, 8], track: "discovery" },
  { act: "design", n: "III", name: "Design", days: [9, 10, 11], track: "discovery" },
  { act: "build", n: "IV", name: "Build", days: [12, 13, 14, 15], track: "delivery" },
  { act: "verify", n: "V", name: "Verify", days: [16, 17, 18], track: "delivery" },
  { act: "release", n: "VI", name: "Release", days: [19, 20, 21], track: "delivery" },
  { act: "operate", n: "VII", name: "Operate", days: [22, 23, 24], track: "run" },
  { act: "evolve", n: "VIII", name: "Evolve", days: [25, 26, 27], track: "run" },
];

/* ---------- name resolution: artifacts → templates, knowledge names → entries, lens names → lens ids ---------- */
const artAlias = new Map();
for (const [id, a] of Object.entries(ARTIFACTS)) {
  artAlias.set(id.toLowerCase(), id);
  for (const n of a.aliases || []) artAlias.set(String(n).toLowerCase(), id);
}
const usedTemplates = new Set();
const tplOf = (name) => {
  if (!name) return null;
  const k = String(name).toLowerCase();
  const id = artAlias.get(k) || artAlias.get(k.replace(/\s*\(.*\)\s*$/, ""));
  if (id) usedTemplates.add(id);
  return id || null;
};

const kBase = (name) => String(name).split(" — ")[0].replace(/\s*\(.*\)\s*$/, "").trim();
const usedKnowledge = new Set();
const knowOf = (name) => {
  const b = kBase(name);
  const hit = KNOWLEDGE[b] ? b : KNOWLEDGE[name] ? name : null;
  if (hit) usedKnowledge.add(hit);
  return hit;
};

const lensByName = new Map(MODEL.lenses.map((l) => [l.n.toLowerCase(), l.id]));
const usedLenses = new Set();
const lensOf = (name) => {
  const id = lensByName.get(String(name).toLowerCase()) || (LENSES[name] ? name : null);
  if (id) usedLenses.add(id);
  return id || null;
};

const list = (x) => (Array.isArray(x) ? x.filter(Boolean).map(String) : x ? [String(x)] : []);
const clean = (s) => (s == null ? "" : String(s));

/* attach resolved refs to a contract so the UI can link names to templates, knowledge and lenses */
function refsFor(contract) {
  const c = contract || {};
  const art = c.artifacts || {};
  const kn = c.knowledge || {};
  const ln = c.lenses || {};
  const artifacts = {};
  for (const n of [...list(art.inputs), ...list(art.outputs), ...list(art.evidence)]) artifacts[n] = tplOf(n);
  const knowledge = {};
  for (const v of Object.values(kn)) for (const n of list(v)) knowledge[n] = knowOf(n);
  const lenses = {};
  for (const n of [...list(ln.applicable), ...list(ln.required)]) lenses[n] = lensOf(n);
  return { artifacts, knowledge, lenses };
}

/* a prompt the trainee can paste into their agent for a lesson */
function lessonPrompt(actName, proc, sub, wf, asks) {
  const c = sub.contract || {};
  const def = c.definition || {};
  const lines = [`I'm working through "${sub.title}" (${actName} → ${proc.title}) on my own project. Act as my assistant: draft and check, I decide.`];
  if (def.purpose) lines.push("", `Goal: ${def.purpose}`);
  if (def.outcome) lines.push(`Done looks like: ${def.outcome}`);
  const inputs = list((c.artifacts || {}).inputs);
  if (inputs.length) lines.push("", "I'll attach or paste: " + inputs.join("; ") + ".");
  if (wf && wf.steps && wf.steps.length) {
    lines.push("", "Work through these steps with me, one at a time:");
    wf.steps.forEach((s, i) => {
      const ask = asks[s.id];
      lines.push(`${i + 1}. ${s.title}${s.out ? ` → ${s.out}` : ""}${s.decision ? " (a decision — give me the options and a recommendation; I make the call)" : ""}${ask ? `\n   ${ask}` : ""}`);
    });
  }
  const outputs = list((c.artifacts || {}).outputs);
  if (outputs.length) lines.push("", "Produce: " + outputs.join("; ") + ". Use clear headings I can paste into my document.");
  const crit = [...list((c.controls || {}).criteria), ...list(wf && wf.wf && wf.wf.criteria)];
  if (crit.length) lines.push("", "Before you finish, check it against: " + [...new Set(crit)].join("; ") + ".");
  lines.push("", "Ask me for anything you need instead of guessing. Keep it specific to my project.");
  return lines.join("\n");
}

function workflowOut(proc, sub, wf, actObj) {
  const w = wf.wf || {};
  const uses = w.uses || {};
  /* where each lens looks in along the workflow: "lensId: what it checks here", keyed by entry / step / gate */
  const lensUse = (key) => list((w.lensUses || {})[key]).map((x) => { const i = String(x).indexOf(":"); return i < 0 ? { id: clean(x), note: "" } : { id: clean(x.slice(0, i)).trim(), note: clean(x.slice(i + 1)).trim() }; });
  const steps = (wf.steps || []).map((s) => {
    const k = `${proc.id}.${sub.id}.${wf.id}.${s.id}`;
    const stepUses = list(uses[s.id]).map((n) => ({ name: n, ref: knowOf(n) }));
    return { id: s.id, title: clean(s.title), actor: clean(s.actor), out: clean(s.out), decision: !!s.decision, template: tplOf(s.out), ask: clean(actObj.promptAsk && actObj.promptAsk[k]), uses: stepUses, lenses: lensUse(s.id) };
  });
  const contract = {};
  for (const [key] of MODEL.workflow) if (key !== "steps" && w[key] != null) contract[key] = plain(w[key]);
  for (const n of [...list(w.inputs), ...list(w.outputs), ...list(w.evidence)]) tplOf(n);
  return {
    id: clean(wf.id), title: clean(wf.title), summary: clean(wf.summary), gate: clean(wf.gate),
    steps, loops: plain(wf.loops || []), contract,
    entryUses: list(uses.entry).map((n) => ({ name: n, ref: knowOf(n) })),
    entryLenses: lensUse("entry"), gateLenses: lensUse("gate"),
  };
}

function lesson(actPlan, actObj, proc, sub, index) {
  const c = sub.contract || {};
  const def = c.definition || {};
  const outputs = list((c.artifacts || {}).outputs);
  const asks = {};
  const wf0 = (sub.workflows || [])[0];
  if (wf0 && actObj.promptAsk) for (const s of wf0.steps || []) {
    const k = `${proc.id}.${sub.id}.${wf0.id}.${s.id}`;
    if (actObj.promptAsk[k]) asks[s.id] = actObj.promptAsk[k];
  }
  const teach = sub.teach || null;
  return {
    fid: `${actPlan.act}.${proc.id}.${sub.id}`,
    code: `${PLAN.indexOf(actPlan) + 1}.${actObj.processes.indexOf(proc) + 1}.${index + 1}`,
    title: clean(sub.title),
    summary: clean(sub.summary),
    gate: clean(sub.gate),
    contract: plain(c),
    refs: refsFor(c),
    workflows: (sub.workflows || []).map((w) => workflowOut(proc, sub, w, actObj)),
    objectives: teach && teach.objectives ? list(teach.objectives) : list((c.flow || {}).normal).slice(0, 4),
    exercise: teach && teach.exercise
      ? clean(teach.exercise) + " Then do the same for your own project."
      : `On your own project, produce ${outputs.length ? outputs.join(" and ") : "this lesson's output"}${def.outcome ? ` — so that: ${def.outcome.replace(/\.$/, "")}` : ""}.`,
    quiz: teach && teach.checks ? teach.checks.map(([q, options, answer, why]) => ({ q, options, answer, why })) : [],
    prompt: lessonPrompt(actPlan.name, proc, sub, wf0, asks),
  };
}

const simpleLesson = (fid, code, title, summary, exercise, criteria) => ({
  fid, code, title, summary, gate: "", contract: null, refs: { artifacts: {}, knowledge: {}, lenses: {} }, workflows: [],
  objectives: [summary], exercise, quiz: [], prompt: "", criteria,
});

function spread(items, n) {
  const out = Array.from({ length: n }, () => []);
  items.forEach((it, i) => out[Math.floor((i * n) / items.length)].push(it));
  return out;
}

const offer = ctx.NODE_OFFER || {};
const stories = (offer.course && offer.course.stories) || {};
const days = [];

for (const ap of PLAN) {
  const actObj = ACTS[ap.act];
  spread(actObj.processes, ap.days.length).forEach((procs, i) => {
    days.push({
      day: ap.days[i], kind: "act",
      act: { id: ap.act, n: ap.n, name: ap.name, track: ap.track, gate: clean(actObj.gate), tagline: clean(actObj.tagline) },
      title: procs.map((p) => p.title).join(" & "),
      goal: procs.map((p) => clean((p.contract && p.contract.definition && p.contract.definition.purpose) || p.summary)).join(" "),
      story: i === 0 ? clean(stories[ap.act]) : "",
      processes: procs.map((p) => ({
        id: p.id,
        code: `${PLAN.indexOf(ap) + 1}.${actObj.processes.indexOf(p) + 1}`,
        title: clean(p.title), summary: clean(p.summary), gate: clean(p.gate),
        contract: plain(p.contract), refs: refsFor(p.contract), loops: plain(p.loops || []),
        subprocessIds: (p.subprocesses || []).map((s) => s.id),
        lessons: (p.subprocesses || []).map((s, k) => lesson(ap, actObj, p, s, k)),
      })),
      gate: {
        title: i === ap.days.length - 1 ? `${procs.map((p) => clean(p.gate)).join(" · ")} — and the ${clean(actObj.gate)} for Act ${ap.n}` : procs.map((p) => clean(p.gate)).join(" · "),
        criteria: [...new Set(procs.flatMap((p) => list(((p.contract || {}).controls || {}).criteria)))].slice(0, 8),
      },
    });
  });
}

for (const [day, title, ex] of [
  [28, "Pull your evidence together", "Gather the documents, decisions and results from every act into one folder, in order. List anything missing and fill the gaps."],
  [29, "Present your project", "Prepare a 10-minute walkthrough: the problem, the decision, the product, the results and what you learned. Rehearse it once with your agent as the audience."],
  [30, "Earn your certificate", "Present to your mentor, take their questions, and submit your project folder for the certificate review."],
]) {
  days.push({
    day, kind: "capstone",
    act: { id: "capstone", n: "★", name: "Capstone", track: "run", gate: "Certificate", tagline: "" },
    title, goal: clean(stories.capstone), story: "",
    processes: [{ id: "capstone", code: "★", title: "Capstone", summary: title, gate: "Capstone review", contract: null, loops: [], lessons: [simpleLesson(`capstone.capstone.d${day}`, `★.${day - 27}`, title, ex, ex, ["Done and saved in your project folder"])] }],
    gate: { title, criteria: ["The work for today is done and in my project folder"] },
  });
}
/* Day 0 — the kick-off orientation (scripts/kickoff-guide.cjs): built last, from the real numbers of the month */
days.push(require("./kickoff-guide.cjs")({ PLAN, ACTS, days, root: ROOT, clean }));
days.sort((a, b) => a.day - b.day);

/* ---------- write ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const w = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data));

for (const d of days) w(`day-${d.day}.json`, d);
w("index.json", days.map((d) => ({
  day: d.day, title: d.title, act: d.act,
  lessonCount: d.processes.reduce((n, p) => n + p.lessons.length, 0),
  lessonIds: d.processes.flatMap((p) => p.lessons.map((l) => l.fid)),
})));

const templates = {};
for (const id of usedTemplates) {
  const a = ARTIFACTS[id];
  templates[id] = { id, type: clean(a.type), what: clean(a.what), purpose: clean(a.purpose), owner: clean(a.owner), users: list(a.users), good: list(a.good), tpl: plain(a.tpl) };
}
w("templates.json", templates);

const knowledge = {};
for (const k of usedKnowledge) knowledge[k] = { name: k, ...plain(KNOWLEDGE[k]) };
w("knowledge.json", knowledge);

const lenses = {};
for (const id of usedLenses) {
  const meta = MODEL.lenses.find((l) => l.id === id) || {};
  lenses[id] = { id, name: meta.n || id, group: meta.g || "", icon: meta.i || "visibility", short: meta.c || "", ...plain(LENSES[id] || {}) };
}
w("lenses.json", lenses);

w("model.json", { contract: plain(MODEL.contract), workflow: plain(MODEL.workflow), routes: plain(MODEL.routes), lifecycleLoops: plain((ctx.NODE_ROADMAP || {}).loops || []) });

const lessons = days.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.length, 0), 0);
const size = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`days: ${days.length} · lessons: ${lessons} · templates: ${Object.keys(templates).length} · knowledge: ${Object.keys(knowledge).length} · lenses: ${Object.keys(lenses).length} · ${(size / 1024 / 1024).toFixed(1)} MB in ${fs.readdirSync(OUT).length} files`);
