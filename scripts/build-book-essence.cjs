/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node script that loads the book's browser data */
/* Builds the book's "Essence" page — Discover distilled to one page — from the act's own data:
 *   • its purpose, job, rules, criteria, policies, failures, roles, authority, flow and routing   acts/discover.js
 *   • the five topics' questions, titles and gates                                             the book's own topic files
 *   • the principles its lessons use, and where                                                 knowledge.json + day-1…5.json
 *   • the size of what it's built on (subjects, lenses, methods)                                the prerequisites part
 * Writes lib/program/book/discover/essence.ts and discover-ur/essence.ts. Run: node scripts/build-book-essence.cjs
 * Only connecting sentences are written here, in both languages; the Roman Urdu edition translates the act's prose. */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const ROOT = path.join(__dirname, "..");
global.window = global;
require(path.join(ROOT, "the-book/sdlc/model.js"));
require(path.join(ROOT, "the-book/sdlc/roadmap.js"));
for (const f of ["discover-units.js", "discover.js"]) { try { require(path.join(ROOT, "the-book/sdlc/acts", f)); } catch { /* units are optional */ } }
const A = window.NODE_ACTS.discover, C = A.contract;
const KNOW = require(path.join(ROOT, "lib/program/data/knowledge.json"));
const byKnow = new Map(Object.values(KNOW).map((k) => [k.name, k]));
const load = (p) => { const out = ts.transpileModule(fs.readFileSync(p, "utf8"), { compilerOptions: { module: 1, target: 7 } }).outputText; const m = { exports: {} }; new Function("module", "exports", "require", out)(m, m.exports, () => ({})); return m.exports; };

/* the principles under the lessons, and where they're used */
const uses = new Map();
for (let d = 1; d <= 5; d++) {
  const D = require(path.join(ROOT, `lib/program/data/day-${d}.json`));
  for (const p of D.processes) for (const l of p.lessons) for (const w of l.workflows) for (const s of w.steps) for (const u of s.uses ?? []) {
    const n = u.ref || u.name;
    if (byKnow.get(n)?.type !== "Principle") continue;
    if (!uses.has(n)) uses.set(n, new Set());
    uses.get(n).add(l.code);
  }
}
const principles = [...uses].map(([n, s]) => ({ name: n, what: byKnow.get(n).what, codes: [...s].sort() })).sort((a, b) => b.codes.length - a.codes.length || a.codes[0].localeCompare(b.codes[0]));

