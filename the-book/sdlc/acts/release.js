/*
 * ACT VI — RELEASE
 * Authored against model.js. Status: draft (awaiting review).
 * Overrides the RELEASE skeleton in roadmap.js.
 *
 * Unit ids are local; the book builds full paths (e.g. release.prep.gonogo).
 * loops: [fromId, toId | "authority" | "stop", type, label]
 *   type: rework | alternate | escalate | stop   (forward flow is implied by order)
 *
 * The Go / No-Go is the act's gate. It is decided in 6.1.4, on evidence that 6.2
 * (rollback proven in staging), 6.3 (exposure plan and guardrails emitting) and 6.4
 * (launch readiness) produce alongside 6.1. Only a go lets 6.2.3 deploy; each ring in
 * 6.3 is then a small go / no-go of its own, and 6.5 closes the release and hands it
 * to OPERATE.
 *
 * Wrapped in a block: classic <script> tags share one global lexical scope, and
 * acts/discover.js already declares a top-level `const U`.
 */
{
const U = window.NODE_RELEASE_UNITS || {};
(window.NODE_ACTS = window.NODE_ACTS || {}).release = {
  status: "draft",
  tagline: "Ship safely and reversibly.",
  purpose: "Move verified change into production safely, reversibly and on a recorded decision, with the organisation ready to support it.",
  gate: "Go / No-Go",
  outcomes: [
    "Release candidate & approved change",
    "Go / No-Go decision (go · go with conditions · no-go)",
    "Deployed with proven rollback",
    "Progressive rollout by ring, guardrails held",
    "Support, comms, docs & training ready",
    "Production verified; release closed and handed to OPERATE",
  ],
  routing: {
    forward: "Go → deploy dark → rings → production verified → OPERATE",
    alternate: "Pause at the current ring; go with conditions holds the rings the conditions block",
    rework: "Guardrail breach → roll back; no-go → the failing criterion returns to its step",
    escalate: "Go / No-Go dispute → sponsor as release authority; severity breach → incident command",
    stop: "No-go with no path → release cancelled",
  },
  lenses: { required: ["devops", "ops", "rel", "sup"], applicable: ["comp", "legal", "cust", "sec", "infra", "gov", "i18n", "qa", "prod", "data", "a11y", "perf"] },

  contract: {
    definition: {
      purpose: "Move verified change into production safely and reversibly, on a recorded decision, with the people who use and support it ready.",
      outcome: "Verified stories released by a named go, deployed with a proven rollback, exposed ring by ring under guardrails, verified in production and handed to OPERATE.",
      jtbd: "When an increment is verified, help us get it to users without breaking anything, and be able to show who decided and why.",
      entry: ["Quality gate record (VERIFY) passed or conditionally passed", "Verified increments against a named build", "Runbook and release build from BUILD"],
      exit: ["Go / No-Go recorded by the named decider", "Release deployed, rolled out and verified in production", "Release closed with its outcome; service accepted by OPERATE"],
    },
    flow: {
      normal: ["6.1 Release prep & change approval", "6.2 Deployment", "6.3 Progressive rollout", "6.4 Launch readiness", "6.5 Post-deployment verification"],
      parallel: ["6.4 runs alongside 6.1 — launch readiness is a Go / No-Go input", "Deployment planning and rehearsal (6.2.1–6.2.2) and the exposure plan (6.3.1) run before the go", "Hypercare (6.5.3) overlaps the later rings"],
      dependencies: ["Quality gate record and verified stories (VERIFY)", "Release build, runbook and flags in the build (BUILD)", "Change authority, sites and support availability"],
      stateTransitions: "Assembling → At the gate → Go / Go with conditions / No-go → Deployed (dark) → Rolling out → Fully exposed → Verified → Closed",
    },
    cases: {
      happyPath: "Every criterion met → go; deployed dark; rings promoted on healthy guardrails; production matches predictions; OPERATE accepts.",
      alternates: ["Go with conditions — each owned, evidenced and dated, holding only the rings it blocks", "Standard (pre-approved) change → light approval path"],
      edgeCases: ["One site's data differs (Lyon's poorer scans)", "A freeze (month-end close) falls inside the rollout"],
      exceptions: ["Emergency change → expedited authority, reviewed afterwards", "Decider unavailable → the delegate named before the release"],
      failures: ["Shipping on a claim — evidence for a different build", "Rollback that was never rehearsed", "A deployment treated as the release, with no decision recorded"],
    },
    routing: {
      forward: "Healthy and verified → OPERATE (Act VII) with the release record, runbook and SLOs",
      alternate: "Pause at the current ring; conditions hold the rings they block",
      rework: "Guardrail breach → roll back (6.2.4); no-go → back to VERIFY, BUILD or 6.1.1 as the failing criterion says",
      escalation: "Go / No-Go dispute → sponsor as release authority; severity breach → incident command",
      stop: "No-go with no path, or kill switch → release cancelled; stories return unreleased",
    },
    controls: {
      criteria: ["Every in-scope story verified against the release build", "No open Sev-1/2 defects", "Non-functional criteria demonstrated", "Rollback exercised in staging", "Success metrics emitting before enablement", "Out-of-scope list agreed", "Change approved", "Launch readiness confirmed"],
      checks: ["Release readiness review", "Smoke after every deployment", "Guardrails read against thresholds at every ring"],
      gates: ["Go / No-Go gate", "Ring promotion at each ring", "Release close after production verification"],
      rules: ["A go — named person, date, outcome — is the only thing that makes stories Released", "Scope (only verified stories) is never conditional", "Every condition has an owner, evidence and a due date"],
      policies: ["Change management per ISO/IEC 20000-1", "No exposure before support, comms, docs and training are ready"],
    },
    knowledge: {
      frameworks: ["ITIL 4", "Site Reliability Engineering", "Progressive delivery"],
      standards: ["ISO/IEC 20000-1 — change, release & deployment", "ISO/IEC 27001 — change management"],
      patterns: ["Feature toggles", "Ring deployment", "Canary release"],
      practices: ["Go / No-Go review", "Continuous integration & delivery", "Production verification"],
      principles: ["Separate deploy from release", "A named person, a date, a decision"],
      methods: ["Change risk assessment", "Guardrail metrics"],
      techniques: ["Health checks", "Synthetic monitoring", "Release checklist"],
      tools: ["CI/CD pipeline", "Feature-flag service", "Observability platform", "Release record system"],
    },
    lenses: {
      applicable: ["Compliance / Regulatory", "Legal", "Customer / User", "Security", "Infrastructure / Platform", "Governance / Risk", "Localization / i18n", "Quality / Testing"],
      required: ["DevOps / Delivery", "Operations", "Reliability / Resilience", "Support / Service Mgmt"],
      concerns: ["Big-bang exposure", "Unproven rollback", "Users and support caught unprepared"],
      constraints: ["Change windows and freezes", "Decision rights"],
      evidence: ["Go / No-Go record", "Staging rehearsal record", "Ring records", "Production verification report"],
      decisions: ["Go / go with conditions / no-go", "Promote, pause or roll back each ring"],
    },
    execution: {
      agents: ["Release manager", "Delivery team & DevOps / platform engineer", "SRE / on-call", "Support lead & site leads", "CI/CD pipeline and AI assistants for checks and drafting"],
      roles: ["A — Release manager", "R — Engineering lead, DevOps / platform engineer, Support lead", "C — QA lead, Product owner, IT security, site leads", "I — Sponsor, service desk, users"],
      tools: ["CI/CD pipeline", "Feature-flag service", "Observability platform", "Release record system"],
      authority: "Release manager decides go / no-go and ring promotion; sponsor is the release authority for disputes; on-call may pull the kill switch without asking.",
    },
    artifacts: {
      inputs: ["Quality gate record", "Verified increments", "Release build", "Runbook"],
      outputs: ["Release candidate", "Change record", "Go / No-Go decision record", "Deployment record", "Ring record", "Launch readiness record", "Release notes", "Post-deployment verification report", "Release record"],
      evidence: ["Release criteria evaluation", "Staging rehearsal record", "Guardrail readings", "Service acceptance"],
    },
  },

  parallel: [["prep", "launch"]],

  loops: [
    ["deploy", "prep", "rework", "Rollback not proven → no-go"],
    ["launch", "prep", "rework", "Launch not ready → go with conditions or no-go"],
    ["rollout", "deploy", "rework", "Guardrail breach → roll back"],
    ["pdv", "deploy", "rework", "Production check failed → roll back"],
    ["pdv", "rollout", "alternate", "Pause at the current ring"],
    ["prep", "authority", "escalate", "Go / No-Go dispute → release authority"],
    ["rollout", "authority", "escalate", "Severity breach → incident command"],
    ["prep", "stop", "stop", "No-go → release cancelled"],
    ["rollout", "stop", "stop", "Kill switch → release withdrawn"],
  ],

  processes: [
    /* ───────────────────────── 6.1 ───────────────────────── */
    { id: "prep", short: "Prep & Approve", status: "draft",
      title: "Release Prep & Change Approval",
      summary: "Assemble the release from verified increments, approve the change, write the notes and decide go / no-go.",
      gate: "Go / No-Go",
      contract: {
        definition: {
          purpose: "Turn verified increments into a release that is scoped, approved as a change, explained to its readers and decided on evidence.",
          outcome: "A release candidate, an approved change, release notes and a recorded Go / No-Go decision with every condition owned and evidenced.",
          jtbd: "When verified work is waiting, help me ship exactly that, with a yes from the right person, on evidence for this build.",
          entry: ["Quality gate record passed or conditionally passed", "Verified stories against a named build"],
          exit: ["Go / No-Go recorded by the named decider", "Every condition owned, evidenced and dated", "On go: deployment scheduled in an approved window"],
        },
        flow: {
          normal: ["Assemble the release candidate", "Raise & approve the change", "Write release notes", "Hold the Go / No-Go decision"],
          parallel: ["Change approval ∥ release notes", "Evidence for the Go / No-Go arrives from 6.2.2, 6.3.1 and 6.4.4"],
          dependencies: ["VERIFY's quality gate record", "Rollback plan (6.2.1)", "Change authority and IT security"],
          stateTransitions: "Assembling → Scope confirmed → Change approved → At the gate → Decided",
        },
        cases: {
          happyPath: "Verified scope, approved normal change, every criterion met → go.",
          alternates: ["Go with conditions — conditions hold the rings they block", "Standard change → logged, no review"],
          edgeCases: ["A story verified on an earlier build", "Release window inside a freeze"],
          exceptions: ["Emergency change → expedited authority", "Decider unavailable → the named delegate"],
          failures: ["Unverified story shipped", "Decision not recorded", "Conditions without owners"],
        },
        routing: {
          forward: "Go → 6.2.3 Deploy to Production",
          alternate: "Go with conditions → deploy; blocked rings wait for their conditions",
          rework: "No-go → the failing criterion returns to VERIFY, 6.1.1 or 6.2.2",
          escalation: "Disputed decision → sponsor as release authority; high-risk change → change advisory",
          stop: "No-go with no path → release cancelled; stories stay verified and unreleased",
        },
        controls: {
          criteria: ["Only verified stories", "Change approved by an authority who is not its author", "Each criterion answered yes or no with evidence"],
          checks: ["Scope walk-through", "Release readiness review"],
          gates: ["Scope Confirmed", "Change Approved", "Notes Approved", "Go / No-Go"],
          rules: ["Scope is never conditional", "A go is the only thing that makes stories Released"],
          policies: ["Change policy per ISO/IEC 20000-1", "Decider named before the release"],
        },
        knowledge: {
          frameworks: ["ITIL 4 — change enablement & release management"],
          standards: ["ISO/IEC 20000-1 — change management"],
          patterns: ["Decision record"],
          practices: ["Go / No-Go review", "Peer review of changes"],
          principles: ["A named person, a date, a decision", "Exclude explicitly, with reasons"],
          methods: ["Change risk assessment", "Release readiness review"],
          techniques: ["Release checklist", "Risk matrix"],
          tools: ["Release record system", "Change calendar"],
        },
        lenses: {
          applicable: ["Quality / Testing", "Security", "Compliance / Regulatory", "Customer / User", "Legal"],
          required: ["Governance / Risk", "DevOps / Delivery", "Product"],
          concerns: ["Shipping on a claim", "Silent exclusions", "Unowned conditions"],
          constraints: ["Change windows and freezes"],
          evidence: ["Release candidate", "Change approval", "Go / No-Go record"],
          decisions: ["What ships, and is it go?"],
        },
        execution: {
          agents: ["Release manager", "Product owner", "Change authority", "AI assistant for release-notes drafting and impact analysis"],
          roles: ["A — Release manager", "R — Release manager, Product owner", "C — QA lead, Engineering lead, IT security", "I — Sponsor, service desk"],
          tools: ["Release record system", "Change calendar"],
          authority: "Release manager decides go / no-go; the change authority approves the change; the sponsor settles disputes.",
        },
        artifacts: {
          inputs: ["Quality gate record", "Verified increments", "Defect & residual-risk report"],
          outputs: ["Release candidate", "Change record", "Release notes", "Go / No-Go decision record", "Conditions register"],
          evidence: ["Release criteria evaluation", "Change approval"],
        },
      },
      loops: [
        ["change", "assemble", "rework", "Impact reveals a scope problem"],
        ["gonogo", "assemble", "rework", "No-go: drop or re-verify a story"],
        ["gonogo", "notes", "rework", "Notes don't match the final scope"],
        ["change", "authority", "escalate", "High risk → change advisory"],
        ["gonogo", "authority", "escalate", "Disputed decision → sponsor"],
        ["gonogo", "stop", "stop", "No-go → release cancelled"],
      ],
      subprocesses: U.prep,
      parallel: [["change", "notes"]] },

    /* ───────────────────────── 6.2 ───────────────────────── */
    { id: "deploy", short: "Deploy", status: "draft",
      title: "Deployment",
      summary: "Plan, rehearse and run an automated deployment of the verified build, with a rollback proven before it is needed.",
      gate: "Deployed with Rollback Proven",
      contract: {
        definition: {
          purpose: "Promote the verified build to production automatically and reversibly, with exposure off, so deployment carries no user risk.",
          outcome: "The release running dark in production, with a deployment record and a rollback rehearsed, timed and ready.",
          jtbd: "Help me get the build into production the same way every time, and out again in minutes if I must.",
          entry: ["Release candidate assembled", "Release build in the registry"],
          exit: ["Rollback proven in staging", "Deployed to production dark with smoke passed", "Any failure recovered and recorded"],
        },
        flow: {
          normal: ["Plan the deployment & rollback", "Rehearse & prove rollback", "Deploy to production", "Roll back or roll forward (when triggered)"],
          parallel: ["Planning and rehearsal run before the Go / No-Go", "Rehearsal ∥ launch readiness"],
          dependencies: ["Go / No-Go decision", "Approved change and window", "Pipeline and staging parity"],
          stateTransitions: "Planned → Rehearsed → Deployed (dark) / Failed → Restored",
        },
        cases: {
          happyPath: "Rehearsed rollback in 6 minutes; production deployment in 12; smoke passes.",
          alternates: ["Blue-green switch instead of a rolling deploy", "No schema change → redeploy-only rollback"],
          edgeCases: ["Migration needed before the code", "Dependency degraded at the start of the window"],
          exceptions: ["Window closing mid-deployment → stop and recover"],
          failures: ["Rollback never rehearsed", "Deployment fails in the window", "Hand edits in production"],
        },
        routing: {
          forward: "Deployed dark → 6.5.1 smoke, then 6.3.2 Ring 0",
          alternate: "Blue-green → switch traffic, keep blue warm",
          rework: "Rollback fails in staging → fix the plan; deployment fails → 6.2.4",
          escalation: "Unplanned impact → release manager; data damage → incident command",
          stop: "Release withdrawn → stories back to BUILD with a problem record",
        },
        controls: {
          criteria: ["Same digest from staging to production", "Rollback timed within the window", "Exposure off at deployment"],
          checks: ["On-call review of the plan", "Smoke after deployment"],
          gates: ["Deployment Plan Approved", "Rollback Proven", "Deployed", "Service Restored"],
          rules: ["No deployment without a recorded go and an approved change", "No manual changes in production"],
          policies: ["Build once, deploy many", "Deploy outside business peaks"],
        },
        knowledge: {
          frameworks: ["ITIL 4 — deployment management", "Site Reliability Engineering"],
          standards: ["ISO/IEC 20000-1 — release & deployment management", "ISO/IEC 27001 — A.8.31 separation of environments"],
          patterns: ["Build once, deploy many", "Expand / contract migration", "Blue-green deployment"],
          practices: ["Rollback rehearsal", "Smoke testing", "Continuous integration & delivery"],
          principles: ["Roll back first, diagnose later", "Separate deploy from release"],
          methods: ["Change risk assessment"],
          techniques: ["Health checks", "Release checklist"],
          tools: ["CI/CD pipeline", "Artifact registry"],
        },
        lenses: {
          applicable: ["Data", "Security", "Architecture"],
          required: ["DevOps / Delivery", "Infrastructure / Platform", "Reliability / Resilience", "Operations"],
          concerns: ["Irreversible steps", "Drift between tested and deployed"],
          constraints: ["Change window", "Data migrations"],
          evidence: ["Staging rehearsal record", "Deployment record"],
          decisions: ["Proceed, roll back or roll forward?"],
        },
        execution: {
          agents: ["DevOps / platform engineer", "Engineering lead", "On-call engineer", "CI/CD pipeline"],
          roles: ["A — Engineering lead", "R — DevOps / platform engineer", "C — On-call engineer, QA lead", "I — Release manager, service desk"],
          tools: ["CI/CD pipeline", "Artifact registry", "Feature-flag service"],
          authority: "Release manager may stop a deployment at any step; on-call may roll back without asking.",
        },
        artifacts: {
          inputs: ["Release candidate", "Release build", "Go / No-Go decision record", "Runbook"],
          outputs: ["Deployment plan", "Rollback plan", "Staging rehearsal record", "Deployment record", "Rollback record"],
          evidence: ["Pipeline run", "Smoke check results"],
        },
      },
      loops: [
        ["rehearse", "plan", "rework", "Rollback fails in staging"],
        ["execute", "rollback", "alternate", "Deployment fails → recover"],
        ["rollback", "plan", "rework", "Roll forward needs a new plan"],
        ["execute", "authority", "escalate", "Unplanned impact → release manager"],
        ["rollback", "stop", "stop", "Release withdrawn → BUILD"],
      ],
      subprocesses: U.deploy },

    /* ───────────────────────── 6.3 ───────────────────────── */
    { id: "rollout", short: "Rollout", status: "draft",
      title: "Progressive Rollout",
      summary: "Expose the release ring by ring — pilot users, then site by site — behind flags, watching guardrails, ready to pause or roll back.",
      gate: "Full Exposure",
      contract: {
        definition: {
          purpose: "Grow exposure only as fast as evidence of health grows, so a problem hurts a few users briefly rather than everyone.",
          outcome: "Everyone in scope exposed through recorded ring promotions, with guardrails held or every breach answered.",
          jtbd: "Help me release to real users without betting everything on one switch.",
          entry: ["Deployed dark with smoke passed", "Exposure plan and guardrails agreed and emitting"],
          exit: ["All rings at full exposure", "Every promotion and breach recorded", "Conditions blocking rings closed"],
        },
        flow: {
          normal: ["Configure flags & exposure plan", "Run Ring 0 (canary)", "Promote through the rings", "Watch guardrails, pause or roll back"],
          parallel: ["Guardrail watching runs throughout", "Next ring's training and comms ∥ current ring's soak"],
          dependencies: ["Flags in the build", "Observability platform", "Launch readiness per site", "Conditions register"],
          stateTransitions: "Dark → Ring 0 → Ring 1 … → Full exposure (with Paused / Rolled back possible at any ring)",
        },
        cases: {
          happyPath: "Ring 0 → Rotterdam → Lyon, every guardrail held.",
          alternates: ["Pause, fix, resume the same ring", "Low-risk change → two rings"],
          edgeCases: ["One site's data is worse (Lyon scans)", "Freeze inside the rollout"],
          exceptions: ["Too little data in a soak → extend it"],
          failures: ["Promotion by eye, without thresholds", "Thresholds moved after a breach", "Flags never removed"],
        },
        routing: {
          forward: "Full exposure → 6.5.2 Verify Production",
          alternate: "Pause at the current ring",
          rework: "Breach → roll back (6.2.4); missing guardrail → 6.3.1",
          escalation: "Severity breach → incident command; overdue condition → its owner and the release manager",
          stop: "Kill switch → release withdrawn",
        },
        controls: {
          criteria: ["Entry criteria and soak per ring", "Baseline, pause and rollback thresholds per guardrail"],
          checks: ["Canary analysis at each ring", "Metrics emitting before enablement"],
          gates: ["Exposure Plan Agreed", "Canary Healthy", "Ring Promotion", "Guardrails Held"],
          rules: ["Thresholds set before exposure and never moved after", "One ring at a time"],
          policies: ["Every release flag has an owner and a removal date"],
        },
        knowledge: {
          frameworks: ["Progressive delivery", "Site Reliability Engineering"],
          standards: ["ISO/IEC 27001 — A.8.9 configuration management"],
          patterns: ["Feature toggles", "Ring deployment", "Canary release", "Kill switch"],
          practices: ["Soak period"],
          principles: ["Limit the blast radius", "Separate deploy from release"],
          methods: ["Guardrail metrics", "Canary analysis"],
          techniques: ["Synthetic monitoring"],
          tools: ["Feature-flag service", "Observability platform"],
        },
        lenses: {
          applicable: ["Customer / User", "Data", "Localization / i18n", "AI / ML", "Support / Service Mgmt"],
          required: ["DevOps / Delivery", "Reliability / Resilience", "Operations"],
          concerns: ["Too much exposure too fast", "Harm while people debate"],
          constraints: ["Site freezes", "Open conditions"],
          evidence: ["Ring records", "Guardrail readings"],
          decisions: ["Promote, hold, pause or roll back?"],
        },
        execution: {
          agents: ["Release manager", "Engineering lead", "On-call engineer", "Site leads", "AI assistant for anomaly detection"],
          roles: ["A — Release manager", "R — Engineering lead", "C — Site leads, SRE, Product owner", "I — Support lead, sponsor"],
          tools: ["Feature-flag service", "Observability platform"],
          authority: "Release manager promotes rings; on-call pauses or pulls the kill switch without asking.",
        },
        artifacts: {
          inputs: ["Deployment record", "Exposure plan", "Conditions register", "Launch readiness record"],
          outputs: ["Exposure plan", "Guardrail definitions", "Ring record", "Flag change log"],
          evidence: ["Guardrail readings", "Kill-switch record"],
        },
      },
      loops: [
        ["canary", "flags", "rework", "Guardrail undefined or not emitting"],
        ["promote", "canary", "rework", "Ring unhealthy → hold at the previous ring"],
        ["guard", "promote", "alternate", "Pause, fix, resume"],
        ["guard", "authority", "escalate", "Severity breach → incident command"],
        ["guard", "stop", "stop", "Kill switch → rollout abandoned"],
      ],
      subprocesses: U.rollout,
      parallel: [["promote", "guard"]] },

    /* ───────────────────────── 6.4 ───────────────────────── */
    { id: "launch", short: "Launch Ready", status: "draft",
      title: "Launch Readiness",
      summary: "Get support, communications, documentation and training ready for each ring before its users are exposed.",
      gate: "Launch Readiness",
      contract: {
        definition: {
          purpose: "Make the organisation ready for the change — support, communications, documentation and training — before users meet it.",
          outcome: "A launch readiness record per ring, with support enabled, messages sent, docs published and users trained.",
          jtbd: "Help me make sure the people who use and support this are ready, not just the software.",
          entry: ["Release candidate and draft release notes", "Ring plan by site"],
          exit: ["Launch readiness record signed for each ring, gaps owned", "Readiness fed into the Go / No-Go"],
        },
        flow: {
          normal: ["Enable support", "Plan & send launch communications", "Publish user & operational documentation", "Train users & confirm readiness"],
          parallel: ["Support, comms and docs run concurrently", "The whole process runs alongside 6.1"],
          dependencies: ["Release notes (6.1.3)", "Exposure plan (6.3.1)", "Translators and site calendars"],
          stateTransitions: "Planned → Preparing → Ready (per ring) → Launched",
        },
        cases: {
          happyPath: "Each site briefed, documented and trained before its ring.",
          alternates: ["Internal change → internal comms only", "Simple change → video training"],
          edgeCases: ["Two languages across sites", "Shift workers"],
          exceptions: ["Translation late → that site's ring holds"],
          failures: ["Users exposed untrained", "Support learns of the release from users"],
        },
        routing: {
          forward: "Launch readiness record → 6.1.4 Go / No-Go and each ring in 6.3.3",
          alternate: "Super-user network → lighter service-desk briefing",
          rework: "Training finds doc gaps → 6.4.3",
          escalation: "Site disputes readiness → sponsor",
          stop: "Release cancelled → comms, docs and training withdrawn",
        },
        controls: {
          criteria: ["Article per known issue", "Every audience messaged", "Docs task-based, localised, accessible", "Attendance recorded"],
          checks: ["Site lead confirmation", "User review of docs"],
          gates: ["Support Ready", "Comms Approved", "Docs Published", "Launch Readiness"],
          rules: ["No ring enabled for untrained or unsupported users"],
          policies: ["Localised for every site in scope", "WCAG 2.2 AA for user documentation"],
        },
        knowledge: {
          frameworks: ["ITIL 4 — service desk & knowledge management"],
          standards: ["ISO/IEC/IEEE 26514", "WCAG 2.2"],
          patterns: ["Stakeholder onion"],
          practices: ["Support enablement", "Stakeholder communication plan", "Train-the-trainer", "Hypercare"],
          principles: ["Ready before exposed"],
          methods: ["Release readiness review"],
          techniques: ["Communication matrix"],
          tools: ["Knowledge base"],
        },
        lenses: {
          applicable: ["Accessibility", "Localization / i18n", "UX / CX", "Legal"],
          required: ["Support / Service Mgmt", "Customer / User", "Operations"],
          concerns: ["Users and support caught unprepared"],
          constraints: ["Translation lead time", "Shift patterns"],
          evidence: ["Launch readiness record", "Training record"],
          decisions: ["Is this site ready for its ring?"],
        },
        execution: {
          agents: ["Support lead", "Product owner", "Content designer", "Trainer and site super-users", "AI assistants for drafting articles and translations"],
          roles: ["A — Release manager", "R — Support lead, Content designer, Site leads", "C — Product owner, Engineering lead", "I — Sponsor"],
          tools: ["Knowledge base", "Release record system"],
          authority: "Site leads confirm their site; the release manager signs readiness; the sponsor rules on disputes.",
        },
        artifacts: {
          inputs: ["Release notes", "Runbook", "Exposure plan"],
          outputs: ["Support enablement pack", "Communications plan", "User documentation", "Training record", "Launch readiness record"],
          evidence: ["Site lead sign-off", "Support lead sign-off"],
        },
      },
      loops: [
        ["comms", "support", "rework", "Support not ready for the announced date"],
        ["train", "docs", "rework", "Training finds doc gaps"],
        ["train", "authority", "escalate", "Site not ready → sponsor"],
        ["support", "stop", "stop", "Release cancelled → launch withdrawn"],
      ],
      subprocesses: U.launch,
      parallel: [["support", "comms", "docs"]] },

    /* ───────────────────────── 6.5 ───────────────────────── */
    { id: "pdv", short: "Verify Prod", status: "draft",
      title: "Post-Deployment Verification",
      summary: "Smoke-check every deployment, verify production against what the release said would be true, run hypercare, and close and hand over to OPERATE.",
      gate: "Release Closed",
      contract: {
        definition: {
          purpose: "Prove in production that the release does what it said, catch early-life problems, and hand a runnable service to OPERATE.",
          outcome: "Smoke passed, predictions checked against production, hypercare exited, release closed with its outcome and accepted by OPERATE.",
          jtbd: "Help me know — with numbers — that the release worked, and finish it cleanly.",
          entry: ["Deployment finished", "Rings exposed and metrics emitting"],
          exit: ["Production verification report signed after the soak", "Operations accepted the handover", "Release record closed with its outcome"],
        },
        flow: {
          normal: ["Run smoke checks", "Verify production against predictions", "Run hypercare", "Close the release & hand over to OPERATE"],
          parallel: ["Hypercare overlaps the later rings and the soak"],
          dependencies: ["Guardrail dashboard and analytics", "NFRs and ADRs (DESIGN)", "Operations acceptance criteria"],
          stateTransitions: "Deployed → Smoke passed → Verified → Hypercare ended → Closed",
        },
        cases: {
          happyPath: "Smoke passes; every prediction met; hypercare quiet; OPERATE accepts.",
          alternates: ["Outcome metrics early → handed to EVOLVE for the outcome review", "Small release → checklist handover"],
          edgeCases: ["Prediction exceeded but harmless → ADR updated", "Condition open at close → carried as a problem"],
          exceptions: ["Measurement broken → fix and re-read before close"],
          failures: ["'It went fine' with no numbers", "Release never closed", "Operations rejects the handover"],
        },
        routing: {
          forward: "Closed release, runbook, SLOs → OPERATE; retrospective and learning log → EVOLVE",
          alternate: "Early outcome readings → EVOLVE outcome review",
          rework: "Measurement gap → re-read; rejected handover → fill the gaps",
          escalation: "Smoke fails or prediction badly missed → release manager; Sev-1/2 → incident command",
          stop: "Production check failed → roll back; release closed as failed",
        },
        controls: {
          criteria: ["Every prediction has a reading", "Soak complete", "Operations acceptance in writing"],
          checks: ["Smoke after every deployment", "SRE second review of readings"],
          gates: ["Smoke Passed", "Production Verified", "Hypercare Exit", "Release Closed"],
          rules: ["No release closed without a production check", "Mismatches become defects, problems or ADR updates"],
          policies: ["Every release gets a retrospective", "Flags removed on a scheduled date"],
        },
        knowledge: {
          frameworks: ["Site Reliability Engineering", "DORA metrics"],
          standards: ["ISO/IEC 20000-1 — monitoring release success", "ISO/IEC 25010 — quality in use"],
          patterns: ["Dark launch"],
          practices: ["Smoke testing", "Production verification", "Hypercare", "Operational acceptance"],
          principles: ["Evidence over assertion"],
          methods: ["Guardrail metrics"],
          techniques: ["Synthetic monitoring", "Health checks"],
          tools: ["Observability platform", "Release record system"],
        },
        lenses: {
          applicable: ["Performance", "Architecture", "Product", "Customer / User", "Governance / Risk"],
          required: ["Reliability / Resilience", "Operations", "Quality / Testing", "Support / Service Mgmt"],
          concerns: ["Predictions never checked", "Half-handed-over services"],
          constraints: ["Soak length", "Operations acceptance criteria"],
          evidence: ["Production verification report", "Service acceptance"],
          decisions: ["Did production match what we said? Does OPERATE accept?"],
        },
        execution: {
          agents: ["Release manager", "SRE", "Support lead", "Operations lead", "CI/CD pipeline", "AI assistant for metric comparison"],
          roles: ["A — Release manager", "R — SRE, Support lead, Engineering lead", "C — Architect, Product owner", "I — Sponsor"],
          tools: ["Observability platform", "Release record system", "Backlog tool"],
          authority: "Release manager judges the production check and closes the release; the operations lead accepts the service.",
        },
        artifacts: {
          inputs: ["Deployment record", "Ring record", "Guardrail readings", "Runbook"],
          outputs: ["Smoke check results", "Post-deployment verification report", "Hypercare log", "Operational handover pack", "Release record"],
          evidence: ["Production check", "Service acceptance"],
        },
      },
      loops: [
        ["verify", "smoke", "rework", "Smoke flaky → re-run"],
        ["hypercare", "verify", "rework", "Hypercare finds an unverified prediction"],
        ["handover", "hypercare", "rework", "OPERATE rejects the handover"],
        ["smoke", "authority", "escalate", "Smoke fails → rollback decision"],
        ["verify", "stop", "stop", "Production check failed → closed as failed"],
      ],
      subprocesses: U.pdv,
      parallel: [["verify", "hypercare"]] },
  ],
};
}
