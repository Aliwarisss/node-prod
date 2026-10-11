/*
 * NODE MODEL — the framework every roadmap unit is authored against.
 * This file defines the *shape* of the training program (contract, lenses,
 * knowledge types, routing types, reasoning chain). It holds no roadmap content.
 * Roadmap units live in roadmap.js.
 */
window.NODE_MODEL = {
  /* Hierarchy levels: Stage → Process → Subprocess → Workflow */
  levels: [
    { id: "stage", name: "Stage", desc: "An act of the lifecycle", color: "var(--teal)",
      body: "Master-outline level. Shows purpose, major processes, outcomes and routing points — nothing more.",
      contract: "node" },
    { id: "process", name: "Process", desc: "A major capability within a stage", color: "var(--pink)",
      body: "Where learning starts. The full NODE contract is revealed progressively when a learner enters.",
      contract: "node" },
    { id: "subprocess", name: "Subprocess", desc: "A coherent unit of work", color: "var(--orange)",
      body: "Small enough to own, staff and gate. Same contract, finer grain.",
      contract: "node" },
    { id: "workflow", name: "Workflow", desc: "Executable steps & decisions", color: "#7c83ff",
      body: "Reasoning becomes action: actors, steps, decisions, branches, failures, recovery, handoff, learning.",
      contract: "workflow" },
  ],
  example: [["Stage", "DISCOVER"], ["Process", "Problem Validation"], ["Subprocess", "Evidence Gathering"], ["Workflow", "Run a problem-interview round"]],

  /* NODE contract — used by Stage, Process and Subprocess.
     Field `k` is the key used inside a unit's `contract` object in roadmap.js. */
  contract: [
    { id: "definition", name: "Definition", icon: "flag", q: "Why does it exist, what does it produce, when does it start and finish?",
      fields: [["purpose", "Purpose", "Why the unit exists."], ["outcome", "Outcome", "The change in the world when it completes."], ["jtbd", "JTBD", "The job its performers are trying to get done."], ["entry", "Entry", "What must be true before work begins."], ["exit", "Exit", "What must be true for it to be complete."]] },
    { id: "flow", name: "Flow", icon: "conversion_path", q: "How does work move, and what must happen before what?",
      fields: [["normal", "Normal", "Default sequence."], ["parallel", "Parallel", "Work that can safely run concurrently."], ["dependencies", "Dependencies", "Inputs, teams and systems it waits on."], ["stateTransitions", "State Transitions", "States and the triggers between them."]] },
    { id: "cases", name: "Cases", icon: "alt_route", q: "What situations can occur beyond the hoped-for one?",
      fields: [["happyPath", "Happy Path", "Everything goes as expected."], ["alternates", "Alternates", "Valid different routes to the outcome."], ["edgeCases", "Edge Cases", "Boundary conditions that must still work."], ["exceptions", "Exceptions", "Anticipated deviations with defined handling."], ["failures", "Failures", "Breakdowns that need recovery."]] },
    { id: "routing", name: "Routing", icon: "fork_right", q: "Where does work go next — including back, up, or nowhere?",
      fields: [["forward", "Forward", "Hand off when exit is met."], ["alternate", "Alternate", "Take a different valid path."], ["rework", "Return / Rework", "Send back to correct."], ["escalation", "Escalation", "Raise to higher authority."], ["stop", "Stop / Abort", "End deliberately, record learning."]] },
    { id: "controls", name: "Controls", icon: "rule", q: "What determines readiness, and what must never be violated?",
      fields: [["criteria", "Criteria", "What 'good enough' means."], ["checks", "Checks", "Verifications during the work."], ["gates", "Gates", "Decision points that allow or block."], ["rules", "Rules", "Hard constraints."], ["policies", "Policies", "Organisational guidance."]] },
    { id: "knowledge", name: "Knowledge", icon: "menu_book", q: "Which established knowledge applies, and of what kind?",
      fields: [["frameworks", "Frameworks", ""], ["standards", "Standards", ""], ["patterns", "Patterns", ""], ["practices", "Practices", ""], ["principles", "Principles", ""], ["methods", "Methods", ""], ["techniques", "Techniques", ""], ["tools", "Tools", ""]] },
    { id: "lenses", name: "Lenses", icon: "visibility", q: "Whose perspectives matter, and what do they demand?",
      fields: [["applicable", "Applicable", "Relevant in this context."], ["required", "Required", "Must be engaged."], ["concerns", "Concerns", "What each lens worries about."], ["constraints", "Constraints", "Limits each lens imposes."], ["evidence", "Evidence", "What each lens needs to see."], ["decisions", "Decisions", "What each lens has a say in."]] },
    { id: "execution", name: "Execution", icon: "groups", q: "Who performs the work, and who has authority?",
      fields: [["agents", "Agents", "Humans, AI agents, automations."], ["roles", "Roles", "Accountabilities (RACI)."], ["tools", "Tools", "Systems used."], ["authority", "Authority", "Who may approve, override, escalate, stop."]] },
    { id: "artifacts", name: "Artifacts", icon: "description", q: "What goes in, what comes out, what proves it?",
      fields: [["inputs", "Inputs", "Consumed from upstream."], ["outputs", "Outputs", "Produced for downstream."], ["evidence", "Evidence", "Proof that controls ran and decisions are justified."]] },
    /* Extension of the brief's nine sections: the workflow contract carries Handoff,
       Traceability and Learning; Continuity lifts them to every level, with timebox and measures. */
    { id: "continuity", name: "Continuity", icon: "sync_alt", q: "What is handed on, how is it traced, how long may it take, how is it measured, and what do we learn?",
      fields: [["handoff", "Handoff", "What is handed to whom when the unit completes."], ["traceability", "Traceability", "The trace IDs this unit creates or carries forward."], ["timebox", "Timebox", "Typical duration and effort."], ["measures", "Measures", "How the unit's performance is measured."], ["learning", "Learning", "What is captured to improve next time, and where."]] },
  ],

  /* Tailoring profiles — how much of each act to run, chosen by risk and size */
  profiles: [
    { id: "standard", name: "Standard", icon: "tune" },
    { id: "light", name: "Light", icon: "bolt" },
    { id: "rigorous", name: "Rigorous", icon: "shield" },
  ],

  /* Continuous tracks that run across every act */
  tracks: [
    { id: "gov", name: "Governance & risk", icon: "gavel", c: "#c49000" },
    { id: "sec", name: "Security & privacy", icon: "shield", c: "#e91e63" },
    { id: "qual", name: "Quality & evidence", icon: "verified", c: "#008080" },
    { id: "trace", name: "Traceability & learning", icon: "sync_alt", c: "#6d48d8" },
  ],

  /* Workflow contract — used at the executable level. */
  workflow: [
    ["definition", "Definition"], ["inputs", "Inputs"], ["preconditions", "Preconditions"], ["actors", "Actors"],
    ["steps", "Steps"], ["decisions", "Decisions"], ["cases", "Cases"], ["branches", "Branches"],
    ["failures", "Failures"], ["recovery", "Recovery"], ["rework", "Rework"], ["criteria", "Criteria"],
    ["checks", "Checks"], ["evidence", "Evidence"], ["gate", "Gate"], ["outputs", "Outputs"],
    ["exit", "Exit"], ["handoff", "Handoff"], ["traceability", "Traceability"], ["learning", "Learning"],
  ],

  /* Canonical lens library */
  lenses: [
    { g: "Value", id: "biz", n: "Business / Strategy", i: "business_center", c: "Strategic fit, value hypothesis, opportunity cost." },
    { g: "Value", id: "prod", n: "Product", i: "inventory_2", c: "Problem–solution fit, scope, prioritisation, outcomes over output." },
    { g: "Value", id: "cust", n: "Customer / User", i: "person", c: "Real users, their jobs, and what adoption requires." },
    { g: "Value", id: "ux", n: "UX / CX", i: "touch_app", c: "Usability, journeys and the end-to-end experience." },
    { g: "Value", id: "dom", n: "Domain / Business Process", i: "account_tree", c: "Business rules, process flows, vocabulary, invariants." },
    { g: "Value", id: "fin", n: "Finance / Commercial", i: "payments", c: "Cost, funding, pricing, unit economics, return." },
    { g: "Build", id: "req", n: "Requirements", i: "checklist", c: "Clear, testable, traceable needs; controlled change." },
    { g: "Build", id: "eng", n: "Engineering", i: "code", c: "Implementability, code quality, maintainability." },
    { g: "Build", id: "arch", n: "Architecture", i: "architecture", c: "Structure, quality attributes, hard-to-reverse trade-offs." },
    { g: "Build", id: "data", n: "Data", i: "database", c: "Models, lineage, quality, retention, migration." },
    { g: "Build", id: "ai", n: "AI / ML", i: "psychology", c: "Model fitness, evaluation, drift, bias, oversight." },
    { g: "Trust", id: "sec", n: "Security", i: "shield", c: "Threats, attack surface, supply chain, vulnerability response." },
    { g: "Trust", id: "priv", n: "Privacy", i: "lock", c: "Data minimisation, lawful basis, consent, subject rights." },
    { g: "Trust", id: "comp", n: "Compliance / Regulatory", i: "verified", c: "Obligations and the evidence that proves them." },
    { g: "Trust", id: "legal", n: "Legal", i: "gavel", c: "Contracts, licensing, IP, liability, jurisdiction." },
    { g: "Trust", id: "gov", n: "Governance / Risk", i: "policy", c: "Decision rights, risk appetite, auditable controls." },
    { g: "Trust", id: "vendor", n: "Vendor / Third Party", i: "handshake", c: "Dependency risk, SLAs, lock-in, exit strategy." },
    { g: "Run", id: "qa", n: "Quality / Testing", i: "bug_report", c: "Fitness for purpose, defect prevention, test strategy." },
    { g: "Run", id: "perf", n: "Performance", i: "speed", c: "Latency, throughput, scalability under real load." },
    { g: "Run", id: "rel", n: "Reliability / Resilience", i: "health_and_safety", c: "Availability, failure tolerance, recovery." },
    { g: "Run", id: "ops", n: "Operations", i: "settings", c: "Operability, runbooks, monitoring, day-two cost." },
    { g: "Run", id: "infra", n: "Infrastructure / Platform", i: "dns", c: "Environments, capacity, platform services, IaC." },
    { g: "Run", id: "devops", n: "DevOps / Delivery", i: "all_inclusive", c: "Pipelines, flow, deployment safety." },
    { g: "Run", id: "sup", n: "Support / Service Mgmt", i: "support_agent", c: "Service readiness and the customer's path to help." },
    { g: "Reach", id: "a11y", n: "Accessibility", i: "accessibility_new", c: "Usable by people with disabilities; WCAG." },
    { g: "Reach", id: "i18n", n: "Localization / i18n", i: "translate", c: "Languages, locales, formats, regional rules." },
  ],

  /* Knowledge types — kept distinct */
  knowledgeTypes: {
    Framework: ["var(--teal)", "Structured, adaptable body of practice."],
    Standard: ["var(--pink)", "Formal, external, often auditable norm."],
    Pattern: ["var(--orange)", "Named reusable solution to a recurring problem."],
    Practice: ["#0ea5e9", "Proven, habitual way of working."],
    Principle: ["#d4a106", "Guiding truth when no rule applies."],
    Method: ["#8b5cf6", "Systematic approach with defined steps."],
    Technique: ["#10b981", "Specific, focused procedure."],
    Tool: ["#64748b", "Instrument that supports the work."],
  },

  /* Routing types */
  routes: {
    forward: { label: "Forward", icon: "arrow_forward", c: "#008080" },
    alternate: { label: "Alternate", icon: "alt_route", c: "#0284c7" },
    rework: { label: "Rework", icon: "undo", c: "#ff5722" },
    escalate: { label: "Escalate", icon: "north", c: "#c49000" },
    stop: { label: "Stop", icon: "block", c: "#e91e63" },
  },

  /* Learning outcome — the reasoning chain. `see` links: contract/<index> or page ids. */
  chain: [
    ["What are we solving?", "Start from the problem: purpose, expected outcome, the job to be done.", [["Definition", "contract/0"]], "Feature lists before a problem statement."],
    ["What evidence do we have?", "Separate knowns from assumptions; evidence arrives as artifacts.", [["Artifacts", "contract/8"]], "Treating senior opinion as evidence."],
    ["What needs to happen?", "Normal flow, parallel work, dependencies, states.", [["Flow", "contract/1"]], "Hidden dependencies."],
    ["Which perspectives matter?", "Select lenses deliberately — required vs applicable.", [["Lenses", "contract/6"], ["Lens Library", "lenses"]], "Every lens everywhere buries real risk."],
    ["Which methods / standards apply?", "Choose knowledge by applicability and know its type.", [["Knowledge", "contract/5"], ["Knowledge", "knowledge"]], "Standards as checklists = compliance theatre."],
    ["What decisions must be made?", "Decisions owned, options, who has a say. A gate is a decision with criteria.", [["Controls", "contract/4"]], "Unowned decisions get made by default."],
    ["What could go wrong?", "Alternates, edge cases, exceptions, failures — each with a response.", [["Cases", "contract/2"]], "Happy-path-only plans are hopes."],
    ["What controls are required?", "Criteria, checks, rules, policies — proportionate to risk.", [["Controls", "contract/4"]], "Controls not tied to a named risk."],
    ["What evidence proves readiness?", "Gates consume evidence produced by controls.", [["Gates", "contract/4"], ["Evidence", "contract/8"]], "\"We tested it\" is not evidence."],
    ["Who has authority to move forward?", "Roles, agents, and authority to approve, override, escalate, stop.", [["Execution", "contract/7"]], "Unclear authority turns gates into negotiations."],
    ["What happens next?", "Forward, alternate, rework, escalate or stop.", [["Routing", "contract/3"], ["Routing map", "routing"]], "Hidden rework."],
    ["How does the system learn and evolve?", "Every workflow ends in learning; every cycle ends in EVOLVE.", [["Workflow contract", "contract"]], "Retrospectives that change nothing."],
  ],
};
