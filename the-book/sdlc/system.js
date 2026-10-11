/*
 * NODE DELIVERY SYSTEM — how the acts actually run together.
 *
 * The eight acts are kinds of work, not calendar phases. Their order is a logical
 * dependency (what must be true before what), not a schedule. In practice two tracks
 * run at the same time — discovery decides what is worth building, delivery builds and
 * ships it — joined by backlogs at three levels and kept in step by cadences. Run & learn
 * feeds signals back into both.
 *
 * Shape:
 *   tracks[]    : { id, name, icon, c, acts[], q, what, owner[], cadence, produces, measures[], pitfalls[] }
 *   backlogs[]  : { id, name, level, icon, holds, item, prefix, owner[], horizon, cadence(id), entry[], exit[], refine, wip, art }
 *   side[]      : { id, name, track, icon, holds, owner[], feeds, art }
 *   gates[]     : { id, name, between, owner[], criteria[], fail, art }
 *   cadences[]  : { id, name, every, at, who[], in[], out[] }
 *   flows[]     : { f, t, ty: forward | alternate | rework | feedback, n (short label), what, art? }
 *   timeline    : { cols[], rows[{ track, cells[] }], links[[fromTrack, toTrack, label]], note }
 *   modes[]     : { id, act, name, icon, when, runs, feeds, unit? }
 */
