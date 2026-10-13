/* Builds the book's Prerequisites part — "What Discover is built on" — from the program's own data:
 *   • the act's contract (entry criteria, dependencies, lenses)      the-book/sdlc/acts/discover.js
 *   • the roadmap's subjects mapped to Discover (and their topics)  the-book/sdlc/roadmap.js
 *   • the lenses (disciplines) and where each lesson needs them     lib/program/data/lenses.json, day-1…5.json
 *   • every knowledge item Discover's lessons use, with its source  lib/program/data/knowledge.json, model.js
 * Writes lib/program/book/discover/foundations.ts and discover-ur/foundations.ts. Run: node scripts/build-book-foundations.cjs
 * Only the connecting prose is written here (in both languages); every name, number and mapping comes from the data. */
/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node script that loads the book's browser data */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
global.window = global;
require(path.join(ROOT, "the-book/sdlc/model.js"));
require(path.join(ROOT, "the-book/sdlc/roadmap.js"));
for (const f of ["discover-units.js", "discover.js"]) { try { require(path.join(ROOT, "the-book/sdlc/acts", f)); } catch { /* units are optional for the contract */ } }
const ACT = window.NODE_ACTS.discover, RM = window.NODE_ROADMAP, MODEL = window.NODE_MODEL;
const LENSES = require(path.join(ROOT, "lib/program/data/lenses.json"));
const KNOW = require(path.join(ROOT, "lib/program/data/knowledge.json"));
const byLensName = new Map(Object.values(LENSES).map((l) => [l.name, l]));
const byKnow = new Map(Object.values(KNOW).map((k) => [k.name, k]));

/* ---- gather ---- */
const entry = ACT.contract.definition.entry, deps = ACT.contract.flow.dependencies;
const ACT_NAME = Object.fromEntries(RM.stages.map((s) => [s.id, s.id.charAt(0).toUpperCase() + s.id.slice(1)]));
const subjects = RM.subjects.filter((s) => s.acts.includes("discover"));
const lessons = [];
const uses = new Map(); // knowledge name → Set(lesson codes)
for (let d = 1; d <= 5; d++) {
  const D = require(path.join(ROOT, `lib/program/data/day-${d}.json`));
  for (const p of D.processes) for (const l of p.lessons) {
    const ls = l.contract?.lenses ?? {};
    lessons.push({ code: l.code, title: l.title, required: (ls.required ?? []).map((n) => byLensName.get(n)?.id ?? n), applicable: (ls.applicable ?? []).map((n) => byLensName.get(n)?.id ?? n) });
    for (const w of l.workflows) for (const s of w.steps) for (const u of s.uses ?? []) {
      const n = u.ref || u.name;
      if (!uses.has(n)) uses.set(n, new Set());
      uses.get(n).add(l.code);
    }
  }
}
const items = [...uses].filter(([n]) => byKnow.has(n)).map(([n, set]) => ({ ...byKnow.get(n), codes: [...set].sort() }));
const TYPES = Object.keys(MODEL.knowledgeTypes);
const reqIds = ACT.lenses.required, appIds = ACT.lenses.applicable;
const lensCount = (id, key) => lessons.filter((l) => l[key].includes(id)).length;

