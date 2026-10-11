/* The 30-Day Agentic Delivery program as a course: modules, lessons and what you make.
 * Same plain-language content as the-book/sdlc/offer.js (NODE_OFFER.course + NODE_OFFER.plain) — keep the two in sync. */
import { actModel, tracks } from "@/lib/platform-data";

export type Lesson = { title: string; line: string };
export type Module = {
  n: number;
  id: string;
  title: string;
  question: string;
  days: string;
  track: string;
  color: string;
  story: string;
  lessons: Lesson[];
  makes: string[];
  preview?: boolean;
};

const L = (pairs: [string, string][]): Lesson[] => pairs.map(([title, line]) => ({ title, line }));
const colorOf = (track: string) => tracks.find((t) => t.id === track)?.color ?? "#008080";

export const example =
  "Our example project: an operations team where order clerks re-type emailed PDF orders into the company system by hand. It’s slow, error-prone, and peak season is coming.";

const ACTS: Record<string, { title: string; question: string; story: string; lessons: [string, string][]; makes: string[] }> = {
  discover: {
    title: "Find a problem worth solving",
    question: "Is this problem real, and is it worth solving now?",
    story: "You start with the problem, not the code: who has it, how much it hurts, and whether solving it is worth it. In the example: clerks lose hours every week re-typing PDF orders.",
    lessons: [
      ["Understand the situation", "Find out who wants this, who decides, and what limits you."],
      ["Turn the idea into a clear problem", "Separate the problem from the solution, and write guesses you can test."],
      ["Watch and listen to real users", "Talk to people, watch them work, and find the real pain."],
      ["Check if it’s worth it", "Look at alternatives, test demand, and estimate the value."],
      ["Make the call", "Weigh value, effort and risk — then go, change course, pause or stop."],
    ],
    makes: ["A clear problem statement, backed by evidence", "A map of who’s involved and who decides", "A one-page brief for the next step", "A list of risks and guesses to check"],
  },
  plan: {
    title: "Decide what to build first",
    question: "What exactly will we build, and is it worth the investment?",
    story: "The idea got a Go. Now you decide exactly what to build first and why: the requirements, what’s in and out, how big it is, the release plan, and the go-ahead to invest. In the example: release one reads clean PDFs automatically; tricky orders come later.",
    lessons: [
      ["Write down what’s needed", "Turn the problem into clear requirements."],
      ["Choose what comes first", "Decide what’s in, what’s out, and what waits."],
      ["Estimate the effort", "How big is it, and who do you need?"],
      ["Plan the releases", "Put the work in order, in small steps."],
      ["Get the go-ahead", "Make the case and get approval to invest."],
    ],
    makes: ["A clear list of what’s needed", "An ordered to-do list (your backlog)", "A release plan", "Approval to go ahead"],
  },
  design: {
    title: "Design it before you build it",
    question: "How will it look, work and stay safe?",
    story: "Before any code, you shape the solution: how it looks and feels, how it’s structured, how data flows, and how it stays secure. In the example: a review screen for clerks, a small parsing service, and orders kept for 90 days.",
    lessons: [
      ["Design the experience", "Sketch the screens and flows, and test them with users."],
      ["Map the business rules", "Name the key things and rules the software must respect."],
      ["Choose the structure", "Decide how the system fits together — and why."],
      ["Design the data", "Decide what data you keep, where, and for how long."],
      ["Make it safe", "Think like an attacker, and protect people’s data."],
      ["Set the quality bar", "Decide how fast, reliable and accessible it must be."],
    ],
    makes: ["Screen designs tested with users", "A diagram of how the system fits together — and why", "A security and privacy check", "Clear targets for speed and reliability"],
  },
  build: {
    title: "Build it, piece by piece",
    question: "How do we turn the design into working software?",
    story: "You build it in small slices, sprint by sprint — your agent writes much of the code, you direct and review it — through an automated pipeline. In the example: upload, then read, then review, then send to the company system.",
    lessons: [
      ["Set up your workshop", "Your code repository, automatic checks and environments."],
      ["Plan small slices", "Break the work into small pieces you can test."],
      ["Write the code", "Build features with your agent — JavaScript/TypeScript or Rust, on MERN or Next.js."],
      ["Review and combine", "Check every change, then merge it safely."],
      ["Test as you go", "Write automatic tests for your code."],
      ["Document it", "Explain how it works and how to run it."],
    ],
    makes: ["Working software, added piece by piece", "Automatic checks that run on every change", "Reviewed code you can trace back to the plan", "A record of what’s inside your software"],
  },
  verify: {
    title: "Test that it really works",
    question: "Does it work — and does it do what people need?",
    story: "You prove it works and fits: automated tests at every level, plus performance, security and accessibility checks, and real users accepting it. In the example: clerks try it on last month’s orders.",
    lessons: [
      ["Plan the testing", "Decide what to test first, based on risk."],
      ["Test the features", "Check every feature works from start to finish."],
      ["Test speed, security and access", "Performance, security and accessibility checks."],
      ["Let users try it", "Real users confirm it does the job."],
      ["Fix what’s broken", "Sort, fix and re-check the problems you found."],
    ],
    makes: ["Test results linked to what was needed", "A list of known problems and risks", "Users’ sign-off"],
  },
  release: {
    title: "Launch it safely",
    question: "How do we get it to users without breaking anything?",
    story: "You ship it safely: a small group first, watch the signals, then everyone — always with a way back. In the example: one team for a week behind a switch, then all teams.",
    lessons: [
      ["Prepare the launch", "Plan the launch — and a way back if needed."],
      ["Deploy automatically", "Ship the same safe way every time."],
      ["Roll out gradually", "A few users first, then everyone."],
      ["Get ready for users", "Support, announcements and training."],
      ["Check it after launch", "Make sure it’s healthy once it’s live."],
    ],
    makes: ["Your software live — with a way back", "Release notes and announcements", "Support ready to help users"],
  },
  operate: {
    title: "Keep it running",
    question: "Is it healthy, and what do we do when something goes wrong?",
    story: "You keep it healthy: dashboards, alerts, calm incident handling, and an eye on cost. In the example: an alert fires when reading accuracy drops below 90%.",
    lessons: [
      ["Watch how it’s doing", "Dashboards and alerts that warn you early."],
      ["Handle incidents", "Fix problems calmly when they happen."],
      ["Find root causes", "Stop the same problem coming back."],
      ["Support your users", "Answer questions and requests."],
      ["Manage capacity and cost", "Right-size it, and keep costs in check."],
      ["Keep it secure", "Spot threats and fix weaknesses."],
    ],
    makes: ["A health dashboard and alerts", "Incident notes and lessons learned", "A clear view of running costs"],
  },
  evolve: {
    title: "Learn and improve",
    question: "Did it work, and what should we do next?",
    story: "Did it work? You measure against the goal you set in Module 1, learn, and decide what’s next. In the example: handling time fell from 14 to 9 minutes; next up, supplier e-invoices.",
    lessons: [
      ["Measure the results", "Compare what happened with your original goal."],
      ["Listen to feedback", "Gather what users, support and data are telling you."],
      ["Pay down shortcuts", "Fix the quick fixes before they slow you down."],
      ["Decide what’s next", "Grow it, change it, or stop it."],
      ["Retire it well", "Switch old things off safely."],
    ],
    makes: ["A results report against your goal", "A list of improvements", "Ideas for the next round", "A plan for retiring old parts"],
  },
};