/* Roman Urdu for the act's prose (names of artifacts, gates and methods stay in English) */
const UR = {
  [C.definition.jtbd]: "Jab koi brief meri mez par aaye, to meri madad karo ke main system aur masle ko itna samajh loon ke aisa approach chun sakoon jis ka main difaa kar sakoon.",
  [C.definition.outcome]: "Saboot par tika technical faisla: system samjha hua, masla naapa hua, options sabit kiye hue aur ek approach ADR mein record.",
  "Every claim traces to evidence or is labelled an assumption": "Har daawa kisi saboot tak jaata hai, warna assumption likha jaata hai",
  "No build commitment before the gate": "Gate se pehle build ka koi wada nahi",
  "Problem stated without solution language": "Masla solution ki zubaan ke baghair likha jaata hai",
  "Every claim about the system has a source": "System ke baare mein har daawe ka source hai",
  "Feasibility, effort and risk assessed for each option": "Har option ki feasibility, effort aur risk parkhe jaate hain",
  "Spikes are time-boxed": "Spikes time-boxed hain",
  "Never test against production": "Production par kabhi test nahi",
  "Solution chosen first, evidence gathered to justify it": "Pehle solution chun liya, phir use sahi sabit karne ke liye saboot jama kiya",
  "Endless spiking — discovery never converges": "Kabhi khatam na hone wali spiking — discovery kisi nateeje par nahi pohanchti",
  "Solving the wrong problem": "Ghalat masla hal karna",
  "Designing around guesses": "Andazon par design karna",
  "Brief": "Brief", "System understood": "System samjha hua", "Problem framed": "Masla frame hua", "Problem measured": "Masla naapa hua", "Options proven": "Options sabit", "Decided": "Faisla ho gaya",
  "1.3 and 1.4 overlap — measurements shape the options and prototypes sharpen the problem": "1.3 aur 1.4 ek doosre par chadhte hain — measurements options ko shakal dete hain aur prototypes masle ko tez karte hain",
  "The system context (1.1) is updated throughout": "System context (1.1) poore safar mein update hota rehta hai",
  [C.execution.authority]: "Technical faisle ka maalik tech lead hai; hard constraints ke takraao client tay karta hai.",
  "Don't design anything until the context, constraints and people are understood.": "Jab tak context, constraints aur log samajh na aa jayein, kuch design na karein.",
  "A sentence is not evidence; every release criterion links to the artifact that proves it, for this build.": "Jumla saboot nahi hota; har criterion us artifact se juda hota hai jo use sabit karta hai.",
  "Keep digging until the cause is found; complaints are symptoms.": "Jab tak cause na mile khodte rahein; shikayatein sirf symptoms hain.",
  "SLIs measure the user's experience — orders drafted, lines right — not server internals.": "Woh naapein jo user mehsoos karta hai — orders, sahi lines — server ke andar ki baatein nahi.",
  "Prioritise the questions that reduce the most uncertainty per unit of effort.": "Un sawalon ko pehle rakhein jo kam mehnat mein sab se zyada uncertainty ghatate hain.",
  "List what you don't know before estimating or committing.": "Estimate ya wada karne se pehle likhein ke aap ko kya nahi pata.",
  "Every gate ends in a named decision with an owner and a rationale — never by default.": "Har gate ek naam wale faisle par khatam hota hai, owner aur wajah ke saath — kabhi khud ba khud nahi.",
  "An unclear criterion is a question for the product owner, not a guess in the code.": "Ghair waazeh criterion product owner ke liye sawal hai, code mein andaza nahi.",
  "Every statement about the system is either a fact with a source you could show someone, or an assumption labelled as one, with a confidence and a way to test it.": "System ke baare mein har baat ya to source wala fact hai jo aap kisi ko dikha sakein, ya assumption jis par label, confidence aur test karne ka tareeqa ho.",
  "Write beliefs so that evidence could prove them wrong.": "Apne yaqeen aise likhein ke saboot unhein ghalat sabit kar sake.",
  "Stay attached to the problem and the user, not to the first solution you thought of.": "Masle aur user se jude rahein, pehle soche hue solution se nahi.",
  "Build only what differentiates; buy or reuse the rest.": "Sirf woh banayein jo farq paida kare; baqi khareedein ya dobara istemaal karein.",
  "Express estimates as ranges with confidence, not single numbers.": "Estimates ko confidence ke saath range mein batayein, ek number mein nahi.",
  "System context pack — brief, audit, data, integrations, constraints": "System context pack — brief, audit, data, integrations, constraints",
  "Technical problem framing, hypotheses & spike plan": "Technical problem ki framing, hypotheses aur spike plan",
  "Technical problem statement with a measured baseline": "Naape hue baseline ke saath technical problem statement",
  "Solution options proven by prototypes": "Prototypes se sabit kiye hue solution options",
  "Technical decision (ADR) with feasibility, effort & risk": "Feasibility, effort aur risk ke saath technical faisla (ADR)",
  "A — Tech lead": "A — Tech lead", "R — Engineer": "R — Engineer", "C — Architect, system owners, Security": "C — Architect, system owners, Security", "I — Client contact": "I — Client contact",
};
const tr = (lang, s) => (lang === "ur" ? UR[s] ?? s : s);