/* ---- the words around the data, in both languages ---- */
const W = {
  en: {
    title: "What Discover is built on", kicker: "Prerequisites", question: "What does Discover stand on — and what should you bring to it?",
    intro: [
      "Discover is where the engineering starts, but it doesn't start from nothing. It is built from a handful of **subjects**, it looks at every problem through a set of engineering **disciplines**, and it borrows **methods** that other people proved before you.",
      "This part names all three, and what has to be in place before the first topic begins. Read it once now; come back to it whenever a lesson leans on something you haven't met.",
    ],
    parts: ["Before you start", "The subjects it's built on", "The disciplines it looks through", "Where its methods come from"],
    partsCap: "The four parts of the prerequisites",
    entry: {
      title: "Before you start", lead: "Two things must exist before discovery can begin, and a few more must be reachable while it runs.",
      tldr: ["Discover starts from a client brief and read access to the system — or to the systems a new one must sit beside.", "While it runs it depends on access, on the owners of the systems involved, and on time for spikes.", "It assumes you're already comfortable with the subject topics it draws on — tick the ones you know."],
      hEntry: "What must exist first", pEntry: "These are the act's entry criteria. If either is missing, discovery can't start honestly: without a brief there is no ask to test, and without access there is no system to read.",
      checkEntry: "Before topic 1.1 starts",
      hDeps: "What it depends on while it runs", pDeps: "Discovery reads, runs and measures. It needs these within reach the whole way through; when one is missing, the lessons tell you how to work around it and how to rate your confidence.",
      ctxCap: "What Discover needs around it: the brief and access going in, the owners it works with, the decision coming out.",
      ctx: { center: "Discover", brief: "Client brief", briefLink: "the ask to understand", system: "The system", systemLink: "read access", neighbours: "Neighbouring systems", neighboursLink: "when building new", logs: "Code, environments & logs", logsLink: "access", owners: "System & API owners", ownersLink: "answers and confirmations", plan: "PLAN", planLink: "the decision record" },
      hKnow: "What you should already be comfortable with", pKnow: "Discover draws on specific topics from its subjects. You don't need to be an expert in any of them — the lessons teach as they go — but you'll move faster if these aren't new. Tick what you already know; the rest is where to look first when a lesson leans on it.",
      checkKnow: "I'm comfortable with…", hNext: "What the next parts show", pNext: "The next three subtopics open up what Discover stands on: the subjects it's built from, the disciplines it looks through, and the methods it borrows — with where each one is used.",
    },
    subj: {
      title: "The subjects it's built on", lead: "Five subjects of the program feed Discover. Each brings a few of its topics here; the rest of each subject waits for later chapters.",
      tldr: ["Discover is built from five subjects: {names}.", "From each it draws only the topics discovery needs.", "Every subject continues into later chapters — Discover is where you meet it first."],
      hubCap: "The five subjects Discover is built on. Click one for what it brings.",
      hWhat: "What each one brings", pWhat: "Each subject has a job in the program. In Discover it does a smaller version of that job: the topics listed here are the parts of it you'll actually use.",
      head: ["Subject", "What it is for", "Drawn on in Discover", "Continues in"],
      tableCap: "The subjects behind Discover, the topics it draws from each, and the chapters where each continues.",
      treeCap: "From subject to topic: open a subject to see the topics Discover draws from it.",
      hLater: "What waits for later", pLater: "Part of each subject is out of scope here on purpose. Discover decides *whether and how* to build; the rest of each subject belongs to the chapters that plan, design and build it.",
      laterHead: ["Subject", "Topics for later chapters"], laterCap: "Each subject's topics that Discover doesn't draw on — they come later.",
      agentsKey: "Agentic development is the one subject that runs through every chapter. In Discover it's how you work — with an agent beside you on every lesson — not a topic you study on its own.",
      agentsTitle: "One subject runs through everything",
    },
    lens: {
      title: "The disciplines it looks through", lead: "Every discovery question is looked at through a few engineering disciplines — the program calls them lenses. Four are required on every Discover lesson; others apply when the problem touches them.",
      tldr: ["Required lenses: {req}.", "Applicable when the problem touches them: {app}.", "Each lesson names the lenses it needs; the counts below come from the lessons themselves."],
      hReq: "The four the act requires", pReq: "These four are the act's required lenses: together they decide whether discovery's evidence is good enough. {two} of the {all} lessons require two of them{except}.", exceptOne: (code, title, others) => `; ${code} ${title} requires one, alongside ${others}`, hubCap: "The required lenses of Discover. Click one for what it looks at.",
      hApp: "The ones that join when they're needed", pApp: "These lenses aren't required everywhere. A lesson brings one in when its problem touches it — personal data brings in privacy, a vendor product brings in the vendor lens.",
      appHead: ["Lens", "What it looks at"], appCap: "Discover's applicable lenses and what each one looks at.",
      hCount: "How often each one is needed", pCount: "Counting across the {all} Discover lessons shows where the weight sits: {top1} is required in {n1} of them and {top2} in {n2}; the others carry specific lessons.",
      barsUnit: "lessons that require it", barsCap: "How many of Discover's lessons require each lens (bars are out of all of them).",
      hMap: "Lesson by lesson", pMap: "Each lesson's own contract names the lenses it requires and the ones that may apply. This is the full map.",
      mapHead: ["Subtopic", "Required", "May apply"], mapCap: "The lenses each Discover lesson requires, and the ones that may apply.",
    },
    meth: {
      title: "Where its methods come from", lead: "Nothing in Discover is invented for this program. Its steps lean on {n} named frameworks, standards, methods, techniques, practices, patterns, principles and tools — most of them used across the industry for years.",
      tldr: ["Discover's lessons use {n} named pieces of knowledge, in eight kinds.", "Some come from standards bodies and well-known authors; the source is given wherever the program records one.", "{top} is the most used — it appears in {topN} of the {all} lessons."],
      hKinds: "Eight kinds of knowledge", pKinds: "The program sorts every piece of knowledge into one of eight kinds, so you know what you're holding: a standard you must meet is different from a technique you may pick up.",
      kindsHead: ["Kind", "What it is", "Used in Discover"], kindsCap: "The eight kinds of knowledge and how many of each Discover uses.",
      barsCap: "How many pieces of knowledge of each kind Discover's lessons use.", barsUnit: "pieces used",
      hTop: "The ones it leans on most", pTop: "A few pieces carry the act: they turn up lesson after lesson. Knowing these well pays back everywhere in Discover.",
      topCap: "The most-used knowledge in Discover, by the number of lessons that use it.", topUnit: "lessons that use it",
      hEach: "Every piece, by kind", pEach: "The full list, grouped by kind. Each row says where the piece comes from, when the program records a source, and the lessons that use it — open those lessons to see it at work.",
      head: ["Name", "Source", "Used in"], noSource: "—", kindCap: (t, n) => `${t}s used in Discover (${n}).`,
    },
    wh: [["What must be in place before Discover starts?", "foundations.entry"], ["Which subjects is Discover built on?", "foundations.subjects"], ["Which disciplines does it look through?", "foundations.lenses"], ["Where do its methods come from?", "foundations.methods"]],
  },
  ur: {
    title: "Discover kis buniyaad par khara hai", kicker: "Prerequisites", question: "Discover kis cheez par khara hai — aur aap ko saath kya lana chahiye?",
    intro: [
      "Engineering Discover se shuru hoti hai, lekin khaali haath nahi. Yeh chand **subjects** se bana hai, har masle ko kuch engineering **disciplines** ki nazar se dekhta hai, aur woh **methods** istemaal karta hai jo doosre log pehle sabit kar chuke hain.",
      "Yeh hissa teeno ka naam leta hai, aur yeh bhi ke pehla topic shuru hone se pehle kya maujood hona chahiye. Ise abhi ek dafa parh lein; jab bhi koi lesson kisi aisi cheez par tike jo aap ne pehle nahi dekhi, yahan wapas aa jayein.",
    ],
    parts: ["Shuru karne se pehle", "Jin subjects par yeh bana hai", "Jin disciplines se yeh dekhta hai", "Is ke methods kahan se aate hain"],
    partsCap: "Prerequisites ke chaar hisse",
    entry: {
      title: "Shuru karne se pehle", lead: "Discovery shuru hone se pehle do cheezein maujood honi chahiye, aur chalte waqt kuch aur pohanch mein honi chahiyein.",
      tldr: ["Discover client brief aur system ke read access se shuru hota hai — ya un systems ke jin ke saath naya system baithega.", "Chalte waqt yeh access, mutalliqa systems ke owners, aur spikes ke waqt par depend karta hai.", "Yeh farz karta hai ke jin subject topics par yeh tika hai woh aap ko pehle se kuch aate hain — jo aate hain unhein tick karein."],
      hEntry: "Pehle kya maujood ho", pEntry: "Yeh act ke entry criteria hain. Agar in mein se koi ek bhi na ho to discovery imaandari se shuru nahi ho sakti: brief ke baghair test karne ko koi ask nahi, aur access ke baghair parhne ko koi system nahi.",
      checkEntry: "Topic 1.1 shuru hone se pehle",
      hDeps: "Chalte waqt yeh kis par depend karta hai", pDeps: "Discovery parhti, chalati aur naapti hai. Use yeh cheezein shuru se aakhir tak pohanch mein chahiyein; jab koi na ho to lessons batate hain ke us ke baghair kaise kaam karein aur apne confidence ko kaise rate karein.",
      ctxCap: "Discover ko apne ird gird kya chahiye: brief aur access andar, owners ke saath kaam, aur faisla bahar.",
      ctx: { center: "Discover", brief: "Client brief", briefLink: "samajhne wala ask", system: "System", systemLink: "read access", neighbours: "Saath wale systems", neighboursLink: "naya banate waqt", logs: "Code, environments aur logs", logsLink: "access", owners: "System aur API owners", ownersLink: "jawab aur tasdeeq", plan: "PLAN", planLink: "decision record" },
      hKnow: "Aap ko pehle se kis cheez mein sahulat honi chahiye", pKnow: "Discover apne subjects ke khaas topics istemaal karta hai. In mein expert hona zaroori nahi — lessons saath saath sikhate hain — lekin agar yeh naye na hon to aap tezi se aage barhenge. Jo pehle se aata hai use tick karein; baqi woh jagah hai jahan kisi lesson ke tikne par pehle dekhna hai.",
      checkKnow: "Mujhe in mein sahulat hai…", hNext: "Agle hisse kya dikhate hain", pNext: "Agle teen subtopics kholte hain ke Discover kis par khara hai: jin subjects se bana, jin disciplines se dekhta, aur jo methods leta hai — aur har ek kahan istemaal hota hai.",
    },
    subj: {
      title: "Jin subjects par yeh bana hai", lead: "Program ke paanch subjects Discover ko khilaate hain. Har ek apne kuch topics yahan lata hai; har subject ka baqi hissa agle chapters ka intezar karta hai.",
      tldr: ["Discover paanch subjects se bana hai: {names}.", "Har ek se sirf woh topics leta hai jo discovery ko chahiyein.", "Har subject agle chapters mein jaari rehta hai — Discover woh jagah hai jahan aap us se pehli dafa milte hain."],
      hubCap: "Woh paanch subjects jin par Discover bana hai. Kisi ek par click karein ke woh kya lata hai.",
      hWhat: "Har ek kya lata hai", pWhat: "Program mein har subject ka ek kaam hai. Discover mein woh us kaam ka chhota roop karta hai: yahan diye gaye topics us ke woh hisse hain jo aap waqai istemaal karenge.",
      head: ["Subject", "Kis liye hai", "Discover mein istemaal", "Aage kahan"],
      tableCap: "Discover ke peeche subjects, har ek se liye gaye topics, aur woh chapters jahan har ek jaari rehta hai.",
      treeCap: "Subject se topic tak: kisi subject ko kholein aur dekhein Discover us se kaunse topics leta hai.",
      hLater: "Baad ke liye kya hai", pLater: "Har subject ka kuch hissa jaan boojh kar yahan shamil nahi. Discover faisla karta hai ke *banana hai ya nahi aur kaise*; baqi hissa un chapters ka hai jo plan, design aur build karte hain.",
      laterHead: ["Subject", "Agle chapters ke topics"], laterCap: "Har subject ke woh topics jo Discover istemaal nahi karta — woh baad mein aate hain.",
      agentsKey: "Agentic development woh ek subject hai jo har chapter mein chalta hai. Discover mein yeh aap ka kaam karne ka tareeqa hai — har lesson par agent aap ke saath — alag se parhne wala topic nahi.",
      agentsTitle: "Ek subject sab mein chalta hai",
    },
    lens: {
      title: "Jin disciplines se yeh dekhta hai", lead: "Discovery ka har sawal kuch engineering disciplines ki nazar se dekha jaata hai — program inhein lenses kehta hai. Chaar har Discover lesson par zaroori hain; baqi tab aate hain jab masla unhein chhoota hai.",
      tldr: ["Zaroori lenses: {req}.", "Jab masla chhooye tab lagu: {app}.", "Har lesson apne zaroori lenses ka naam leta hai; neeche ki ginti khud lessons se aati hai."],
      hReq: "Woh chaar jo act zaroori rakhta hai", pReq: "Yeh act ke chaar zaroori lenses hain: mil kar tay karte hain ke discovery ka saboot kaafi hai ya nahi. {all} mein se {two} lessons in mein se do zaroori rakhte hain{except}.", exceptOne: (code, title, others) => `; ${code} ${title} sirf ek zaroori rakhta hai, ${others} ke saath`, hubCap: "Discover ke zaroori lenses. Kisi ek par click karein ke woh kya dekhta hai.",
      hApp: "Jo zaroorat par shamil hote hain", pApp: "Yeh lenses har jagah zaroori nahi. Lesson inhein tab lata hai jab us ka masla inhein chhoota hai — personal data privacy ko lata hai, vendor product vendor lens ko.",
      appHead: ["Lens", "Kya dekhta hai"], appCap: "Discover ke applicable lenses aur har ek kya dekhta hai.",
      hCount: "Har ek kitni dafa chahiye", pCount: "Discover ke {all} lessons mein ginti dikhati hai ke wazan kahan hai: {top1} {n1} mein zaroori hai aur {top2} {n2} mein; baqi khaas lessons uthate hain.",
      barsUnit: "lessons jo ise zaroori rakhte hain", barsCap: "Discover ke kitne lessons har lens ko zaroori rakhte hain (bars sab lessons mein se hain).",
      hMap: "Lesson ba lesson", pMap: "Har lesson ka apna contract batata hai ke us ke zaroori lenses kaunse hain aur kaunse lagu ho sakte hain. Yeh poora naqsha hai.",
      mapHead: ["Subtopic", "Zaroori", "Lagu ho sakte hain"], mapCap: "Har Discover lesson ke zaroori lenses, aur jo lagu ho sakte hain.",
    },
    meth: {
      title: "Is ke methods kahan se aate hain", lead: "Discover mein kuch bhi is program ke liye ghadha nahi gaya. Is ke steps {n} naam wale frameworks, standards, methods, techniques, practices, patterns, principles aur tools par tike hain — zyada tar industry mein barson se istemaal ho rahe hain.",
      tldr: ["Discover ke lessons {n} naam wali knowledge istemaal karte hain, aath qismon mein.", "Kuch standards bodies aur mashhoor authors se aati hai; jahan program source record karta hai wahan diya gaya hai.", "{top} sab se zyada istemaal hota hai — {all} mein se {topN} lessons mein."],
      hKinds: "Knowledge ki aath qismein", pKinds: "Program har knowledge ko aath qismon mein se ek mein rakhta hai, taa ke pata ho aap ke haath mein kya hai: jo standard poora karna hai woh us technique se mukhtalif hai jo aap utha sakte hain.",
      kindsHead: ["Qism", "Kya hai", "Discover mein istemaal"], kindsCap: "Knowledge ki aath qismein aur Discover har ek ki kitni istemaal karta hai.",
      barsCap: "Discover ke lessons har qism ki kitni knowledge istemaal karte hain.", barsUnit: "istemaal",
      hTop: "Jin par yeh sab se zyada tikta hai", pTop: "Chand cheezein poora act uthati hain: lesson ke baad lesson aati hain. Inhein achhi tarah jaanna Discover mein har jagah faida deta hai.",
      topCap: "Discover mein sab se zyada istemaal hone wali knowledge, un lessons ki ginti se jo ise istemaal karte hain.", topUnit: "lessons jo ise istemaal karte hain",
      hEach: "Har cheez, qism ke hisaab se", pEach: "Poori list, qism ke hisaab se. Har row batati hai ke woh kahan se aati hai, jab program source record karta hai, aur kaunse lessons ise istemaal karte hain — un lessons ko khol kar ise kaam karte dekhein.",
      head: ["Naam", "Source", "Kahan istemaal"], noSource: "—", kindCap: (t, n) => `Discover mein istemaal hone wale ${t} (${n}).`,
    },
    wh: [["Discover shuru hone se pehle kya maujood hona chahiye?", "foundations.entry"], ["Discover kin subjects par bana hai?", "foundations.subjects"], ["Yeh kin disciplines se dekhta hai?", "foundations.lenses"], ["Is ke methods kahan se aate hain?", "foundations.methods"]],
  },
};
/* the few data strings that are prose rather than names: translated for the Roman Urdu edition */
const UR_SUBJECT_WHAT = {
  pm: "Hal karne ke qabil masle dhoondna aur saboot ke saath tay karna ke kya banana hai.",
  ba: "Zarooraton ko saaf, testable aur traceable requirements mein badalna.",
  sec: "Bharosa shuru se andar banana, baad mein jodna nahi.",
  agile: "Teams asal mein kaise deliver karti hain: discovery aur delivery saath saath.",
  agents: "Yeh sab AI agents ke saath karna — faisla aap ka, madad agents ki.",
};
const UR_LENS_SHORT = {
  arch: "Structure, boundaries, integrations aur woh faisle jo palatna mushkil hai.",
  eng: "Code, buildability, tooling aur team ki asal salahiyat.",
  data: "Data kahan se aata hai, kaise behta hai, us ka maalik kaun aur us ka mayaar.",
  req: "Ask kya hai, kis ka hai, aur kaise test ho ga.",
  sec: "Threats, attack surface, supply chain, vulnerability response.",
  priv: "Personal data, consent, retention aur data kahan rehta hai.",
  infra: "Platform, environments, capacity aur cost.",
  perf: "Speed, volume, latency aur load ke neeche rawayya.",
  vendor: "Third-party products, contracts, lock-in aur un ki had.",
  rel: "Failure, recovery, uptime aur resilience.",
  ops: "Chalana, monitor karna aur support karna.",
  qa: "Testing, quality ke saboot aur risk.",
  ai: "Models, accuracy, data aur AI ke khaas khatre.",
};
const UR_TYPE = {
  Framework: "Structured, adaptable practice ka majmua.", Standard: "Rasmi, bahar ka, aksar audit hone wala usool.", Pattern: "Baar baar aane wale masle ka naam wala, dobara istemaal hone wala hal.",
  Practice: "Sabit shuda, aadat bana kaam ka tareeqa.", Principle: "Rehnuma sachai jab koi qaida lagu na ho.", Method: "Tay shuda steps wala nizaami tareeqa.", Technique: "Khaas, markooz procedure.", Tool: "Aala jo kaam mein madad karta hai.",
};