export const modules: Module[] = [
  {
    n: 0, id: "kickoff", title: "How Copy, Paste, Go works — and pick your project", question: "How does the month work, and what will you build?", days: "Day 0", track: "discovery", color: "#d81b60",
    story: "Your orientation: the road ahead through every stage, how days, chapters and lessons fit together, how tasks are handed in and reviewed, how the agent kit unlocks, and how achievements work. Then you pick the project you’ll build this month and set up your agent and kit.",
    lessons: L([
      ["Welcome to Copy, Paste, Go", "What the 30 days are for, and the road ahead."],
      ["How the month works", "Stages, days, chapters, lessons — and how each one opens."],
      ["Inside a lesson", "The seven steps of every lesson, and how to read a workflow map."],
      ["Tasks, submissions and reviews", "What you make in each lesson, and how it gets checked."],
      ["Your agent kit", "The files that turn your agent into a team — and how they unlock."],
      ["Achievements and community", "XP, levels, badges and the leaderboard — and the people learning with you."],
      ["Pick your project", "Your own idea, a brief from work, or a practice project."],
    ]),
    makes: ["A clear picture of the month ahead", "Your agent, set up and tested", "Your project, chosen and described", "Your project folder, with the kick-off kit"],
  },
  ...actModel.map((a, i) => {
    const c = ACTS[a.id];
    return { n: i + 1, id: a.id, title: c.title, question: c.question, days: a.days, track: a.track, color: colorOf(a.track), story: c.story, lessons: L(c.lessons), makes: c.makes, preview: a.id === "discover" };
  }),
  {
    n: 9, id: "capstone", title: "Capstone and certificate", question: "Can you show it, end to end?", days: "Days 28–30", track: "run", color: "#d81b60",
    story: "Now it’s your turn, end to end: you present your own project — the decision, the evidence and what you learned — and earn your certificate.",
    lessons: L([
      ["Pull your evidence together", "Your documents, decisions and results — from every module."],
      ["Present your project", "Show the problem, the decision, the product and the results."],
      ["Earn your certificate", "Complete the capstone and receive your Node certificate."],
    ]),
    makes: ["A finished, live project", "A portfolio you can show", "Your Node certificate"],
  },
];