const W = {
  en: {
    title: "Discover in essence", kicker: "Essence", question: "If you remember one page of this chapter, make it this one.",
    lead: "Discover answers one question before anyone builds: what is really there — and can we build it? Everything in this chapter is a way of answering it with evidence instead of opinion.",
    job: "The job it does", jobP: "Said the way the person in the role would say it:",
    sentence: "The purpose, part by part", sentenceCap: "Discover's purpose, taken apart. Each part is one thing the chapter makes you establish — and the last part says when.",
    parts: [["Establish, with technical evidence,", "How", "Not by meeting, opinion or vendor promise — by things you ran, read, measured or tested."], [" what really exists,", "The system", "Topic 1.1: the system as it is, not as it's documented."], [" what the problem is in the system,", "The problem", "Topics 1.2 and 1.3: framed, then reproduced and measured."], [" and which solution is feasible", "The choice", "Topics 1.4 and 1.5: options proven, then one decided."], [" — before any build is committed to.", "When", "The point of the whole chapter: the evidence comes first."]],
    rule: "The rule under everything", ruleP: "The chapter has many lessons and one rule. The act's contract states it twice — once as a rule, once as a principle:",
    principlesNamed: "And two principles the act names as its own:",
    chain: "Five questions, one decision", chainP: "Each topic asks one question and closes at its own gate. Together they turn a brief into a decision you can defend.",
    chainHead: ["Topic", "The question it answers", "What it leaves behind", "Its gate"], chainCap: "The chapter in one table: each topic's question, what it produces, and the review that closes it.",
    matures: "How the evidence matures", maturesP: "Read the chapter as one object changing state. The brief becomes an understood system, then a framed problem, then a measured one; options are proven against it, and the last step is a decision.",
    maturesCap: "The states discovery moves through, from brief to decision. Play it to watch the evidence mature.",
    overlapTitle: "Not quite a straight line",
    made: "What it's made of", madeP: "Underneath, Discover is a combination — read the prerequisites for the detail:",
    madeHub: "Discover", madeCap: "The building blocks of Discover, counted from the program's own data.",
    madeItems: (s, rl, al, m) => [["Subjects", "school", `${s} subjects it draws its topics from — product, requirements, security, agile and agents.`], ["Lenses", "visibility", `${rl} lenses required on the act, ${al} more that join when the problem touches them.`], ["Methods", "construction", `${m} named frameworks, standards, methods, techniques, practices, patterns, principles and tools.`], ["Evidence", "fact_check", "What it produces — system audit, measurements, prototype results — every claim points at one."], ["Decision", "gavel", "Where it ends — one approach recorded in an ADR, or a recorded \"do not build\"."]],
    principles: "The principles underneath", principlesP: "These are the principles Discover's lessons actually lean on, most used first. Together they are the chapter's attitude: understand first, label guesses, chase causes, decide out loud.",
    principlesHub: "How Discover thinks", principlesCap: "The principles under Discover's lessons. Click one for what it means; the table below says where each is used.",
    principlesHead: ["Principle", "What it means", "Used in"], principlesTableCap: "Every principle Discover's lessons use, and the lessons that use it.",
    who: "Who does what", whoP: "Discover is done by a person in the role, with an agent beside them, and decided by people with the authority to decide.",
    whoHead: ["Role", "Who"], whoCap: "The act's RACI: accountable, responsible, consulted, informed.",
    wrong: "How it goes wrong", wrongP: "The act's contract names the ways discovery fails — and its own controls are the answer to each.",
    concernsTitle: "What it guards against",
    ends: "How it ends", endsP: "Every discovery ends in one of five places. Walk it:",
    endsCap: "Discover's five endings, from the act's routing. Only one of them is \"build\" — and \"do not build\" is a valid, recorded result.",
    q: { complete: "Is the evidence complete?", framed: "Is the problem framed right?", feasible: "Is an option feasible?", blocked: "Does a hard constraint block every option?" },
    breath: "In one breath", breathCap: "The outcome of Discover, in the act's own words.",
    closingP: "That's the essence. The rest of the chapter — the prerequisites, the introduction and the five topics — is how to do it well.",
    authorityTitle: "Who decides",
    roleOf: { A: "Accountable", R: "Responsible", C: "Consulted", I: "Informed" },
    traps: "Failure", fixes: "What the act does about it",
  },
  ur: {
    title: "Discover ka nichor", kicker: "Essence", question: "Agar is chapter ka sirf ek page yaad rakhna ho, to yeh rakhein.",
    lead: "Discover kisi ke build karne se pehle ek sawal ka jawab deta hai: asal mein kya maujood hai — aur kya hum ise bana sakte hain? Is chapter ki har cheez is ka jawab raaye ke bajaye saboot se dene ka ek tareeqa hai.",
    job: "Yeh kaam kya karta hai", jobP: "Us shakhs ke alfaaz mein jo is role mein hai:",
    sentence: "Maqsad, hissa ba hissa", sentenceCap: "Discover ka maqsad, khol kar. Har hissa ek cheez hai jo yeh chapter aap se sabit karwata hai — aur aakhri hissa batata hai kab.",
    parts: [["Technical saboot ke saath sabit karein", "Kaise", "Meeting, raaye ya vendor ke wade se nahi — un cheezon se jo aap ne chalayin, parhin, naapin ya test kin."], [" ke asal mein kya maujood hai,", "System", "Topic 1.1: system jaisa hai, jaisa likha hua hai waisa nahi."], [" system mein masla kya hai,", "Masla", "Topics 1.2 aur 1.3: frame hua, phir reproduce aur naapa hua."], [" aur kaunsa solution mumkin hai", "Chunaao", "Topics 1.4 aur 1.5: options sabit, phir ek ka faisla."], [" — kisi bhi build ka wada karne se pehle.", "Kab", "Poore chapter ka nichor: saboot pehle aata hai."]],
    rule: "Har cheez ke neeche ka qaida", ruleP: "Chapter mein bahut se lessons hain aur ek qaida. Act ka contract ise do dafa kehta hai — ek dafa qaide ke taur par, ek dafa usool ke taur par:",
    principlesNamed: "Aur do usool jinhein act apna kehta hai:",
    chain: "Paanch sawal, ek faisla", chainP: "Har topic ek sawal poochta hai aur apne gate par band hota hai. Mil kar yeh ek brief ko aise faisle mein badalte hain jis ka aap difaa kar sakein.",
    chainHead: ["Topic", "Kis sawal ka jawab", "Peeche kya chhorta hai", "Gate"], chainCap: "Chapter ek table mein: har topic ka sawal, woh kya banata hai, aur kaunsa review use band karta hai.",
    matures: "Saboot kaise pakta hai", maturesP: "Chapter ko ek cheez ki tarah parhein jo halat badalti hai. Brief samjha hua system banta hai, phir frame hua masla, phir naapa hua; options us ke khilaaf sabit hote hain, aur aakhri qadam faisla hai.",
    maturesCap: "Woh halatein jin se discovery guzarti hai, brief se faisle tak. Chala kar dekhein saboot kaise pakta hai.",
    overlapTitle: "Bilkul seedhi lakeer nahi",
    made: "Yeh kis cheez se bana hai", madeP: "Neeche se Discover ek majmua hai — tafseel prerequisites mein parhein:",
    madeHub: "Discover", madeCap: "Discover ke building blocks, program ke apne data se gine hue.",
    madeItems: (s, rl, al, m) => [["Subjects", "school", `${s} subjects jin se yeh apne topics leta hai — product, requirements, security, agile aur agents.`], ["Lenses", "visibility", `${rl} lenses act par zaroori, ${al} aur jo masle ke chhoone par shamil hote hain.`], ["Methods", "construction", `${m} naam wale frameworks, standards, methods, techniques, practices, patterns, principles aur tools.`], ["Saboot", "fact_check", "Yeh kya banata hai — system audit, measurements, prototype results — har daawa kisi ek ki taraf ishara karta hai."], ["Faisla", "gavel", "Yeh kahan khatam hota hai — ek approach ADR mein record, ya record kiya hua \"mat banao\"."]],
    principles: "Neeche ke usool", principlesP: "Yeh woh usool hain jin par Discover ke lessons waqai tikte hain, sab se zyada istemaal wale pehle. Mil kar yeh chapter ka mizaaj hain: pehle samjho, andazon par label lagao, causes ka peecha karo, faisla khul kar karo.",
    principlesHub: "Discover kaise sochta hai", principlesCap: "Discover ke lessons ke neeche ke usool. Kisi ek par click karein us ka matlab dekhne ke liye; neeche ki table batati hai har ek kahan istemaal hota hai.",
    principlesHead: ["Usool", "Matlab", "Kahan istemaal"], principlesTableCap: "Har usool jo Discover ke lessons istemaal karte hain, aur kaunse lessons.",
    who: "Kaun kya karta hai", whoP: "Discover role wala shakhs karta hai, agent us ke saath hota hai, aur faisla woh log karte hain jin ke paas faisle ka ikhtiyaar hai.",
    whoHead: ["Role", "Kaun"], whoCap: "Act ka RACI: accountable, responsible, consulted, informed.",
    wrong: "Yeh kaise bigadta hai", wrongP: "Act ka contract un tareeqon ka naam leta hai jin se discovery naakaam hoti hai — aur us ke apne controls har ek ka jawab hain.",
    concernsTitle: "Yeh kis cheez se bachata hai",
    ends: "Yeh kaise khatam hota hai", endsP: "Har discovery paanch mein se ek jagah khatam hoti hai. Qadam ba qadam dekhein:",
    endsCap: "Discover ke paanch anjaam, act ki routing se. In mein se sirf ek \"build\" hai — aur \"mat banao\" bhi ek jaaiz, record kiya hua nateeja hai.",
    q: { complete: "Kya saboot mukammal hai?", framed: "Kya masla sahi frame hua hai?", feasible: "Kya koi option mumkin hai?", blocked: "Kya koi hard constraint har option ko rok raha hai?" },
    breath: "Ek saans mein", breathCap: "Discover ka nateeja, act ke apne alfaaz mein.",
    closingP: "Yeh hai nichor. Baqi chapter — prerequisites, taaruf aur paanch topics — ise achhi tarah karne ka tareeqa hai.",
    authorityTitle: "Faisla kaun karta hai",
    roleOf: { A: "Accountable", R: "Responsible", C: "Consulted", I: "Informed" },
    traps: "Naakaami", fixes: "Act is ke baare mein kya karta hai",
  },
};
const UR_ROUTE = {
  forward: "Mumkin → PLAN ko decision record aur chuna hua option", alternate: "Dobara frame → wapas 1.2 Frame the Technical Problem", rework: "Saboot mein khala → wapas 1.3 / 1.4",
  escalate: "Hard constraint har option rok raha hai → tech lead client ke paas le jaata hai", stop: "Mumkin nahi → decision record + learning",
};