window.NODE_MODEL.system = {
  summary: "Software isn't delivered in one pass through eight acts. Two tracks run at the same time: discovery decides what is worth building, delivery builds and ships it. Backlogs at three levels join them, cadences keep them in step, and run & learn feeds signals back into both.",
  orderNote: "The acts keep their order as a logical dependency — a problem is validated before it is planned, designed before it is built — but they are kinds of work that run continuously and in parallel, at different sizes, not phases on a calendar.",

  tracks: [
    { id: "discovery", name: "Discovery track", icon: "explore", c: "#6d48d8", acts: ["discover", "plan", "design"],
      q: "Are we building the right thing?",
      what: "The product trio keeps learning what is worth building: it talks to users every week, tests the riskiest assumptions, and shapes work until it is ready for delivery.",
      owner: ["Product trio"], cadence: "Continuous; weekly customer touchpoints; works one to two sprints ahead of delivery",
      produces: "Initiatives for the portfolio; validated features; ready stories that meet the Definition of Ready",
      measures: ["Share of ready items validated with users", "Assumption tests run per week", "Items stopped before build (effort saved)"],
      pitfalls: ["Discovery as a one-off phase before 'the build'", "Handing specs over a wall instead of refining with the team", "Validating only what is already decided"] },
    { id: "delivery", name: "Delivery track", icon: "construction", c: "#008080", acts: ["build", "verify", "release"],
      q: "Are we building the thing right?",
      what: "The delivery team turns ready stories into working, tested, releasable increments every sprint, through a continuous integration and delivery pipeline.",
      owner: ["Delivery team", "Scrum master / delivery lead"], cadence: "Sprints of 1–2 weeks (or continuous flow); release on demand",
      produces: "Done increments that meet the Definition of Done, released to users",
      measures: ["Lead time for changes", "Deployment frequency", "Change failure rate", "Sprint goals met"],
      pitfalls: ["Starting stories that are not ready", "'Done' that excludes testing or release", "Verify and release as a phase at the end"] },
    { id: "run", name: "Run & learn", icon: "monitoring", c: "#c49000", acts: ["operate", "evolve"],
      q: "Is it working, and what did we learn?",
      what: "Running software produces signals — incidents, usage, outcome data, feedback. They feed both tracks: problems go to the product backlog, new opportunities go to discovery.",
      owner: ["Operations & support", "Product manager"], cadence: "Continuous monitoring; monthly operations review; quarterly outcome review",
      produces: "Problem and improvement items, outcome evidence, new opportunities",
      measures: ["Time to restore service", "Outcome achieved vs hypothesis", "Share of the roadmap driven by evidence"],
      pitfalls: ["Learning that never reaches a backlog", "Measuring output (features shipped) instead of outcomes"] },
  ],

  backlogs: [
    { id: "portfolio", name: "Portfolio backlog", level: "Level 1", icon: "folder_special", holds: "Initiatives and large opportunities", item: "Initiative", prefix: "INI-###",
      owner: ["Portfolio board"], horizon: "2–4 quarters", cadence: "quarterly",
      entry: ["Opportunity brief with a Go decision (DISCOVER, initiative mode)", "Sponsor and value hypothesis named", "Size and cost of delay estimated"],
      exit: ["Funded and assigned to a product team", "Broken into epics in the product backlog"],
      refine: "Quarterly planning ranks initiatives by value, cost of delay and size (WSJF), and limits how many are active at once.",
      wip: "Limit active initiatives to what teams can carry", art: "portfolio-backlog" },
    { id: "product", name: "Product backlog", level: "Level 2", icon: "view_list", holds: "Epics and features", item: "Epic → Feature", prefix: "EPC-### / FEA-###",
      owner: ["Product owner"], horizon: "1–2 quarters (now / next / later)", cadence: "roadmap",
      entry: ["Traces to an initiative, a problem item or an improvement item", "Names the outcome it serves", "Validated in discovery or marked as an assumption to test"],
      exit: ["Split into stories that meet the Definition of Ready"],
      refine: "Weekly refinement with the trio and the delivery team: split, estimate, and order by value, risk and dependencies.",
      wip: "Detail only the next one to two quarters; later items stay coarse", art: "product-backlog" },
    { id: "iteration", name: "Iteration backlog", level: "Level 3", icon: "checklist", holds: "Stories and tasks for the current sprint", item: "Story → Task", prefix: "STY-###",
      owner: ["Delivery team"], horizon: "One sprint", cadence: "planning",
      entry: ["Story meets the Definition of Ready"], exit: ["Story meets the Definition of Done"],
      refine: "Sprint planning pulls ready stories to meet a sprint goal; the team splits them into tasks and tracks them daily.",
      wip: "Pull only what fits the sprint goal and capacity", art: "sprint-backlog" },
  ],

  side: [
    { id: "opportunity", name: "Opportunity backlog", track: "discovery", icon: "lightbulb", holds: "Opportunities, solution ideas and assumptions to test", owner: ["Product trio"],
      feeds: "Small, validated items → product backlog (feature mode). Large ones → initiative mode → portfolio backlog.", art: "opportunity-solution-tree" },
    { id: "improvement", name: "Improvement backlog", track: "run", icon: "trending_up", holds: "Outcome gaps, retrospective actions and improvement ideas", owner: ["Product manager"],
      feeds: "New opportunities to discovery; strategic shifts to the portfolio", art: "learning-log" },
    { id: "problem", name: "Problem backlog", track: "run", icon: "report", holds: "Root causes of incidents and recurring operational problems", owner: ["Operations & support"],
      feeds: "Fixes ranked alongside features in the product backlog", art: "problem-record" },
  ],

  gates: [
    { id: "dor", name: "Definition of Ready", between: "Discovery → delivery", owner: ["Product owner", "Delivery team"],
      criteria: ["Traces to a feature and the outcome it serves", "Problem validated with users — evidence linked", "Acceptance criteria are testable", "Small enough for one sprint (INVEST)", "Dependencies and risks known", "Design and data ready enough to start"],
      fail: "Not ready → back to refinement, or back to discovery if the evidence is missing", art: "definition-of-ready" },
    { id: "dod", name: "Definition of Done", between: "Delivery → release", owner: ["Delivery team"],
      criteria: ["Code reviewed and merged", "Automated tests pass in the pipeline", "Acceptance criteria met", "Security and accessibility checks pass", "Documentation and runbook updated", "Deployable to production"],
      fail: "Not done → stays in the sprint; never 'done except testing'", art: "definition-of-done" },
  ],

  cadences: [
    { id: "quarterly", name: "Quarterly planning", every: "Quarter", at: "portfolio", who: ["Portfolio board", "Product leadership"], in: ["Portfolio backlog", "Outcome review"], out: ["Ranked, funded initiatives", "Capacity per team"] },
    { id: "roadmap", name: "Roadmap review", every: "Month", at: "product", who: ["Product manager", "Sponsor"], in: ["Product backlog", "Outcome data"], out: ["Now / next / later roadmap"] },
    { id: "touchpoint", name: "Discovery touchpoint", every: "Week", at: "discovery", who: ["Product trio"], in: ["Opportunity backlog"], out: ["Interview snapshots", "Assumption test results"] },
    { id: "refinement", name: "Backlog refinement", every: "Week", at: "product", who: ["Product trio", "Delivery team"], in: ["Validated features"], out: ["Ready stories (Definition of Ready)"] },
    { id: "planning", name: "Sprint planning", every: "Sprint (1–2 weeks)", at: "iteration", who: ["Delivery team", "Product owner"], in: ["Ready stories"], out: ["Sprint goal", "Iteration backlog"] },
    { id: "daily", name: "Daily stand-up", every: "Day", at: "delivery", who: ["Delivery team"], in: ["Iteration backlog"], out: ["Blockers raised", "Plan for the day"] },
    { id: "review", name: "Sprint review", every: "Sprint", at: "delivery", who: ["Delivery team", "Stakeholders"], in: ["Done increment"], out: ["Feedback", "Backlog changes"] },
    { id: "retro", name: "Retrospective", every: "Sprint", at: "delivery", who: ["Delivery team"], in: ["Sprint data"], out: ["Improvement actions"] },
    { id: "opsreview", name: "Operations review", every: "Month", at: "run", who: ["Operations & support", "Product manager"], in: ["Incidents", "SLOs"], out: ["Problem backlog items"] },
  ],

  flows: [
    { f: "opportunity", t: "discover", ty: "forward", n: "Pick one", what: "The trio picks the next target opportunity. Big or uncertain ones run DISCOVER in initiative mode; small ones stay in feature mode.", art: "opportunity-solution-tree" },
    { f: "discover", t: "portfolio", ty: "forward", n: "Go → INI-###", what: "Initiative mode ends in a Go decision; the initiative enters the portfolio backlog with its opportunity brief.", art: "portfolio-backlog" },
    { f: "discover", t: "product", ty: "alternate", n: "Feature mode → validated", what: "Feature mode validates small items inside a funded product; they go straight to the product backlog for refinement.", art: "backlog-item" },
    { f: "portfolio", t: "plan", ty: "forward", n: "Funded initiative", what: "Quarterly planning funds the initiative and assigns a team; PLAN scopes, sequences and slices it." },
    { f: "plan", t: "product", ty: "forward", n: "Epics & features", what: "PLAN breaks the initiative into epics and features, each tied to an outcome, and orders them on the roadmap.", art: "product-backlog" },
    { f: "product", t: "design", ty: "forward", n: "Next features", what: "The next features are shaped — experience, architecture, data — just in time, not all up front." },
    { f: "design", t: "dor", ty: "forward", n: "Shaped stories", what: "Shaped work is split into stories with acceptance criteria and checked against the Definition of Ready.", art: "backlog-item" },
    { f: "dor", t: "product", ty: "rework", n: "Not ready", what: "A story that fails the Definition of Ready goes back to refinement — or back to discovery if the evidence is missing.", art: "definition-of-ready" },
    { f: "dor", t: "iteration", ty: "forward", n: "Ready → pulled", what: "Ready stories are pulled at sprint planning to meet a sprint goal.", art: "sprint-backlog" },
    { f: "iteration", t: "build", ty: "forward", n: "Sprint goal", what: "The team builds the sprint's stories, integrating continuously." },
    { f: "build", t: "verify", ty: "forward", n: "Integrated", what: "Every change is verified in the pipeline as it is built — testing is part of the sprint, not a later phase." },
    { f: "verify", t: "dod", ty: "forward", n: "Checked", what: "The increment is checked against the Definition of Done.", art: "definition-of-done" },
    { f: "dod", t: "build", ty: "rework", n: "Not done", what: "Work that fails the Definition of Done stays in the sprint until it is done — never 'done except testing'." },
    { f: "dod", t: "release", ty: "forward", n: "Done increment", what: "A done increment is releasable; release happens on demand, often several times a sprint." },
    { f: "release", t: "operate", ty: "forward", n: "Live", what: "Released software runs in production with monitoring, SLOs and support." },
    { f: "operate", t: "problem", ty: "feedback", n: "Incidents", what: "Incident root causes and recurring problems land in the problem backlog.", art: "problem-record" },
    { f: "problem", t: "product", ty: "feedback", n: "Fixes ranked", what: "Problem fixes are ranked alongside features in the product backlog — one backlog, one order." },
    { f: "operate", t: "evolve", ty: "forward", n: "Usage & outcomes", what: "Usage and outcome data show whether the change achieved its hypothesis." },
    { f: "evolve", t: "improvement", ty: "feedback", n: "Gaps & actions", what: "Outcome gaps, retrospective actions and improvement ideas land in the improvement backlog.", art: "learning-log" },
    { f: "improvement", t: "opportunity", ty: "feedback", n: "New opportunities", what: "Improvements become opportunities for discovery — the cycle starts again." },
    { f: "improvement", t: "portfolio", ty: "feedback", n: "Re-rank", what: "Evidence that changes strategy goes to the portfolio board at quarterly planning." },
  ],

  timeline: {
    cols: ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4"],
    rows: [
      { track: "discovery", cells: ["Interview clerks; test 'PDF lines can be read' → ready stories for sprint 2", "Test 'clerks trust auto-filled orders' → ready stories for sprint 3", "Shape exception handling; read sprint-2 usage → ready stories for sprint 4", "Opportunity from signals: supplier e-invoices → initiative mode?"] },
      { track: "delivery", cells: ["Build stories made ready last sprint", "Build PDF parsing stories (ready in sprint 1)", "Build auto-fill review screen (ready in sprint 2)", "Build exception queue (ready in sprint 3)"] },
      { track: "run", cells: ["Operate the current release", "Release parsing behind a flag; monitor accuracy", "Accuracy 91% — problem item for low-quality scans", "Handling time 14 → 9 min — outcome review"] },
    ],
    links: [["discovery", "delivery", "ready stories"], ["delivery", "run", "release"], ["run", "discovery", "signals"]],
    note: "Discovery works one to two sprints ahead of delivery. What delivery builds in sprint n was validated in sprint n−1; what run & learn observes in sprint n+1 shapes discovery in sprint n+2.",
  },

  /* Scales — the same lifecycle at different sizes. Chosen per initiative; changes who does what,
     which backlog levels and gates apply, and how prompts are pitched. */
  scales: [
    { id: "solo", perms: "Read and write everything in the project folder; you review before anything is shared.", name: "Solo / small", icon: "person", who: "One person or a small team of 2–5, each wearing several roles.",
      examples: "Freelancer, indie product, early startup, internal tool for one team",
      backlogs: "One backlog (product), with a simple Definition of Ready and Done", gates: "Light — a written decision is enough; no boards",
      cadence: "Weekly plan and review; release whenever ready", agents: "Agents draft most artifacts and much of the code; you review everything before it counts.",
      risks: ["Skipping discovery because 'I already know'", "Accepting agent output unreviewed because there's no one else to check it"],
      prompt: "Scale: solo / small. I play all the roles. Keep every output short (one page or one screen), merge steps where it makes sense, and skip formal sign-offs — but keep the decision record and the learning log." },
    { id: "team", perms: "Read and write the shared workspace and backlog; agents propose changes, people merge and publish.", name: "Product team", icon: "groups", who: "A cross-functional product team: product trio plus a delivery team of 5–10.",
      examples: "Start-up or scale-up product, a product team inside a larger company",
      backlogs: "Product and iteration backlogs; portfolio handled by leadership", gates: "Definition of Ready and Done; sponsor decisions at act gates",
      cadence: "Sprints of 1–2 weeks, weekly discovery and refinement", agents: "Each person uses agents for their own role's work; outputs are shared in the team's backlog and repository.",
      risks: ["Each person's agent producing inconsistent artifacts — use the shared templates", "Discovery and delivery drifting apart"],
      prompt: "Scale: product team. Write for a product trio and a delivery team. Use our shared templates, make outputs ready to drop into the backlog or repository, and flag anything that needs the team's refinement." },
    { id: "enterprise", perms: "Approved tools only; read-only on customer and production data; every write goes through review; agent actions logged for audit.", name: "Enterprise", icon: "corporate_fare", who: "Many teams, formal governance, regulation, shared services and a portfolio board.",
      examples: "Bank, insurer, government, large retailer, healthcare",
      backlogs: "All three levels: portfolio, product, iteration", gates: "Formal gates with named approvers; compliance, security and privacy sign-off",
      cadence: "Quarterly portfolio planning, monthly roadmap, sprints", agents: "Only approved agents and tools; agent use recorded; confidential data stays inside approved environments; humans sign every decision.",
      risks: ["Pasting confidential or personal data into unapproved tools", "Agent output in audited artifacts without a human reviewer named"],
      prompt: "Scale: enterprise. Use formal language and our approved templates. Back every claim with a reference to its evidence for audit, flag compliance, security and privacy implications, name the approver for each decision, and keep confidential details out of anything meant for wider sharing." },
    { id: "platform", perms: "Read and write the platform repository and API docs in branches; consuming teams' systems are read-only.", name: "Platform", icon: "hub", who: "A team building shared capabilities — APIs, internal platforms, developer tools — for other teams.",
      examples: "Internal developer platform, payments API, data platform, design system",
      backlogs: "Product backlog driven by internal customers' needs; roadmap shared with consuming teams", gates: "Contract and compatibility reviews; adoption targets",
      cadence: "Sprints plus versioned releases and deprecation windows", agents: "Agents help draft API contracts, docs and migration guides; consuming teams validate them.",
      risks: ["Building what the platform team finds interesting, not what consumers need", "Breaking changes without versioning"],
      prompt: "Scale: platform. Treat other internal teams as the customers. Capture their needs as service or API contracts, and consider versioning, backward compatibility, self-service, documentation and adoption." },
  ],

  /* How people work with agents in Node: the person in the role uses the agent as a tool. */
  agentWork: {
    principle: "People own the work, agents help do it. In every unit the person in the role briefs the agent, gives it the right context, checks what it produces, and makes every decision. The agent drafts, researches, analyses, structures and checks — it never decides, approves or signs.",
    split: [["You", "Choose what to work on · give context · make decisions · review and correct · sign off · own the artifact"], ["Your agent", "Draft · research · summarise · structure into templates · spot gaps and risks · check against criteria · prepare options"]],
    levels: [
      ["Act", "Run the whole act end to end with one agent conversation — it works process by process and stops at every gate for your decision."],
      ["Process", "Run one process end to end — its subprocesses in order, stopping at its gate."],
      ["Subprocess", "Run one subprocess — its workflows and their outputs."],
      ["Workflow", "Run one workflow step by step, with its branches and checks."],
      ["Step", "Do one step — the smallest, most precise prompt."],
    ],
    kinds: [
      ["Chat assistant", "Drafting, structuring, summarising, reviewing — most steps"],
      ["Assistant with web search", "Market, competitor and technology research — cite sources"],
      ["Assistant with file access", "Reading attached documents, notes and spreadsheets in bulk"],
      ["Coding agent", "Working in a code repository — spikes, prototypes, builds, tests (BUILD onwards)"],
    ],
    rules: ["Never paste passwords, keys, or personal data you aren't allowed to share — anonymise first", "At enterprise scale, use only approved tools", "Check every fact, number and source the agent gives you", "Agents prepare decisions; people make them", "Save the output in the artifact template and note that an agent helped", "If the agent's output is wrong, correct the prompt or the context — then record what you learned"],
    howTo: ["Pick the level: the whole act, a process, a subprocess, a workflow or one step", "Choose your scale", "Fill the {{placeholders}} and attach what the prompt asks for", "Paste into your agent and work through it together", "Check the result with the 'Your check' list, then save it as the artifact"],

    /* The agent kit — every layer of an agent setup, generated from the contracts. Tool-agnostic formats;
       `tools` notes say how the common tools pick each layer up (check your tool's docs — they change often). */
    layers: [
      { id: "prompt", name: "Prompt", icon: "chat", file: "(paste)", what: "A one-off structured instruction you paste into a conversation.", when: "Trying something once, or working in a plain chat assistant.",
        tools: "Any agent or chat assistant." },
      { id: "context", name: "Context file", icon: "description", file: "AGENTS.md", what: "What the agent always knows about the initiative: how we work, the lifecycle, conventions, trace IDs, templates, ground rules and scale.", when: "Always — set it up once per initiative so every prompt starts with the same ground truth.",
        tools: "Many coding agents read AGENTS.md at the repository root. Tools with their own file (e.g. CLAUDE.md) can import or copy it. In chat assistants, paste it into the project's instructions." },
      { id: "skills", name: "Skills", icon: "school", file: "skills/<name>/SKILL.md", what: "Reusable how-to packages — one per technique or method — with steps, structure, output templates and checks. The agent loads one when the task needs it.", when: "A technique is used in several places; you want it done the same way every time.",
        tools: "Agents that support skills load SKILL.md folders from their skills directory. Otherwise attach the SKILL.md as a file, or paste it before the prompt." },
      { id: "commands", name: "Commands", icon: "terminal", file: "commands/<name>.md", what: "Saved prompts you run by name, with arguments — one per step, workflow, subprocess, process and the act.", when: "You run the same unit often, or a team should run it identically.",
        tools: "Agents with custom commands or saved prompts read Markdown files from their commands / prompts folder; $ARGUMENTS takes what you type after the name. Otherwise paste the file." },
      { id: "workflows", name: "Workflows", icon: "account_tree", file: "workflows/<name>.md", what: "A run specification: steps in order, inputs and outputs as files, who owns each step, human checkpoints, decision branches, recovery and the gate.", when: "Running a whole workflow or process with an agent across many steps and sessions.",
        tools: "Point the agent at the workflow file (\"run workflows/x.md, stop at every checkpoint\"). Orchestration tools can execute the YAML block; people can read it as a checklist." },
      { id: "agents", name: "Subagents", icon: "groups_3", file: "agents/<name>.md", what: "Specialised helpers with one job — lens reviewers (privacy, security, finance…), a researcher, a synthesiser, a challenger, a decision-brief writer.", when: "A step needs an independent perspective or a focused job done without cluttering the main conversation.",
        tools: "Agents that support subagents load them from their agents folder. Otherwise open a separate conversation and paste the file as its first message." },
      { id: "tools", name: "Tools & connectors", icon: "cable", file: "TOOLS.md", what: "Which tools and data each step needs — web search, documents, spreadsheets, the backlog tool, the research repository, the code repository — and what each scale allows the agent to do with them.", when: "Before connecting an agent to real systems or data.",
        tools: "Connect tools through your agent's connectors or MCP servers; grant the least access the step needs." },
      { id: "guardrails", name: "Guardrails & hooks", icon: "shield", file: "GUARDRAILS.md", what: "Rules the agent must follow and automatic checks at key moments — before saving an artifact, before a decision, before sending anything outside the team.", when: "Always; enterprise scale makes them mandatory and audited.",
        tools: "Agents with hooks can run these checks automatically; everywhere else they're a checklist the agent applies and you confirm." },
      { id: "rubrics", name: "Rubrics", icon: "grading", file: "rubrics/<artifact>.md", what: "A scored checklist for each artifact, from its template, quality criteria and the unit's criteria.", when: "Checking agent output — ask the agent to self-score first, then score it yourself.",
        tools: "Any agent: \"score docs/x.md against rubrics/x.md\"." },
      { id: "memory", name: "Memory & handoff", icon: "folder_open", file: "PROGRESS.md · TRACE.md · docs/", what: "What carries across sessions and people: the project folder, a progress log, and a trace-ID register.", when: "Work spans more than one session, person or agent.",
        tools: "Keep them in the repository or shared drive the agent can read; start each session with \"read PROGRESS.md\"." },
    ],
    tools: [
      { id: "web", name: "Web search", for: "Market, competitor, technology and vendor research — always with sources" },
      { id: "files", name: "File access", for: "Reading attached notes, transcripts and documents in bulk" },
      { id: "docs", name: "Docs workspace", for: "Reading and writing briefs, notes and records (e.g. a shared drive or wiki)" },
      { id: "sheets", name: "Spreadsheets", for: "Logs, registers, models and scoring sheets" },
      { id: "backlog", name: "Backlog tool", for: "Idea, portfolio and product backlogs (e.g. Jira, Linear, Azure DevOps)" },
      { id: "research", name: "Research repository", for: "Storing and tagging session notes and insights" },
      { id: "analytics", name: "Analytics", for: "Baselines and experiment results" },
      { id: "design", name: "Design & prototyping", for: "Prototypes, test pages and wireframes" },
      { id: "comms", name: "Email & calendar", for: "Scheduling and messages — drafts only; a person sends" },
      { id: "repo", name: "Code repository", for: "Spikes and prototypes in throwaway branches" },
    ],
    hooks: [
      ["Before saving an artifact", "It follows its template · it carries its trace ID and links upstream IDs · every claim cites evidence or is marked 'Assumption:' · no personal data or secrets", "Fix, or stop and tell me"],
      ["Before a decision step", "Stop. Prepare the decision brief. Wait for the named decision-maker", "Never decide or approve"],
      ["Before anything leaves the team", "Messages, posts, invitations and shared documents are drafts until a person sends them", "Ask for approval"],
      ["Before using a new tool or data source", "Is it allowed at this scale? Is the data allowed in this tool?", "Ask first"],
      ["After each step", "Append to PROGRESS.md: date, unit, what was done, artifacts, decisions, open questions, next", "Always"],
    ],
  },

  modes: [
    { id: "initiative", act: "discover", name: "Initiative mode", icon: "flag", when: "A new system, a new integration or a large, hard-to-reverse technical decision.", runs: "The full act — five processes, 1–3 weeks — once per initiative.", feeds: "ADR and handoff pack, then PLAN" },
    { id: "feature", act: "discover", name: "Feature mode", icon: "all_inclusive", when: "Inside a product in delivery: the next risky technical unknown.", runs: "A light weekly spike loop that runs alongside delivery and reuses the act's techniques at small scale.", feeds: "Enabler stories (STY) in the product backlog, through the Definition of Ready", unit: "discover.continuous" },
  ],
};
