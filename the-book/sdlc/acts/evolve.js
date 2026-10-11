/*
 * ACT VIII — EVOLVE
 * Authored against model.js. Status: draft (awaiting review).
 * Overrides the EVOLVE skeleton in roadmap.js.
 *
 * Unit ids are local; the book builds full paths (e.g. evolve.outcomes.review).
 * loops: [fromId, toId | "authority" | "stop", type, label]
 *   type: rework | alternate | escalate | stop   (forward flow is implied by order)
 *
 * EVOLVE closes the cycle: it measures real outcomes against the success criteria and
 * value hypothesis in DISCOVER's opportunity brief, turns signals into insights and
 * improvement items, keeps technical debt visible and paid, and ends in the Portfolio
 * Decision — iterate, scale, modernise, pivot or retire. New opportunities go back to
 * DISCOVER as requests; small improvements go to PLAN.
 */
{ /* scoped: discover.js declares a top-level const U, and every act shares the page scope */
const U = window.NODE_EVOLVE_UNITS || {};
(window.NODE_ACTS = window.NODE_ACTS || {}).evolve = {
  status: "draft",
  tagline: "Measure, adapt or retire.",
  purpose: "Measure real outcomes against what was promised, learn from everything the running product tells us, keep it healthy, and decide on evidence to iterate, scale, modernise, pivot or retire.",
  gate: "Portfolio Decision",
  outcomes: [
    "Outcome report vs the brief's hypothesis",
    "Insight synthesis & improvement backlog",
    "Tech-debt register & modernisation plan",
    "Portfolio decision (iterate / scale / modernise / pivot / retire)",
    "Retirement plan & decommission record",
    "Next-cycle opportunities → DISCOVER; small improvements → PLAN",
  ],
  routing: {
    forward: "New opportunity → DISCOVER as a request (REQ); the cycle starts again",
    alternate: "Small improvement → PLAN (product backlog)",
    rework: "Bad metrics → fix instrumentation and re-read",
    escalate: "Strategic shift or investment above authority → sponsor / portfolio board",
    stop: "Retire → Retirement & Decommission",
  },
  lenses: { required: ["biz", "prod", "cust", "data"], applicable: ["fin", "gov", "eng", "arch", "legal", "vendor", "ops", "ai", "priv", "sup", "sec", "infra"] },

  contract: {
    definition: {
      purpose: "Close the loop between what was promised and what happened, and turn it into the next cycle's decisions.",
      outcome: "An evidence-backed portfolio decision for the initiative, with outcomes measured, insights routed, debt visible and anything retired switched off cleanly.",
      jtbd: "When a change has been running for a while, help us know whether it worked, what to do next with it, and what to stop.",
      entry: ["Change released and running (OPERATE)", "Opportunity brief with value hypothesis and success criteria (DISCOVER)", "Signals flowing: usage, feedback, incidents, retrospectives"],
      exit: ["Outcome report recorded at the by-date", "Portfolio decision signed and every follow-up routed", "Retirements decommissioned and closed"],
    },
    flow: {
      normal: ["8.1 Measure outcomes", "8.2 Synthesise feedback & insight", "8.3 Manage tech debt & modernisation", "8.4 Review the portfolio", "8.5 Retire & decommission (when decided)"],
      parallel: ["8.1, 8.2 and 8.3 run continuously and side by side", "8.5 runs after a retire decision, alongside the next cycle"],
      dependencies: ["Operational signals from OPERATE", "Opportunity brief and decision record from DISCOVER", "Finance for realised value and run cost", "Quarterly planning"],
      stateTransitions: "Running → Measured → Understood → Decided → Routed (or Retiring → Decommissioned)",
    },
    cases: {
      happyPath: "Outcomes meet the brief's criteria; insights yield a few improvements; debt is under control → scale or iterate.",
      alternates: ["Outcome partly met with an explained gap → change course and iterate", "Vendor end-of-life forces a modernisation", "Evidence shows a different, bigger opportunity → pivot back to DISCOVER"],
      edgeCases: ["Mandated product that cannot be retired — the decision is how to run it", "Rollout by site means some segments are not live at the by-date"],
      exceptions: ["Instrumentation broken → readings caveated and fixed before judging", "Board not quorate → chair decides within limit, ratified later"],
      failures: ["Success claimed on output, not outcome", "Nothing is ever retired", "Insights never reach a backlog", "Debt invisible until it causes incidents"],
    },
    routing: {
      forward: "New opportunity → DISCOVER (request); the cycle starts again",
      alternate: "Small improvement → PLAN (product backlog); modernisation slices → PLAN",
      rework: "Bad metrics → fix instrumentation in 8.1; unexplained gap → 8.2",
      escalation: "Strategic shift or investment above the board's authority → executive; above the sponsor's → portfolio board",
      stop: "Retire → 8.5 Retirement & Decommission",
    },
    controls: {
      criteria: ["Every success criterion from the brief judged at its by-date", "Every insight routed or dropped with a reason", "Debt quantified and ranked with features", "Retire considered at every portfolio review"],
      checks: ["Recorder of readings is not the judge", "Finance agrees realised value", "Independent challenge of the portfolio recommendation"],
      gates: ["Outcome Review", "Portfolio Decision gate", "Decommission Sign-off"],
      rules: ["Targets from the brief are not moved in EVOLVE", "No decision by default — 'carry on' is a recorded decision", "Records under retention are never deleted"],
      policies: ["Outcome reviews at every by-date", "Quarterly portfolio review and re-rank", "Capacity allocation for debt agreed each quarter"],
    },
    knowledge: {
      frameworks: ["Benefits realisation management", "ITIL 4", "Lean Portfolio Management", "DORA metrics"],
      standards: ["ISO 31000 — monitoring & review", "ISO/IEC 14764", "ISO/IEC/IEEE 12207 — disposal process", "ISO 15489", "GDPR — storage limitation"],
      patterns: ["Leading & lagging indicators", "Strangler fig", "Deprecation window"],
      practices: ["Outcome review", "Portfolio review", "Closing the feedback loop", "Retrospective"],
      principles: ["Measure what was promised", "Separate recording from judging", "Every insight reaches a backlog", "Make debt visible", "Retire on purpose"],
      methods: ["Goal–Question–Metric", "Insight synthesis", "7 Rs of modernisation"],
      techniques: ["Comparison group", "Technical debt quadrant", "WSJF", "Scream test"],
      tools: ["Outcome dashboard", "Tech-debt register", "Portfolio register", "Service catalogue / CMDB"],
    },
    lenses: {
      applicable: ["Finance / Commercial", "Governance / Risk", "Engineering", "Architecture", "Legal", "Vendor / Third Party", "Operations", "AI / ML", "Privacy", "Support / Service Mgmt", "Security", "Infrastructure / Platform"],
      required: ["Business / Strategy", "Product", "Customer / User", "Data"],
      concerns: ["Measuring output instead of outcome", "Learning that never reaches a backlog", "Zombie systems and hidden debt"],
      constraints: ["Targets fixed by the brief", "Quarterly planning cadence", "Retention law"],
      evidence: ["Outcome report", "Insight synthesis", "Tech-debt register", "Portfolio decision record", "Decommission record"],
      decisions: ["Iterate / scale / modernise / pivot / retire"],
    },
    execution: {
      agents: ["Product manager", "Data analyst", "Engineering lead / architect", "Finance partner", "Service owner", "AI assistants for analysis, synthesis and drafting"],
      roles: ["A — Portfolio board", "R — Product manager", "C — Sponsor, Finance, Engineering, Operations, Data owner, Legal", "I — All teams"],
      tools: ["Outcome dashboard", "Research repository", "Tech-debt register", "Backlog tool", "Service catalogue / CMDB"],
      authority: "Product manager judges outcomes and the sponsor co-signs; the portfolio board makes the Portfolio Decision; the executive decides above the board's authority.",
    },
    artifacts: {
      inputs: ["Opportunity brief", "Discovery decision record", "Usage & operational signals", "Customer feedback", "Retrospective actions", "Portfolio backlog"],
      outputs: ["Outcome report", "Insight synthesis", "Improvement backlog", "Tech-debt register", "Modernisation plan", "Portfolio decision record", "Retirement plan", "Decommission record", "Opportunity signal / request", "Product backlog entry"],
      evidence: ["Outcome readings log", "Realised value reconciliation", "Review sign-offs", "Deletion certificate"],
    },
  },

  parallel: [["outcomes", "insight", "debt"]],

  loops: [
    ["insight", "outcomes", "rework", "Insight explains an outcome gap"],
    ["outcomes", "insight", "rework", "Unexplained gap → more evidence"],
    ["portfolio", "outcomes", "rework", "Pack lacks outcome evidence"],
    ["portfolio", "debt", "rework", "Modernisation needs a plan"],
    ["debt", "retire", "alternate", "Retire is the cheapest R"],
    ["portfolio", "retire", "alternate", "Retire decided"],
    ["outcomes", "authority", "escalate", "Target change / value outside range"],
    ["portfolio", "authority", "escalate", "Above board authority"],
    ["retire", "portfolio", "rework", "Replacement cannot serve users"],
    ["retire", "stop", "stop", "Decommissioned — cycle closes"],
  ],

  processes: [
    /* ───────────────────────── 8.1 ───────────────────────── */
    { id: "outcomes", short: "Outcomes", status: "draft",
      title: "Outcome Measurement",
      summary: "Measure real outcomes against the success criteria and value hypothesis in DISCOVER's opportunity brief.",
      gate: "Outcome Review",
      contract: {
        definition: {
          purpose: "Find out, honestly and on the brief's own terms, whether the change did what it was funded to do.",
          outcome: "An outcome report (OUT-###) at each by-date: every success criterion judged against baseline and target, realised value reconciled, and a decision to continue, change course or stop.",
          jtbd: "When a change is live, help me know whether it is working — by the measures we agreed before we built it.",
          entry: ["Opportunity brief with success criteria and value hypothesis", "Change released (or release date known)"],
          exit: ["Outcome report signed at the by-date", "Decision (continue / change course / stop) recorded with the next reading date"],
        },
        flow: {
          normal: ["Set the measurement plan", "Confirm baselines & instrumentation", "Record outcome readings", "Hold the outcome review"],
          parallel: ["Readings run continuously from release", "Value reconciliation ∥ gap analysis with 8.2"],
          dependencies: ["Opportunity brief (DISCOVER)", "Analytics and ERP data", "Finance partner", "Rollout schedule (RELEASE)"],
          stateTransitions: "Planned → Instrumented → Reading → Reviewed",
        },
        cases: {
          happyPath: "Criteria defined before release, baselines from DISCOVER, readings on time, targets met.",
          alternates: ["Rollout by site → read per site; not-yet-live sites are the comparison group", "Guardrail breach → early review"],
          edgeCases: ["Criteria met but value below the range", "A site not live at the by-date"],
          exceptions: ["Instrumentation broken → fix before readings count"],
          failures: ["Goalposts moved after the fact", "Review skipped because results disappoint"],
        },
        routing: {
          forward: "Outcome report → 8.4 Portfolio Review",
          alternate: "Interim review → continue with a new reading date",
          rework: "Bad metrics → fix instrumentation; unexplained gap → 8.2",
          escalation: "Target change or value far outside the hypothesis → portfolio board",
          stop: "Stop pursuing the criteria → recorded decision; feeds 8.4 (pivot / retire)",
        },
        controls: {
          criteria: ["Every brief criterion measured and judged", "Baselines on the same definition", "Value agreed with finance"],
          checks: ["Instrumentation reconciliation", "Recorder ≠ judge"],
          gates: ["Outcome Review"],
          rules: ["Targets are not moved in EVOLVE", "Readings are append-only"],
          policies: ["An outcome review at every by-date"],
        },
        knowledge: {
          frameworks: ["Benefits realisation management", "HEART framework"],
          standards: ["ISO/IEC 25010 — quality in use", "ISO 31000 — monitoring & review"],
          patterns: ["Leading & lagging indicators"],
          practices: ["Outcome review"],
          principles: ["Measure what was promised", "Separate recording from judging"],
          methods: ["Goal–Question–Metric"],
          techniques: ["Comparison group", "Cohort analysis"],
          tools: ["Outcome dashboard", "Analytics"],
        },
        lenses: {
          applicable: ["Finance / Commercial", "Operations", "Governance / Risk", "Privacy"],
          required: ["Product", "Business / Strategy", "Data"],
          concerns: ["Vanity metrics", "Confounders mistaken for effects"],
          constraints: ["Targets fixed by the brief"],
          evidence: ["Outcome readings log", "Outcome report"],
          decisions: ["Continue, change course or stop?"],
        },
        execution: {
          agents: ["Product manager (judge)", "Data analyst (recorder)", "Finance partner", "AI assistant for analysis and drafting"],
          roles: ["A — Sponsor", "R — Product manager", "C — Data analyst, Finance partner", "I — Portfolio board"],
          tools: ["Outcome dashboard", "Analytics"],
          authority: "Product manager judges; sponsor co-signs; the portfolio board alone changes a target.",
        },
        artifacts: {
          inputs: ["Opportunity brief", "Discovery decision record", "Usage & operational signals"],
          outputs: ["Outcome measurement plan", "Baseline record", "Outcome readings log", "Outcome report", "Realised value reconciliation"],
          evidence: ["Instrumentation check", "Review sign-offs"],
        },
      },
      loops: [
        ["baseline", "plan", "rework", "Metric not computable → redefine"],
        ["read", "baseline", "rework", "Instrumentation fault found"],
        ["review", "read", "rework", "Gap unexplained → more readings"],
        ["review", "authority", "escalate", "Target change / value outside range"],
        ["review", "stop", "stop", "Stop pursuing the criteria"],
      ],
      subprocesses: U.outcomes },

    /* ───────────────────────── 8.2 ───────────────────────── */
    { id: "insight", short: "Insight", status: "draft",
      title: "Feedback & Insight Synthesis",
      summary: "Turn feedback, usage and operational signals into evidenced insights and routed improvement items.",
      gate: "Insight Review",
      contract: {
        definition: {
          purpose: "Hear everything the running product is telling us and turn it into work someone will do.",
          outcome: "An insight synthesis (INS-##) and an improvement backlog (IMP-###) whose items are routed to PLAN, DISCOVER, the problem backlog or the tech-debt register — and a closed feedback loop.",
          jtbd: "When signals pile up, help me find the few that matter and make sure they change something.",
          entry: ["Change running and producing signals", "Review period set"],
          exit: ["Insights peer-reviewed", "Every insight routed or dropped with a reason", "Feedback-givers told what happens", "Learning log updated"],
        },
        flow: {
          normal: ["Collect feedback & signals", "Synthesise insights", "Triage into improvement items", "Close the feedback loop"],
          parallel: ["Collection runs continuously", "Synthesis for an outcome gap runs alongside the outcome review"],
          dependencies: ["OPERATE signals", "Support, sales and survey channels", "Outcome readings (8.1)", "Receiving backlogs (PLAN, DISCOVER, problem, debt)"],
          stateTransitions: "Collected → Synthesised → Routed → Closed",
        },
        cases: {
          happyPath: "A few strong insights, each routed and accepted; responses sent.",
          alternates: ["Low-volume product → direct user interviews", "Outcome gap → targeted synthesis"],
          edgeCases: ["Insight contradicts DISCOVER's research", "Item spans several products"],
          exceptions: ["Feedback reveals a breach → security / privacy officer"],
          failures: ["Anecdotes become insights", "Insights die in a deck"],
        },
        routing: {
          forward: "Improvement items → PLAN; opportunities → DISCOVER; insights → 8.1.4 and 8.4",
          alternate: "Debt → 8.3; root causes → problem backlog",
          rework: "Weak insight → re-cluster or gather evidence",
          escalation: "Strategic challenge or cross-product item → sponsor / portfolio board",
          stop: "No insight survives → 'no change indicated'",
        },
        controls: {
          criteria: ["Two or more independent kinds of evidence per insight", "Every item routed with a named receiver"],
          checks: ["Peer review of insights", "Receiver acceptance"],
          gates: ["Insight Review"],
          rules: ["No solution words in an insight", "Never promise unaccepted work"],
          policies: ["Feedback retention per privacy policy", "Learning log reviewed quarterly"],
        },
        knowledge: {
          frameworks: ["ITIL 4 — continual improvement", "Design Thinking — define"],
          standards: ["ISO 9241-210 — evaluation in use", "GDPR — data minimisation"],
          patterns: ["Affinity clustering", "Multi-level backlog"],
          practices: ["Voice of the customer programme", "Closing the feedback loop", "Retrospective"],
          principles: ["Every insight reaches a backlog", "Causes over symptoms"],
          methods: ["Insight synthesis", "Thematic analysis"],
          techniques: ["Five Whys", "NPS / CSAT", "WSJF"],
          tools: ["Research repository", "Backlog tool"],
        },
        lenses: {
          applicable: ["UX / CX", "Operations", "Support / Service Mgmt", "Privacy", "AI / ML"],
          required: ["Customer / User", "Product", "Data"],
          concerns: ["Loud minority", "Confirmation bias toward the shipped solution"],
          constraints: ["Consent and retention rules", "Receiving teams' capacity"],
          evidence: ["Signal inventory", "Insight synthesis", "Improvement backlog"],
          decisions: ["Which insights to act on, and where each item goes"],
        },
        execution: {
          agents: ["Product manager", "UX researcher", "Data analyst", "Product ops", "AI assistants for tagging, clustering and drafting"],
          roles: ["A — Product manager", "R — UX researcher, Product ops", "C — Support, Operations, Engineering", "I — Sponsor"],
          tools: ["Research repository", "Analytics", "Backlog tool"],
          authority: "Product manager accepts insights and routes items; receivers accept or reject; cross-product items go to the portfolio board.",
        },
        artifacts: {
          inputs: ["Customer feedback", "Usage & operational signals", "Retrospective actions", "Outcome report"],
          outputs: ["Signal inventory", "Insight synthesis", "Improvement backlog", "Feedback response", "Cycle retrospective", "Learning log"],
          evidence: ["Peer review notes", "Improvement backlog item"],
        },
      },
      loops: [
        ["synthesise", "collect", "rework", "Evidence too thin"],
        ["triage", "synthesise", "rework", "Insight too vague to route"],
        ["synthesise", "authority", "escalate", "Challenges strategy"],
        ["synthesise", "stop", "stop", "Nothing survives review"],
      ],
      subprocesses: U.insight },

    /* ───────────────────────── 8.3 ───────────────────────── */
    { id: "debt", short: "Tech Debt", status: "draft",
      title: "Tech Debt & Modernisation",
      summary: "Make technical debt visible, rank it with features, and pay it down in flow or through planned modernisation.",
      gate: "Debt & Modernisation Review",
      contract: {
        definition: {
          purpose: "Keep the product healthy and changeable by making debt visible, priced and paid.",
          outcome: "A ranked tech-debt register (TDR-###), paydown in flow, modernisation plans (MOD-##) for larger work, and fitness functions proving debt is paid.",
          jtbd: "Help me show what our shortcuts and ageing parts cost, and fix the ones that matter before they hurt.",
          entry: ["Service live and maintained", "Debt evidence available (analysis, DORA, incidents, retros, vendor notices)"],
          exit: ["Register ranked with features", "Top items planned or accepted with revisit dates", "Paid items verified by fitness functions"],
        },
        flow: {
          normal: ["Identify & record debt", "Assess interest & risk", "Plan paydown & modernisation", "Track paydown & fitness"],
          parallel: ["Identification is continuous", "Paydown runs in flow alongside features"],
          dependencies: ["Engineering time", "Product owner (ranking)", "Vendor end-of-life notices", "Portfolio board (funding)"],
          stateTransitions: "Recorded → Ranked → Planned → Paying down → Paid",
        },
        cases: {
          happyPath: "Debt recorded as found, ranked quarterly, paid in a fixed capacity share.",
          alternates: ["Large debt → modernisation plan to the portfolio review", "Retire is cheaper than modernising → 8.5"],
          edgeCases: ["Zero interest but a hard end-of-life date", "Debt in a vendor component"],
          exceptions: ["Security-critical debt → fast-tracked"],
          failures: ["Debt invisible until it causes incidents", "Half-finished migration — two systems forever"],
        },
        routing: {
          forward: "Paydown items → PLAN; modernisation plan and paydown report → 8.4 Portfolio Review",
          alternate: "Retire is the cheapest R → 8.5",
          rework: "Fitness function fails → fix before 'Paid'",
          escalation: "Funding, structural change or above-appetite risk → portfolio / architecture board / risk owner",
          stop: "Accept the debt with a revisit date",
        },
        controls: {
          criteria: ["Interest quantified", "Ranked against features", "Exit criteria as fitness functions"],
          checks: ["Peer review of new items", "Joint rank agreement", "Verification before 'Paid'"],
          gates: ["Debt & Modernisation Review"],
          rules: ["No big-bang rewrite without portfolio approval", "Unsupported components always registered"],
          policies: ["Capacity allocation for debt agreed quarterly"],
        },
        knowledge: {
          frameworks: ["DORA metrics", "SRE"],
          standards: ["ISO/IEC 14764 — maintenance types", "ISO/IEC 25010 — maintainability"],
          patterns: ["Strangler fig", "Parallel run", "Fitness functions"],
          practices: ["Capacity allocation for debt"],
          principles: ["Make debt visible"],
          methods: ["7 Rs of modernisation"],
          techniques: ["Technical debt quadrant", "Debt interest estimate", "WSJF"],
          tools: ["Tech-debt register", "Static analysis"],
        },
        lenses: {
          applicable: ["Security", "Reliability / Resilience", "Vendor / Third Party", "DevOps / Delivery", "Infrastructure / Platform", "Finance / Commercial"],
          required: ["Engineering", "Architecture", "Product"],
          concerns: ["Hidden debt", "Rewrite risk", "Feature work starved"],
          constraints: ["Capacity allocation", "Vendor deadlines"],
          evidence: ["Tech-debt register", "Debt paydown report"],
          decisions: ["Fix, plan, modernise or accept?"],
        },
        execution: {
          agents: ["Engineering lead", "Architect", "Engineers", "AI coding agents for scanning and impact analysis"],
          roles: ["A — Product owner", "R — Engineering lead", "C — Architect, Security officer", "I — Portfolio board"],
          tools: ["Tech-debt register", "Static analysis", "Pipeline"],
          authority: "Engineering lead owns the register; product owner agrees the rank; portfolio board funds modernisation; architecture board approves structural change.",
        },
        artifacts: {
          inputs: ["Problem record", "Retrospective actions", "Usage & operational signals"],
          outputs: ["Tech-debt register", "Debt interest assessment", "Modernisation plan", "Debt paydown report"],
          evidence: ["Fitness function results", "Review sign-offs"],
        },
      },
      loops: [
        ["assess", "identify", "rework", "Item unclear"],
        ["track", "plan", "rework", "Slices slip or fail"],
        ["plan", "authority", "escalate", "Needs funding / structural change"],
        ["assess", "stop", "stop", "Accept with revisit date"],
      ],
      subprocesses: U.debt },

    /* ───────────────────────── 8.4 ───────────────────────── */
    { id: "portfolio", short: "Portfolio", status: "draft",
      title: "Portfolio Review",
      summary: "Decide to iterate, scale, modernise, pivot or retire, and re-rank the portfolio at quarterly planning.",
      gate: "Portfolio Decision",
      contract: {
        definition: {
          purpose: "Decide each initiative's future on evidence and turn the decision into the next cycle's work.",
          outcome: "A signed portfolio decision (PDC-###), a re-ranked portfolio backlog, new opportunities logged for DISCOVER, small improvements in PLAN and retirements started.",
          jtbd: "Help us decide what to do next with what we've built — including stopping it — and make sure teams act on it.",
          entry: ["Outcome report (or interim readings)", "Insight synthesis and improvement backlog", "Tech-debt register and modernisation plans", "Quarterly planning convened"],
          exit: ["Portfolio decision signed", "Portfolio backlog re-ranked within WIP limits", "Every follow-up routed and acknowledged"],
        },
        flow: {
          normal: ["Assemble the review pack", "Evaluate options", "Make the portfolio decision", "Re-rank & route next-cycle work"],
          parallel: ["Packs for several initiatives prepared concurrently", "Routing to DISCOVER, PLAN and 8.5 runs in parallel"],
          dependencies: ["8.1, 8.2 and 8.3 outputs", "Finance", "Quarterly planning", "DISCOVER intake and PLAN product owner"],
          stateTransitions: "Pack ready → Options assessed → Decided → Routed",
        },
        cases: {
          happyPath: "Clear outcomes, one leading option, decision taken and routed in the planning session.",
          alternates: ["Combined decision (scale + modernise)", "Pivot → new opportunity to DISCOVER", "Retire → 8.5"],
          edgeCases: ["Mandated product — decision is how to run it", "Decision affects shared platform teams"],
          exceptions: ["Board not quorate → chair decides within limit"],
          failures: ["Sunk-cost continue", "Decision by default", "Follow-ups routed into a void"],
        },
        routing: {
          forward: "New opportunities → DISCOVER (request); small improvements → PLAN",
          alternate: "Retire → 8.5 Retirement & Decommission",
          rework: "Evidence missing → 8.1 / 8.2 / 8.3",
          escalation: "Above the board's authority → executive",
          stop: "Initiative closed or retired → archive with its outcome report",
        },
        controls: {
          criteria: ["All five options considered", "Rationale cites the pack", "Next review trigger set", "WIP limits respected"],
          checks: ["Independent challenge of the recommendation", "Receiver acknowledgement"],
          gates: ["Portfolio Decision gate"],
          rules: ["Retire is always on the list", "New opportunities enter DISCOVER as requests, never straight into delivery"],
          policies: ["Quarterly portfolio review and re-rank", "Investment thresholds per governance"],
        },
        knowledge: {
          frameworks: ["Lean Portfolio Management", "Four big risks"],
          standards: ["ISO 31000"],
          patterns: ["Decision record", "Multi-level backlog"],
          practices: ["Portfolio review", "Decision meeting"],
          principles: ["Decide explicitly", "Sunk cost is not a reason", "Retire on purpose"],
          methods: ["Weighted scoring"],
          techniques: ["WSJF", "Cost of delay", "Pre-mortem"],
          tools: ["Portfolio register", "Decision log", "Backlog tool"],
        },
        lenses: {
          applicable: ["Architecture", "Legal", "Vendor / Third Party", "Operations", "Engineering", "Compliance / Regulatory"],
          required: ["Business / Strategy", "Finance / Commercial", "Product", "Governance / Risk"],
          concerns: ["Sunk-cost bias", "Too many active initiatives", "Nothing ever retired"],
          constraints: ["Board authority and budget", "Team capacity"],
          evidence: ["Portfolio review pack", "Portfolio options appraisal", "Portfolio decision record"],
          decisions: ["Iterate / scale / modernise / pivot / retire"],
        },
        execution: {
          agents: ["Portfolio board", "Sponsor", "Product manager", "Finance partner", "AI assistant as challenger"],
          roles: ["A — Portfolio board chair", "R — Product manager", "C — Sponsor, Finance, Architect, Discovery lead", "I — All teams"],
          tools: ["Portfolio register", "Decision log", "Backlog tool"],
          authority: "Portfolio board decides and ranks; chair signs; executive above the board's authority.",
        },
        artifacts: {
          inputs: ["Outcome report", "Realised value reconciliation", "Insight synthesis", "Improvement backlog", "Tech-debt register", "Modernisation plan", "Portfolio backlog"],
          outputs: ["Portfolio review pack", "Portfolio options appraisal", "Portfolio decision record", "Portfolio backlog", "Opportunity signal / request", "Request log entry", "Product backlog entry"],
          evidence: ["Review sign-offs", "Peer review notes"],
        },
      },
      loops: [
        ["options", "pack", "rework", "Evidence missing"],
        ["decide", "options", "rework", "Options gap"],
        ["decide", "authority", "escalate", "Above board authority"],
        ["rerank", "decide", "rework", "Routing conflicts with the decision"],
        ["decide", "stop", "stop", "Retire / close"],
      ],
      subprocesses: U.portfolio },

    /* ───────────────────────── 8.5 ───────────────────────── */
    { id: "retire", short: "Retire", status: "draft",
      title: "Retirement & Decommission",
      summary: "Sunset what the portfolio decided to retire: move users, keep or dispose of data lawfully, and switch off for good.",
      gate: "Decommission Sign-off",
      contract: {
        definition: {
          purpose: "Retire products, features, components and tools deliberately, so users are moved, data is handled lawfully and cost and risk really go away.",
          outcome: "A retirement plan (RET-##), users transitioned, a verified data disposition, and a decommission record with savings and lessons.",
          jtbd: "When we decide to stop something, help us switch it off cleanly — without stranding anyone or losing data we must keep.",
          entry: ["Portfolio decision to retire, or a retire slice of a modernisation", "Replacement path available"],
          exit: ["No use after switch-off", "Data disposed per the retention schedule and certified", "Inventory shows Retired", "Savings and lessons recorded"],
        },
        flow: {
          normal: ["Plan the retirement", "Notify & transition users", "Retain, migrate or dispose of data", "Decommission & close"],
          parallel: ["Notice ∥ contract terminations", "Migration ∥ archiving"],
          dependencies: ["Service inventory (CMDB)", "Retention schedule", "Replacement live", "Legal, privacy and records management"],
          stateTransitions: "Decided → Planned → Notified → Data disposed → Read-only → Off → Closed",
        },
        cases: {
          happyPath: "Few dependants, replacement live, simple data, quiet scream test.",
          alternates: ["Partial retirement of one feature", "Retirement waits for the replacement"],
          edgeCases: ["Records under legal hold", "Shared infrastructure", "External customers with contractual notice"],
          exceptions: ["Hidden user found in the scream test → move them, extend read-only"],
          failures: ["Zombie system still running and costing", "Records deleted under retention", "Users stranded"],
        },
        routing: {
          forward: "Decommission record → 8.4 Portfolio Review and the learning log; the cycle closes",
          alternate: "Partial retirement → feature removed through PLAN",
          rework: "Dependant without a path or reconciliation failure → re-plan / re-migrate",
          escalation: "Legal hold, date change or shared platform → legal / sponsor / platform owner",
          stop: "Replacement cannot serve users → retirement stopped; back to 8.4",
        },
        controls: {
          criteria: ["Every dependant moved", "Every data class disposed per rule and verified", "Zero use after switch-off"],
          checks: ["Data owner and legal review", "Second-person verification of data disposal", "Operations lead verifies removal"],
          gates: ["Retirement Plan Approved", "Data Disposition Approved", "Decommission Sign-off"],
          rules: ["Read-only before off; off before removal", "Never delete records under retention or legal hold", "Credentials revoked on switch-off day"],
          policies: ["Change management policy", "Records retention schedule", "Privacy policy"],
        },
        knowledge: {
          frameworks: ["ITIL 4 — service retirement"],
          standards: ["ISO/IEC/IEEE 12207 — disposal process", "ISO 15489", "GDPR — storage limitation & erasure", "ISO/IEC 27001 — information deletion"],
          patterns: ["Deprecation window", "Parallel run"],
          practices: ["Data migration reconciliation"],
          principles: ["Retire on purpose", "Keep only the data you must"],
          methods: ["Risk assessment"],
          techniques: ["Dependency mapping", "Scream test"],
          tools: ["Service catalogue / CMDB", "Data catalogue", "Decommission checklist"],
        },
        lenses: {
          applicable: ["Legal", "Vendor / Third Party", "Security", "Finance / Commercial", "Compliance / Regulatory", "Support / Service Mgmt"],
          required: ["Operations", "Data", "Privacy", "Customer / User", "Governance / Risk"],
          concerns: ["Hidden dependants", "Unlawful retention or deletion", "Zombie systems"],
          constraints: ["Retention schedule", "Notice periods", "Legal holds"],
          evidence: ["Retirement plan", "Data disposition record", "Decommission record"],
          decisions: ["Can it be switched off, and is it gone?"],
        },
        execution: {
          agents: ["Service owner", "Product manager", "Data owner", "Operations engineer", "AI assistants for dependency discovery and drafting notices"],
          roles: ["A — Sponsor", "R — Service owner", "C — Data owner, Legal, Privacy officer, Security, Vendor manager", "I — Users, Support, Portfolio board"],
          tools: ["Service catalogue / CMDB", "Data catalogue", "Decommission checklist"],
          authority: "Service owner signs off; data owner approves disposition; privacy officer signs personal-data disposal; legal rules on holds; sponsor approves date changes.",
        },
        artifacts: {
          inputs: ["Portfolio decision record", "Service inventory", "Retention schedule"],
          outputs: ["Retirement plan", "Sunset notice", "Transition tracker", "Data disposition record", "Deletion certificate", "Decommission record"],
          evidence: ["Review sign-offs", "Archive verification", "Decommission checklist"],
        },
      },
      loops: [
        ["notify", "plan", "rework", "Dependant without a path"],
        ["data", "plan", "rework", "Data class missed"],
        ["decommission", "notify", "rework", "Scream test finds users"],
        ["data", "authority", "escalate", "Legal hold"],
        ["notify", "stop", "stop", "Replacement cannot serve users"],
      ],
      subprocesses: U.retire,
      parallel: [["notify", "data"]] },
  ],
};

}