function build(lang) {
  const w = W[lang], book = lang === "en" ? "discover" : "discover-ur";
  const topics = ["day1", "day2", "day3", "day4", "day5"].map((f) => Object.values(load(path.join(ROOT, "lib/program/book", book, `${f}.ts`)))[0]);
  const found = load(path.join(ROOT, "lib/program/book", book, "foundations.ts")).foundations;
  const nSubjects = (found.sections[1].blocks.find((b) => b.t === "figure" && b.fig.kind === "hub")?.fig.items.length) ?? 0;
  const nMethods = Number((found.sections[3].blocks.find((b) => b.t === "lead")?.text.match(/\d+/) ?? ["0"])[0]);
  const states = C.flow.stateTransitions.split("→").map((s) => s.trim());
  const route = (k, en) => (lang === "ur" ? UR_ROUTE[k] : en);
  const blocks = [
    { t: "lead", text: w.lead },
    { t: "h", text: w.job }, { t: "p", text: w.jobP },
    { t: "pull", text: tr(lang, C.definition.jtbd) },
    { t: "h", text: w.sentence },
    { t: "figure", fig: { kind: "anatomy", parts: w.parts.map(([text, label, note]) => ({ text, label, note })) }, caption: w.sentenceCap },
    { t: "h", text: w.rule }, { t: "p", text: w.ruleP },
    { t: "quote", text: tr(lang, C.controls.rules.find((r) => /evidence/i.test(r)) ?? C.controls.rules[0]) },
    { t: "p", text: w.principlesNamed },
    { t: "list", items: C.knowledge.principles.map((n) => `**${n}** — ${tr(lang, byKnow.get(n)?.what ?? "")}`) },
    { t: "h", text: w.chain }, { t: "p", text: w.chainP },
    { t: "table", head: w.chainHead, rows: topics.map((c, i) => [`1.${c.day} ${c.title}`, c.question ?? "", tr(lang, A.outcomes[i] ?? ""), c.kicker]), caption: w.chainCap },
    { t: "h", text: w.matures }, { t: "p", text: w.maturesP },
    { t: "figure", fig: { kind: "flow", steps: states.map((s, i) => ({ label: tr(lang, s), sub: i === 0 ? "" : i === states.length - 1 ? A.gate : `1.${Math.min(i, 5)}`, tone: i === 0 ? "human" : i === states.length - 1 ? "risk" : "new" })).map((x) => (x.sub ? x : { label: x.label, tone: x.tone })) }, caption: w.maturesCap },
    { t: "callout", tone: "key", title: w.overlapTitle, text: C.flow.parallel.map((p) => tr(lang, p)).join(". ") + "." },
    { t: "h", text: w.made }, { t: "p", text: w.madeP },
    { t: "figure", fig: { kind: "hub", center: w.madeHub, items: w.madeItems(nSubjects, A.lenses.required.length, A.lenses.applicable.length, nMethods).map(([label, icon, text]) => ({ label, icon, text })) }, caption: w.madeCap },
    { t: "h", text: w.principles }, { t: "p", text: w.principlesP },
    { t: "figure", fig: { kind: "hub", center: w.principlesHub, items: principles.slice(0, 7).map((p, i) => ({ label: p.name, icon: ["lightbulb", "fact_check", "search", "speed", "insights", "help", "gavel"][i], text: tr(lang, p.what) })) }, caption: w.principlesCap },
    { t: "table", head: w.principlesHead, rows: principles.map((p) => [p.name, tr(lang, p.what), p.codes.join(", ")]), caption: w.principlesTableCap },
    { t: "h", text: w.who }, { t: "p", text: w.whoP },
    { t: "table", head: w.whoHead, rows: C.execution.roles.map((r) => { const [k, who] = r.split(" — "); return [`${k} · ${w.roleOf[k] ?? k}`, who]; }), caption: w.whoCap },
    { t: "callout", tone: "key", title: w.authorityTitle, text: tr(lang, C.execution.authority) },
    { t: "h", text: w.wrong }, { t: "p", text: w.wrongP },
    { t: "pitfalls", items: [
      { trap: tr(lang, C.cases.failures[0]), fix: tr(lang, C.controls.criteria.find((c) => /solution language/i.test(c)) ?? C.controls.criteria[0]) },
      { trap: tr(lang, C.cases.failures[1]), fix: tr(lang, C.controls.policies.find((c) => /time-boxed/i.test(c)) ?? C.controls.policies[0]) },
      { trap: tr(lang, C.lenses.concerns[1]), fix: tr(lang, C.controls.criteria.find((c) => /source/i.test(c)) ?? C.controls.criteria[1]) },
      { trap: tr(lang, C.lenses.concerns[0]), fix: tr(lang, C.controls.rules.find((c) => /before the gate/i.test(c)) ?? C.controls.rules[0]) },
    ] },
    { t: "h", text: w.ends }, { t: "p", text: w.endsP },
    { t: "figure", fig: { kind: "decide", start: "complete", nodes: [
      { id: "complete", q: w.q.complete, yes: "framed", no: "rework" },
      { id: "framed", q: w.q.framed, yes: "feasible", no: "alternate" },
      { id: "feasible", q: w.q.feasible, yes: "forward", no: "blocked" },
      { id: "blocked", q: w.q.blocked, yes: "escalate", no: "stop" },
      { id: "rework", result: route("rework", A.routing.rework), tone: "neutral" },
      { id: "alternate", result: route("alternate", A.routing.alternate), tone: "neutral" },
      { id: "forward", result: route("forward", A.routing.forward), tone: "good" },
      { id: "escalate", result: route("escalate", A.routing.escalate), tone: "neutral" },
      { id: "stop", result: route("stop", A.routing.stop), tone: "bad" },
    ] }, caption: w.endsCap },
    { t: "h", text: w.breath },
    { t: "pull", text: tr(lang, C.definition.outcome) },
    { t: "p", text: w.closingP },
  ];
  return { id: "essence", n: "E", title: w.title, kicker: w.kicker, question: w.question, intro: blocks, sections: [] };
}

for (const [lang, dir] of [["en", "discover"], ["ur", "discover-ur"]]) {
  const ch = build(lang);
  const src = `import type { BookChapter } from "../types";

/* Discover in essence — one page. GENERATED by scripts/build-book-essence.cjs from the act's contract, the book's topics,
 * the principles its lessons use and the prerequisites part; edit the script, not this file. */
export const essence: BookChapter = ${JSON.stringify(ch, null, 1)};
`;
  fs.writeFileSync(path.join(ROOT, "lib/program/book", dir, "essence.ts"), src, "utf8");
  console.log(dir, "essence:", ch.intro.length, "blocks,", ch.intro.filter((b) => b.t === "figure").length, "figures");
}
console.log("principles:", principles.map((p) => `${p.name} (${p.codes.length})`).join(", "));
