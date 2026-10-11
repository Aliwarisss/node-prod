/* Node — the platform landing page's content.
 * Node is a computer-science training platform that bridges the gap between education and the market: it helps
 * newcomers kick-start a career, fresh graduates get market-ready, and experienced people scale, switch and adapt.
 * Programs, models and toolkits sit on one platform. The live program is Copy, Paste, Go (30 days); four more are
 * coming — Hello, World (15 days), Dots (1 month), The NODE (3 months, in the making) and the Nano Degree
 * (6 months) — with more to come.
 * Numbers in `platformStats` and `actModel` come from the Node book (the-book/sdlc) so the page never overstates. */
import { bookBaseUrl, flagship, programFee } from "@/lib/node-landing-data";

export type Status = "live" | "free" | "included" | "soon" | "building";
export const statusLabel: Record<Status, string> = { live: "Live", free: "Free to explore", included: "Included with a program", soon: "Coming soon", building: "In the making" };

const book = (path: string) => (bookBaseUrl ? `${bookBaseUrl.replace(/\/$/, "")}${path}` : null);
/* Learn from experts who ship — what the experts do for you (no named people on the page) */
export const experts = [
  { icon: "construction", color: "#e91e63", title: "Practitioners, not lecturers", body: "People who build and run software for a living — teaching how the market works today, not how it worked years ago." },
  { icon: "groups", color: "#4fd1c5", title: "Weekly live syncs", body: "Bring your questions and blockers. Leave with a clear next step for your project." },
  { icon: "rate_review", color: "#a78bfa", title: "Reviews on your real work", body: "Feedback on your own documents, designs and code — not on quizzes or toy exercises." },
  { icon: "verified_user", color: "#e2b13c", title: "A seat at your gates", body: "An expert checks your evidence at every gate, so what you ship — and what you show employers — holds up." },
];

/* The flagship program's own page */
export const flagshipHref = "/programs/30-day-agentic-delivery";
export const programsHref = "/programs";

/* A page's screens, in order — drives the side rail */
export type PageSection = { id: string; label: string };
export const pageSections: PageSection[] = [
  { id: "top", label: "Home" },
  { id: "about", label: "What is Node" },
  { id: "who", label: "Who it's for" },
  { id: "catalog", label: "Programs" },
  { id: "program", label: "Copy, Paste, Go" },
  { id: "next", label: "Coming next" },
  { id: "model", label: "The method" },
  { id: "how", label: "How it works" },
  { id: "experts", label: "Experts" },
  { id: "pricing", label: "Pricing" },
  { id: "start", label: "Start" },
];

/* What Node is: the bridge between what education teaches and what the market asks for */
export const bridge = {
  education: ["Theory and syllabus", "Exams and grades", "Yesterday's stack", "Learning on your own"],
  market: ["Shipping real products", "Evidence and a portfolio", "AI agents and modern delivery", "Working with a team"],
  node: ["Real projects", "Current tools", "Mentors", "One lifecycle"],
};

/* Who Node is for — three stages of a career */
export const careerStages = [
  { id: "newbies", who: "Newcomers", verb: "Kick-start", color: "#e91e63", icon: "rocket_launch", body: "New to computer science? Learn how software is really built — the whole lifecycle — on a project of your own, with agents as your team." },
  { id: "freshers", who: "Fresh graduates", verb: "Get market-ready", color: "#008080", icon: "school", body: "You have the degree. Node adds what the job asks for: real projects, current tools, agentic workflows and evidence you can show." },
  { id: "experienced", who: "Experienced professionals", verb: "Scale, switch, adapt", color: "#6d48d8", icon: "trending_up", body: "Grow in your domain, move into a new one, or catch up with AI-driven delivery — and keep flowing with the market." },
];

export type CatalogItem = {
  id: string;
  kind: "program" | "model" | "toolkit";
  title: string;
  tagline: string;
  icon: string;
  status: Status;
  meta: string[];
  href?: string | null;
  cta?: string;
  flagship?: boolean;
};

/* The programs, shortest first — one path from a first look to a specialisation. Copy, Paste, Go is live; the rest
   are coming next. */