export const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);

export const outcomes = [
  "Take an idea from problem to production, end to end",
  "Work with AI agents: you decide, they draft, research and check",
  "Find and validate a real problem before building anything",
  "Plan, design and build software in small, tested slices",
  "Test, launch and run software safely",
  "Measure results and decide what to do next",
];

export const audience = [
  { who: "Newcomers and career switchers", icon: "rocket_launch", color: "#d81b60", what: "Learn the whole map first, then the code — and leave with a real project, a portfolio and a certificate." },
  { who: "Fresh graduates", icon: "school", color: "#008080", what: "Turn your degree into market-ready practice: real delivery, current tools and evidence to show employers." },
  { who: "Developers", icon: "code", color: "#6d48d8", what: "Go beyond code — discovery, planning, design, testing, release and operations — from developer to engineer." },
  { who: "Product people and founders", icon: "lightbulb", color: "#c49000", what: "Learn to direct agents and work with engineers, and ship MVPs faster on evidence." },
];

export const requirements = [
  "No experience needed",
  "A computer and an internet connection",
  "Access to an AI model, such as a Claude Pro or Max plan, or the API",
  "An idea for a project — or pick one of ours",
];

/* What you leave the month with */
export const leaveWith = [
  { icon: "rocket_launch", title: "A live project", body: "Your own app, shipped to real users — with a way back." },
  { icon: "folder_special", title: "A portfolio", body: "Every document, decision and result, from problem to production." },
  { icon: "inventory_2", title: "Your agent kit", body: "Prompts, skills and workflows you keep using after the program." },
  { icon: "workspace_premium", title: "Your Node certificate", body: "Earned in the capstone, with the evidence behind it." },
];

export const faqs = [
  { q: "Do I need any experience?", a: "No. The program starts from zero and teaches the whole lifecycle on one project of your own. Your agents do much of the heavy lifting; you learn to direct and check their work." },
  { q: "What will I build?", a: "One real project of your choice — your own idea, a brief from work, or a starter project we give you. You take it through every module and ship it in the capstone." },
  { q: "Which AI tools do I use?", a: "The prompts and agent kits are tool-agnostic: they work with Claude Code, Codex and other agents. You need access to one AI model, for example a Claude Pro or Max plan, or the API." },
  { q: "Do I get a certificate?", a: "Yes — the Node certificate when you finish the capstone. We also guide you through Claude Academy’s free courses and prepare you for Claude certifications; Node does not issue Claude certifications itself." },
  { q: "How much does it cost?", a: "One price for everything: PKR 5,000, one-time — 50% off the full PKR 10,000. That includes all modules, the kit, mentor syncs, the certificate, community and lifetime access." },
];