/* ---- build ---- */
const minutesOf = (blocks) => Math.max(3, Math.round(JSON.stringify(blocks).split(/\s+/).length / 200));
const sec = (id, code, title, blocks) => ({ id, code, title, minutes: minutesOf(blocks), blocks });
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
function build(lang) {
  const w = W[lang], ur = lang === "ur";
  const subjWhat = (s) => (ur ? UR_SUBJECT_WHAT[s.id] ?? s.what : s.what);
  const lensShort = (l) => (ur ? UR_LENS_SHORT[l.id] ?? l.short : l.short);
  const typeDef = (t) => (ur ? UR_TYPE[t] : MODEL.knowledgeTypes[t][1]);
  const L = (id) => LENSES[id];
  const acts = (s) => s.acts.filter((a) => a !== "discover").map((a) => ACT_NAME[a] ?? a).join(", ") || "—";

  /* 1 · before you start */
  const e = w.entry;
  const entryBlocks = [
    { t: "lead", text: e.lead },
    { t: "tldr", items: e.tldr },
    { t: "h", text: e.hEntry }, { t: "p", text: e.pEntry },
    { t: "checklist", title: e.checkEntry, items: entry },
    { t: "h", text: e.hDeps }, { t: "p", text: e.pDeps },
    { t: "list", items: deps },
    { t: "figure", fig: { kind: "context", center: { label: e.ctx.center, sub: ACT.gate }, around: [
      { label: e.ctx.brief, type: "external", dir: "in", link: e.ctx.briefLink, text: entry[0] },
      { label: e.ctx.system, type: "system", dir: "in", link: e.ctx.systemLink, text: entry[1] },
      { label: e.ctx.logs, type: "store", dir: "in", link: e.ctx.logsLink, text: deps[0] },
      { label: e.ctx.owners, type: "person", dir: "both", link: e.ctx.ownersLink, text: deps[1] },
      { label: e.ctx.neighbours, type: "system", dir: "in", link: e.ctx.neighboursLink, text: entry[1] },
      { label: e.ctx.plan, type: "external", dir: "out", link: e.ctx.planLink, text: ACT.contract.definition.exit[1] ?? ACT.contract.definition.exit[0] },
    ] }, caption: e.ctxCap },
    { t: "h", text: e.hKnow }, { t: "p", text: e.pKnow },
    { t: "checklist", title: e.checkKnow, items: subjects.flatMap((s) => s.open.map((o) => `**${s.name}** — ${o}`)) },
    { t: "h", text: e.hNext }, { t: "p", text: e.pNext },
  ];

  /* 2 · the subjects */
  const s = w.subj;
  const subjBlocks = [
    { t: "lead", text: s.lead },
    { t: "tldr", items: s.tldr.map((x) => fill(x, { names: subjects.map((x) => x.name).join(", ") })) },
    { t: "figure", fig: { kind: "hub", center: "Discover", items: subjects.map((x) => ({ label: x.name, icon: x.icon, text: subjWhat(x) })) }, caption: s.hubCap },
    { t: "h", text: s.hWhat }, { t: "p", text: s.pWhat },
    { t: "table", head: s.head, rows: subjects.map((x) => [x.name, subjWhat(x), x.open.join("; ") || "—", acts(x)]), caption: s.tableCap },
    { t: "figure", fig: { kind: "tree", root: "Discover", children: subjects.map((x) => ({ label: x.name, text: subjWhat(x), children: x.open.map((o) => ({ label: o })) })) }, caption: s.treeCap },
    { t: "callout", tone: "agent", title: s.agentsTitle, text: s.agentsKey },
    { t: "h", text: s.hLater }, { t: "p", text: s.pLater },
    { t: "table", head: s.laterHead, rows: subjects.map((x) => [x.name, x.topics.filter((t) => !x.open.includes(t)).join("; ") || "—"]), caption: s.laterCap },
  ];

  /* 3 · the lenses */
  const l = w.lens;
  const lensRows = [...reqIds, ...appIds].map((id) => ({ id, n: lensCount(id, "required") })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const ofFour = (x) => x.required.filter((id) => reqIds.includes(id)).length;
  const two = lessons.filter((x) => ofFour(x) >= 2).length;
  const except = lessons.filter((x) => ofFour(x) < 2).map((x) => l.exceptOne(x.code, x.title, x.required.filter((id) => !reqIds.includes(id)).map((id) => L(id)?.name ?? id).join(", ") || "—")).join("");
  const pReq = fill(l.pReq, { two, all: lessons.length, except });
  const pCount = fill(l.pCount, { all: lessons.length, top1: L(lensRows[0].id).name, n1: lensRows[0].n, top2: L(lensRows[1].id).name, n2: lensRows[1].n });
  const lensBlocks = [
    { t: "lead", text: l.lead },
    { t: "tldr", items: l.tldr.map((x) => fill(x, { req: reqIds.map((id) => L(id).name).join(", "), app: appIds.map((id) => L(id).name).join(", ") })) },
    { t: "h", text: l.hReq }, { t: "p", text: pReq },
    { t: "figure", fig: { kind: "hub", center: ur ? "Zaroori lenses" : "Required lenses", items: reqIds.map((id) => ({ label: L(id).name, icon: L(id).icon, text: lensShort(L(id)) })) }, caption: l.hubCap },
    { t: "h", text: l.hApp }, { t: "p", text: l.pApp },
    { t: "table", head: l.appHead, rows: appIds.map((id) => [L(id).name, lensShort(L(id))]), caption: l.appCap },
    { t: "h", text: l.hCount }, { t: "p", text: pCount },
    { t: "figure", fig: { kind: "bars", unit: l.barsUnit, rows: lensRows.map((x) => ({ label: L(x.id).name, value: x.n, max: lessons.length, tone: reqIds.includes(x.id) ? "good" : "neutral" })) }, caption: l.barsCap },
    { t: "h", text: l.hMap }, { t: "p", text: l.pMap },
    { t: "table", head: l.mapHead, rows: lessons.map((x) => [`${x.code} ${x.title}`, x.required.map((id) => L(id)?.name ?? id).join(", "), x.applicable.map((id) => L(id)?.name ?? id).join(", ")]), caption: l.mapCap },
  ];

  /* 4 · the methods */
  const m = w.meth;
  const ranked = [...items].sort((a, b) => b.codes.length - a.codes.length || a.name.localeCompare(b.name));
  const methBlocks = [
    { t: "lead", text: fill(m.lead, { n: items.length }) },
    { t: "tldr", items: m.tldr.map((x) => fill(x, { n: items.length, top: ranked[0].name, topN: ranked[0].codes.length, all: lessons.length })) },
    { t: "h", text: m.hKinds }, { t: "p", text: m.pKinds },
    { t: "table", head: m.kindsHead, rows: TYPES.map((t) => [t, typeDef(t), String(items.filter((k) => k.type === t).length)]), caption: m.kindsCap },
    { t: "figure", fig: { kind: "bars", unit: m.barsUnit, rows: TYPES.map((t) => ({ label: t, value: items.filter((k) => k.type === t).length, max: Math.max(...TYPES.map((x) => items.filter((k) => k.type === x).length)), tone: "neutral" })) }, caption: m.barsCap },
    { t: "h", text: m.hTop }, { t: "p", text: m.pTop },
    { t: "figure", fig: { kind: "bars", unit: m.topUnit, rows: ranked.slice(0, 10).map((k) => ({ label: `${k.name} · ${k.type}`, value: k.codes.length, max: lessons.length, tone: "good" })) }, caption: m.topCap },
    { t: "h", text: m.hEach }, { t: "p", text: m.pEach },
    ...TYPES.flatMap((t) => {
      const of = ranked.filter((k) => k.type === t);
      if (!of.length) return [];
      return [{ t: "h3", text: `${t} · ${of.length}` }, { t: "table", head: m.head, rows: of.map((k) => [k.name, k.source || m.noSource, k.codes.join(", ")]), caption: m.kindCap(t, of.length) }];
    }),
  ];

  return {
    id: "foundations", n: "P", title: w.title, kicker: w.kicker, question: w.question,
    intro: [
      { t: "p", text: w.intro[0] }, { t: "p", text: w.intro[1] },
      { t: "figure", fig: { kind: "flow", steps: w.parts.map((p, i) => ({ label: p, sub: `P.${i + 1}`, tone: i === 0 ? "human" : "new" })) }, caption: w.partsCap },
    ],
    sections: [
      sec("foundations.entry", "P.1", w.entry.title, entryBlocks),
      sec("foundations.subjects", "P.2", w.subj.title, subjBlocks),
      sec("foundations.lenses", "P.3", w.lens.title, lensBlocks),
      sec("foundations.methods", "P.4", w.meth.title, methBlocks),
    ],
  };
}

for (const [lang, dir] of [["en", "discover"], ["ur", "discover-ur"]]) {
  const ch = build(lang);
  const src = `import type { BookChapter } from "../types";

/* The book's prerequisites for Discover — what it's built on. GENERATED by scripts/build-book-foundations.cjs from
 * the program's data (the act contract, the roadmap's subjects, the lenses and the knowledge library); edit the script,
 * not this file. */
export const foundations: BookChapter = ${JSON.stringify(ch, null, 1)};

/* the questions this part answers, by the subtopic that answers them */
export const foundationsQuestions = ${JSON.stringify(W[lang].wh.map(([q, at]) => ({ q, at })), null, 1)};
`;
  fs.writeFileSync(path.join(ROOT, "lib/program/book", dir, "foundations.ts"), src, "utf8");
  console.log(dir, "foundations:", ch.sections.map((s) => `${s.code} ${s.minutes}′`).join(" · "));
}
console.log("subjects:", subjects.map((s) => s.id).join(", "), "| lenses:", reqIds.length, "+", appIds.length, "| knowledge used:", items.length);