export type ProgramStep = {
  id: string; title: string; length: string; icon: string; color: string; who: string;
  line: string; // one line, for the menu
  tagline: string; outcome: string; status: "live" | "soon" | "building"; live?: boolean; href?: string;
};
export const programPath: ProgramStep[] = [
  { id: "hello-world", title: "Hello, World", length: "15 days", icon: "travel_explore", color: "#4fd1c5", status: "soon", who: "Freshers, and anyone choosing where to go",
    line: "Taste every flavour of computer science — then pick your path.",
    tagline: "Every great career starts with hello. A short exploration of computer science: taste each flavour of the field — the domains, the jobs, the day-to-day — before you choose where to go.",
    outcome: "Know which door to open next." },
  { id: "copy-paste-go", title: flagship.name, length: "30 days", icon: "rocket_launch", color: "#e91e63", status: "live", who: "No experience needed",
    line: "Build an app end to end with AI agents.",
    tagline: "Develop apps end to end with agentic AI. One real project through all eight acts — requirements to deployment, no team needed.",
    outcome: "A real app shipped, a portfolio and a certificate.", live: true, href: flagshipHref },
  { id: "dots", title: "Dots — My Team for ‘X’", length: "1 month", icon: "diversity_3", color: "#a78bfa", status: "soon", who: "Founders, leads and teams",
    line: "Connect the dots — build and run your team for X.",
    tagline: "Connect the dots: build your team for X — your product, your start-up, your client — and run the lifecycle together, people and agents side by side.",
    outcome: "A team that ships, with roles, rituals and kits." },
  { id: "the-node", title: "The NODE", length: "3 months", icon: "hub", color: "#f4a261", status: "building", who: "Graduates, career switchers, professionals",
    line: "The NODE concept itself — the navigator of demand and expertise.",
    tagline: "The full NODE concept, being built now: the navigator of demand and expertise. A three-month journey to bridge the gap between what the market needs and what you can do — and become part of something great.",
    outcome: "Market-ready, with the expertise to prove it." },
  { id: "nano-degree", title: "Nano Degree", length: "6 months", icon: "workspace_premium", color: "#6d48d8", status: "soon", who: "Those going deep",
    line: "The nano degree of NODE — go deep and specialise.",
    tagline: "The nano degree of NODE. Six months to dive deep and specialise — one discipline mastered end to end, on real work, with mentors who do it for a living.",
    outcome: "A specialisation, and a Nano Degree to show for it." },
];

/* A Day at NODE — masterclasses: one day, one skill, 2–4 hours with an expert. Many of them, alongside the path.
   The classes listed are examples (rename, add or remove freely). */
export const masterclasses = {
  id: "a-day-at-node", title: "A Day at NODE", kind: "Masterclasses", length: "2–4 hours", icon: "light_mode", color: "#f2b705",
  status: "soon" as const,
  line: "One day, one skill — a 2–4 hour masterclass with an expert.",
  tagline: "Masterclasses that fit in a day: 2–4 hours on one skill, hands-on, with someone who does it for a living. Pick one, or collect them all.",
  classes: [
    { title: "Prompts that ship", hours: 2 },
    { title: "Idea to PRD in a day", hours: 3 },
    { title: "Agents in your repo", hours: 3 },
    { title: "Deploy your first app", hours: 4 },
  ],
};

/* what's after the path — ideas on the drawing board (rename or remove freely) */
export const moreToCome = {
  title: "More to come",
  body: "New programs land here first. Create a free account and you’ll hear the moment one opens.",
  ideas: ["Role tracks", "Short skill courses", "Node for universities", "Node for companies"],
};

export const catalog: CatalogItem[] = [
  ...programPath.map((p): CatalogItem => ({
    id: p.id, kind: "program", flagship: !!p.live, title: p.title, tagline: p.tagline, icon: p.icon, status: p.status,
    meta: p.live ? [p.length, "Project-based", programFee.amount] : [p.length, p.who], href: p.href ?? null, cta: p.live ? "Explore the program" : undefined,
  })),
  { id: masterclasses.id, kind: "program", title: masterclasses.title, tagline: masterclasses.tagline, icon: masterclasses.icon, status: masterclasses.status, meta: [masterclasses.length, masterclasses.kind] },
  { id: "node-model", kind: "model", title: "The NODE Model", tagline: "The lifecycle every program runs on: eight acts, five levels of detail, one contract for every unit.", icon: "hub", status: "free", meta: ["8 acts", "10-part contract"], href: book("/sdlc/index.html#/map"), cta: "Open the model" },
  { id: "dual-track", kind: "model", title: "Dual-Track Delivery", tagline: "How modern teams ship: discovery and delivery in parallel, three backlog levels, Ready and Done gates.", icon: "view_stream", status: "included", meta: ["3 backlogs", "2 tracks"] },
  { id: "reasoning-chain", kind: "model", title: "The Reasoning Chain", tagline: "Twelve questions senior engineers ask about any piece of work — written down so anyone can.", icon: "psychology_alt", status: "free", meta: ["12 questions"], href: book("/sdlc/index.html#/reasoning"), cta: "Read it" },
  { id: "initiative-canvas", kind: "model", title: "Initiative Canvas", tagline: "Plan your own initiative on one page, then take it through every act.", icon: "draw", status: "free", meta: ["One page"], href: book("/sdlc/index.html#/canvas"), cta: "Open the canvas" },
  { id: "agent-kits", kind: "toolkit", title: "Agent Kits", tagline: "Context files, skills, commands, workflow specs, subagents, guardrails and rubrics — drop the folder into your repo.", icon: "inventory_2", status: "included", meta: ["475 files · Act I", "Any agent"] },
  { id: "prompt-library", kind: "toolkit", title: "Prompt Library", tagline: "Ready prompts at five levels — run a whole act, or a single step. Copy, paste, go.", icon: "chat", status: "included", meta: ["5 levels", "Tool-agnostic"] },
  { id: "template-library", kind: "toolkit", title: "Template Library", tagline: "Every document the work produces, with a filled-in example and what good looks like.", icon: "description", status: "included", meta: ["73 templates"] },
];

