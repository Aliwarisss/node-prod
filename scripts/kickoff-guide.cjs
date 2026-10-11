/* eslint-disable @typescript-eslint/no-require-imports -- a plain Node (CommonJS) script */
/* Day 0 — the kick-off: an orientation to Copy, Paste, Go. How the month works, what's inside a lesson, the agent
 * kit, tasks and reviews, achievements — then the trainee picks their project and sets up. Each lesson carries a
 * `guide` (short sections, each with a picture drawn from the program's real data) the day player shows before the
 * lesson's exercise. Numbers come from the built program, so they stay true when the book changes. */

const fs = require("fs");
const path = require("path");

module.exports = function kickoff({ PLAN, ACTS, days, root, clean }) {
  /* the month, from the built days */
  const actDays = days.filter((d) => d.kind === "act");
  const KICKOFF_LESSONS = 7;
  /* every lesson in the month: the stages, the capstone, and Day 0's own */
  const lessonsTotal = days.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.length, 0), 0) + KICKOFF_LESSONS;
  const chaptersTotal = actDays.reduce((n, d) => n + d.processes.length, 0);
  const workflowsTotal = actDays.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.reduce((k, l) => k + (l.workflows || []).length, 0), 0), 0);
  const kitIndex = JSON.parse(fs.readFileSync(path.join(root, "lib", "program", "kit-data", "index.json"), "utf8"));
  const kitFiles = Object.fromEntries(kitIndex.acts.map((a) => [a.id, a]));

  const stages = [
    { id: "kickoff", n: "0", name: "Kick-off", track: "discovery", days: "Day 0", gate: "Ready to start", line: "Learn how the month works, pick your project, set up.", lessons: 7, files: 0 },
    ...PLAN.map((ap) => {
      const act = ACTS[ap.act];
      const ds = actDays.filter((d) => d.act.id === ap.act);
      return {
        id: ap.act, n: ap.n, name: ap.name, track: ap.track,
        days: ap.days.length > 1 ? `Days ${ap.days[0]}–${ap.days[ap.days.length - 1]}` : `Day ${ap.days[0]}`,
        gate: clean(act.gate), line: clean(act.tagline),
        lessons: ds.reduce((n, d) => n + d.processes.reduce((m, p) => m + p.lessons.length, 0), 0),
        files: kitFiles[ap.act] ? kitFiles[ap.act].files : 0, firstDay: ap.days[0],
      };
    }),
    { id: "capstone", n: "★", name: "Capstone", track: "run", days: "Days 28–30", gate: "Certificate", line: "Pull your evidence together, present, earn the certificate.", lessons: 3, files: 0 },
  ];

  /* a real lesson, as the example all through Day 0 */
  const d1 = actDays.find((d) => d.day === 1);
  const p1 = d1.processes[0], l1 = p1.lessons[0], w1 = (l1.workflows || [])[0];
  const example = w1 ? {
    day: 1, stage: "Discover", chapter: clean(p1.title), lesson: clean(l1.title), code: l1.code, workflow: clean(w1.title),
    steps: (w1.steps || []).map((s) => ({ id: s.id, title: clean(s.title), decision: /^d/.test(s.id) })),
    loops: (w1.loops || []).map(([from, to, kind, label]) => ({ from, to, kind, label: clean(label) })),
    gate: clean(w1.gate), chapterLessons: p1.lessons.length, dayChapters: d1.processes.length,
  } : null;

  const discover = kitFiles.discover || { files: 0, layers: {} };
  const layerCount = (id) => discover.layers[id] || 0;

  const lessons = [
    /* (KICKOFF_LESSONS above counts these) */
    {
      id: "welcome", title: "Welcome to Copy, Paste, Go",
      summary: "What the 30 days are for, and the road ahead.",
      exercise: "In two or three lines: what do you want to be able to do on Day 30 that you can't do today? Keep it — you'll come back to it at the capstone.",
      criteria: ["I know what I'll make this month", "I've written what I want from it"],
      guide: {
        intro: "In 30 days you take one real project from idea to a running, measured product — working the way modern teams do, with AI agents as your team. You decide; your agents draft, research and check.",
        sections: [
          {
            icon: "route", title: "The road ahead",
            body: `Ten stages, in order. Each one asks a question, ends at a gate, and hands its results to the next. ${lessonsTotal} lessons in all.`,
            visual: { kind: "stages", stages },
          },
          {
            icon: "alt_route", title: "Three tracks",
            body: "The stages sit in three tracks — the way real delivery teams work, not one long waterfall.",
            points: [
              ["Discovery", "Discover · Plan · Design — are we building the right thing?"],
              ["Delivery", "Build · Verify · Release — are we building the thing right?"],
              ["Run & learn", "Operate · Evolve — is it working, and what did we learn?"],
            ],
          },
          {
            icon: "workspace_premium", title: "What you leave with",
            points: [
              ["A shipped project", "One project, carried through every stage — with every document, decision and result as evidence."],
              ["A portfolio", "Your project folder is the portfolio: it shows how you think, not just what you built."],
              ["The certificate", "Earned at the capstone, after you present your project to a mentor."],
              ["Your agent kit", "Every stage's prompts, commands, skills and reviewers — yours to keep using."],
            ],
          },
        ],
      },
    },
    {
      id: "month", title: "How the month works",
      summary: "Stages, days, chapters, lessons — and how each one opens.",
      exercise: "Open My program and find Day 1. Write down: its stage, its chapter, how many lessons it has, and the gate at the end of the stage.",
      criteria: ["I can find any day on the month map", "I know what opens a day and a stage"],
      guide: {
        intro: "The month is built in layers. Big picture first, then down to the single step you're doing now.",
        sections: [
          {
            icon: "account_tree", title: "From stage to step",
            body: "Every lesson sits in this ladder. The example is the very first lesson of Day 1.",
            visual: {
              kind: "ladder", rows: [
                { level: "Stage", icon: "flag", what: "8 stages + kick-off and capstone. Each ends at a gate.", example: example ? `Stage I · ${example.stage}` : "Stage I · Discover" },
                { level: "Day", icon: "calendar_today", what: "31 days. Each opens when you finish the day before.", example: example ? `Day ${example.day}` : "Day 1" },
                { level: "Chapter", icon: "menu_book", what: `A day's topic — ${chaptersTotal} in the month. One or two a day.`, example: example ? example.chapter : "" },
                { level: "Lesson", icon: "school", what: `One piece of the chapter, with its own task — ${lessonsTotal} in the month.`, example: example ? `${example.code} ${example.lesson}` : "" },
                { level: "Workflow", icon: "schema", what: `The way the work flows, as a map — ${workflowsTotal} of them.`, example: example ? example.workflow : "" },
                { level: "Step", icon: "radio_button_checked", what: "One action, by one owner, with its checks.", example: example && example.steps[0] ? example.steps[0].title : "" },
              ],
            },
          },
          {
            icon: "lock_open", title: "What opens what",
            points: [
              ["Days", "A day opens when you finish the day before it. Finish a day by completing its lessons and ticking its gate."],
              ["Stages", "A stage opens on its first day — with its chapters, its lessons and its agent kit."],
              ["Gates", "Each stage ends at a gate (Discovery Decision, Commitment, Definition of Done…). You check its criteria before moving on — just as a real team would."],
            ],
          },
          {
            icon: "map", title: "Two ways to see it",
            points: [
              ["Now & next", "My program shows the stage you're in, what's up next, and what comes later."],
              ["The full map", "Every day on one road, through the three tracks — with your progress drawn in."],
            ],
          },
        ],
      },
    },
    {
      id: "lesson", title: "Inside a lesson",
      summary: "The seven steps every lesson walks you through — and how to read a workflow map.",
      exercise: example ? `Look at the workflow map below for “${example.workflow}”. In your own words: what happens if the answer at the decision is “no”?` : "Open a lesson on Day 1 and read its workflow map.",
      criteria: ["I know the seven steps of a lesson", "I can read a workflow map — steps, decisions, loops and the gate"],
      guide: {
        intro: "Every lesson from Day 1 on has the same shape, so after the first one you always know where you are.",
        sections: [
          {
            icon: "view_timeline", title: "Seven steps",
            visual: {
              kind: "steps", steps: [
                { icon: "co_present", name: "Learn", what: "A guided walk through the lesson, one idea at a time." },
                { icon: "flag", name: "Overview", what: "What it's for, the outcome, who's involved." },
                { icon: "account_tree", name: "Workflow", what: "The map of how the work flows." },
                { icon: "assignment", name: "Contract", what: "Inputs, outputs, owners, rules and the checks." },
                { icon: "description", name: "Artifacts", what: "The documents it makes — with ready templates." },
                { icon: "lightbulb", name: "Knowledge", what: "The frameworks, techniques and lenses it uses." },
                { icon: "edit_note", name: "Do it", what: "Your tasks, on your project — then hand them in." },
              ],
            },
          },
          example ? {
            icon: "schema", title: "Reading a workflow map",
            body: `This is a real one — “${example.workflow}”, from Day 1. Steps run left to right to the gate. A diamond is a decision. The loops are what happens when things don't go to plan.`,
            visual: { kind: "workflow", example },
          } : null,
          {
            icon: "visibility", title: "Lenses",
            body: "Every lesson is also seen through lenses — privacy, security, cost, accessibility and more. They're the questions an expert in that area would ask, so nothing important gets missed.",
          },
        ].filter(Boolean),
      },
    },
    {
      id: "tasks", title: "Tasks, submissions and reviews",
      summary: "What you make in each lesson, and how it gets checked.",
      exercise: "Read the cycle below. Then write one line on why you score your own work before you hand it in.",
      criteria: ["I know how a task goes from draft to approved", "I know where my submissions live"],
      guide: {
        intro: "Every lesson asks you to make something real for your project — a document, a canvas, a register. You play the role; a reviewer plays the people you hand it to.",
        sections: [
          {
            icon: "sync", title: "From draft to approved",
            visual: {
              kind: "cycle", steps: [
                { icon: "edit_document", name: "Draft", what: "Fill the template in the lesson — your agent helps." },
                { icon: "checklist", name: "Self-check", what: "Tick the subtasks, score yourself on the rubric." },
                { icon: "send", name: "Hand in", what: "Send it to the role who receives it." },
                { icon: "rate_review", name: "Review", what: "A mentor grades it on the same rubric." },
                { icon: "verified", name: "Approved", what: `${80}% or more on the rubric, with no zeros.` },
              ],
              back: { icon: "replay", name: "Sent back", what: "With comments. Fix it and hand it in again." },
            },
          },
          {
            icon: "inventory_2", title: "Where your work lives",
            points: [
              ["Living documents", "Logs, registers and canvases grow lesson by lesson — you keep adding to the same document all month."],
              ["Submissions", "My program → Submissions shows every document and where it stands: draft, in review, approved or to fix."],
              ["Your progress", "Your profile shows grades, first-time passes, and how close your self-scores are to the reviewer's."],
            ],
          },
          {
            icon: "tips_and_updates", title: "Good to know",
            points: [
              ["Score honestly", "Self-scores close to the reviewer's earn the “Honest scorer” badge — and teach you what good looks like."],
              ["Sent back isn't failing", "Fixing work and getting it approved is part of the job — it even has its own badge."],
            ],
          },
        ],
      },
    },
    {
      id: "kit", title: "Your agent kit",
      summary: "The files that turn your AI agent into a team — and how they unlock.",
      exercise: "Get access to an AI agent (for example a Claude Pro or Max plan with Claude Code, or the API) and have one short conversation with it. Then make a project folder with a docs/ folder, and copy the kick-off kit's root files into it from the Agent kit page.",
      criteria: ["My AI agent is set up and I've tested it", "My project folder is ready, with the kit in it"],
      guide: {
        intro: "Copy, Paste, Go is named after the kit: for every stage you get ready-made files your agent can use straight away — or configure your way.",
        sections: [
          {
            icon: "inventory_2", title: `What's in a stage's kit — Discover has ${discover.files} files`,
            visual: {
              kind: "kit", layers: [
                { icon: "description", name: "AGENTS.md", what: "What your agent always knows about your project.", n: layerCount("context") },
                { icon: "terminal", name: "Commands", what: "Saved prompts — one for every step and lesson.", n: layerCount("commands") },
                { icon: "school", name: "Skills", what: "How-to packages for each technique.", n: layerCount("skills") },
                { icon: "account_tree", name: "Workflows", what: "Run specs with checkpoints where you decide.", n: layerCount("workflows") },
                { icon: "groups_3", name: "Subagents", what: "Reviewers and helpers with one job each.", n: layerCount("agents") },
                { icon: "grading", name: "Rubrics", what: "How each document is scored.", n: layerCount("rubrics") },
                { icon: "article", name: "Templates", what: "The blank documents to fill.", n: layerCount("templates") },
                { icon: "shield", name: "Guardrails", what: "Rules and checks your agent follows.", n: layerCount("guardrails") },
              ],
            },
          },
          {
            icon: "lock_clock", title: "How it unlocks",
            body: "Each stage's kit opens on its first day — so you're never buried in files you don't need yet. Inside a lesson, the Agent tab shows just the files that task uses — open them in the kit and copy what you need. The kit stays on Copy, Paste, Go and is for members only.",
            visual: { kind: "unlocks", stages: stages.filter((s) => s.files) },
          },
          {
            icon: "handshake", title: "Working with your agent",
            points: [
              ["You decide", "Your agent drafts, researches, checks and challenges. You make the calls and own the result."],
              ["Check everything", "Score its drafts against the rubric. Correct what it gets wrong — that's the habit for the whole month."],
              ["Any agent", "The kit works with any agent — Claude Code, Codex, Cursor, a chat assistant. Some features (skills, subagents, hooks) need agents that support them."],
              ["Yours alone", "The kit is licensed to you. Please don't share it."],
            ],
          },
        ],
      },
    },
    {
      id: "community", title: "Achievements and community",
      summary: "XP, levels, badges and the leaderboard — and the people learning with you.",
      exercise: "Say hello on the Feed: who you are, and what you hope to build this month.",
      criteria: ["I know how XP and badges are earned", "I've said hello on the Feed"],
      guide: {
        intro: "Real progress is the shipped project — but it helps to see it add up, and to have people around you.",
        sections: [
          {
            icon: "military_tech", title: "XP and levels",
            body: "Everything you do earns XP. XP raises your level, and levels unlock titles and avatar frames.",
            visual: {
              kind: "xp", rows: [
                ["Finish a lesson", 50], ["Finish a day", 100], ["Clear a stage", 300], ["Hand in a task", 10], ["Get it approved", 20],
                ["Approved first time", 15], ["Perfect score", 25], ["Fix and get approved", 10], ["Answer a question on the board", 15],
              ],
            },
          },
          {
            icon: "emoji_events", title: "Badges and the leaderboard",
            points: [
              ["Badges", "Kicked off, First approval, Right first time, On a roll, Comeback, Helper… many have bronze, silver and gold tiers."],
              ["Streak", "Work on consecutive days to grow your streak — one missed day a week is forgiven."],
              ["Leaderboard", "A weekly season resets every Monday. Top the week to be crowned Champion; the top three wear a shining title. You can hide yourself if you prefer."],
            ],
          },
          {
            icon: "diversity_3", title: "You're not alone",
            points: [
              ["Feed", "What the cohort is up to — wins, questions, shares."],
              ["Board", "Ask about any day or lesson; others answer, mentors step in."],
              ["Live sessions", "Mentor sessions through the month — vote for the time that suits you."],
            ],
          },
        ],
      },
    },
    {
      id: "project", title: "Pick your project",
      summary: "The one project you'll carry through every stage.",
      exercise: "Pick a practice project from the list — or bring your own idea or a brief from work. Then write one paragraph: the project, who it's for, and the problem it solves.",
      criteria: ["I've picked my project", "I've written its one-paragraph description"],
      guide: {
        intro: "Everything you make this month is for one project. Choose one you'll stay curious about for 30 days.",
        sections: [
          {
            icon: "lightbulb", title: "Choosing well",
            points: [
              ["A real problem", "Someone, somewhere, wastes time or money on it today."],
              ["People you can picture", "You can name who's affected and who'd pay or sponsor the fix."],
              ["Small enough to ship", "One problem, done well — not a whole platform."],
              ["Not sure?", "Pick a practice project below. Each comes with a client brief, people and numbers, ready to go."],
            ],
          },
        ],
      },
    },
  ];

  return {
    day: 0, kind: "kickoff",
    act: { id: "kickoff", n: "0", name: "Kick-off", track: "discovery", gate: "Ready to start", tagline: "How the month works" },
    title: "How Copy, Paste, Go works — and pick your project",
    goal: "Your orientation: what the 30 days hold, how stages, days, chapters and lessons fit together, what's inside a lesson, how tasks are reviewed, how the agent kit unlocks and how achievements work. Then you pick your project and set up.",
    story: "",
    processes: [{
      id: "kickoff", code: "0", title: "Kick-off", summary: "Understand the month, pick your project, set up your agent and kit.", gate: "Ready to start", contract: null, loops: [],
      /* their own ids — the old set-up lessons (k1–k4) were different lessons, and work handed in for them stays theirs */
      lessons: lessons.map((l, i) => ({
        fid: `kickoff.kickoff.${l.id}`, code: `0.${i + 1}`, title: l.title, summary: l.summary, gate: "", contract: null,
        refs: { artifacts: {}, knowledge: {}, lenses: {} }, workflows: [], objectives: [l.summary], exercise: l.exercise, quiz: [], prompt: "",
        criteria: l.criteria, guide: l.guide,
      })),
    }],
    gate: {
      title: "Ready to start",
      criteria: [
        "I understand how the month works — stages, days, chapters, lessons and gates",
        "I know how tasks are handed in and reviewed",
        "My AI agent is set up and I've tested it",
        "I've picked my project and written its one-paragraph description",
        "My project folder is ready, with the kick-off kit in it",
      ],
    },
  };
};