/* The NODE model — the lifecycle the whole platform runs on (from the book) */
export const tracks = [
  { id: "discovery", name: "Discovery", color: "#6d48d8", q: "Are we building the right thing?" },
  { id: "delivery", name: "Delivery", color: "#008080", q: "Are we building the thing right?" },
  { id: "run", name: "Run & learn", color: "#c49000", q: "Is it working, and what did we learn?" },
];
export const actModel = [
  { id: "discover", n: "I", name: "Discover", q: "Is the problem worth solving?", gate: "Discovery Decision", track: "discovery", days: "Days 1–5", open: true },
  { id: "plan", n: "II", name: "Plan", q: "Commit scope, funding, sequence.", gate: "Commitment", track: "discovery", days: "Days 6–8" },
  { id: "design", n: "III", name: "Design", q: "Shape the solution before code.", gate: "Design Readiness", track: "discovery", days: "Days 9–11" },
  { id: "build", n: "IV", name: "Build", q: "Turn design into verified increments.", gate: "Definition of Done", track: "delivery", days: "Days 12–15" },
  { id: "verify", n: "V", name: "Verify", q: "Prove it works and fits.", gate: "Quality Gate", track: "delivery", days: "Days 16–18" },
  { id: "release", n: "VI", name: "Release", q: "Ship safely and reversibly.", gate: "Go / No-Go", track: "delivery", days: "Days 19–21" },
  { id: "operate", n: "VII", name: "Operate", q: "Run, respond, learn.", gate: "SLO & Error Budget", track: "run", days: "Days 22–24" },
  { id: "evolve", n: "VIII", name: "Evolve", q: "Measure, adapt or retire.", gate: "Portfolio Decision", track: "run", days: "Days 25–27" },
];
export const programDays = [
  { from: 0, to: 0, act: "Kick-off", track: "discovery", does: "Set up your project, your agents and your kit." },
  ...actModel.map((a) => { const [f, t] = a.days.replace("Days ", "").split("–").map(Number); return { from: f, to: t, act: a.name, track: a.track, does: a.q }; }),
  { from: 28, to: 30, act: "Capstone", track: "run", does: "Ship and present your project end to end — and earn your certificate." },
];
export const programIncludes = [
  "All 10 modules and the full Node book",
  "Prompts and agent kits for every step",
  "Project vetting and weekly mentor syncs",
  "Node certificate and Claude certification prep",
  "Capstone showcase and hiring-partner access",
  "Community and lifetime access",
];

export const howSteps = [
  { icon: "explore", title: "Pick a path", body: "A program for a goal, a model to learn, or a toolkit to use today. Every path runs on the same lifecycle." },
  { icon: "construction", title: "Learn on your own project", body: "Read the book, watch Learn mode walk the happy path, then do each step on something real of yours." },
  { icon: "smart_toy", title: "Work with your agents", body: "Copy the prompt for the step, give your agent the kit, review what it produces against the step's checks." },
  { icon: "verified_user", title: "Prove it at the gate", body: "Every unit ends in a gate. Pass it with evidence, collect the documents, and build a portfolio as you go." },
];


export const footer = {
  blurb: "Node — bridging the gap between education and the market in computer science.",
  columns: [
    { title: "Platform", links: [{ label: "What is Node", href: "#about" }, { label: "Why Node", href: "/why" },{ label: "Programs", href: "/programs" }, { label: "The method", href: "#model" }, { label: flagship.name, href: flagshipHref }, { label: "Pricing", href: "#pricing" }] },
    { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Create an account", href: "/register" }, { label: "Dashboard", href: "/dashboard" }] },
  ],
};
