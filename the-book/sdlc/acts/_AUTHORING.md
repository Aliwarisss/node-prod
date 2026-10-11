# Authoring Acts II–VIII the way DISCOVER is written

Seven acts (PLAN, DESIGN, BUILD, VERIFY, RELEASE, OPERATE, EVOLVE) are only
skeletons in `roadmap.js`. Each one is to be written out to the same depth as
DISCOVER, against `model.js`. **Read these first and copy their exact shapes:**

- `model.js`: the NODE contract (10 sections and the field order), the
  workflow contract, the lens library, the knowledge types and the routes.
- `system.js`: the tracks, backlogs, gates, cadences and flows. The act must
  agree with it.
- `acts/discover-units.js`: subprocesses and workflows. Copy its helpers
  `c(...)`, `W(...)` and `S(...)` verbatim.
- `acts/discover.js`: the act and its processes (contract, loops,
  `subprocesses: U.<proc>`, parallel).
- `acts/discover-depth.js` sections 2–6: handoffs, continuity (CONT), the
  stop/park policy, tailoring and the trace chain. Teaching (§7) and the
  walkthrough (§8) are **not** needed.
- `artifacts.js` and `knowledge.js`: the template and knowledge-entry shapes,
  and the **running example**.

## The four files per act (and nothing else)

| File | Defines |
|---|---|
| `acts/<act>-library.js` | `Object.assign(window.NODE_ARTIFACTS, {...})` with a template for **every artifact name the act uses** that the library lacks. Also `Object.assign(window.NODE_KNOWLEDGE, {...})` for every knowledge name the act uses that `knowledge.js` lacks. |
| `acts/<act>-units.js` | `window.NODE_<ACT>_UNITS = { <processId>: [S(...), ...] }`: 4 subprocesses per process, each with the full contract via `c(...)` and at least one workflow via `W(...)`. |
| `acts/<act>.js` | `window.NODE_ACTS.<act> = {...}`. Same shape as `discover.js`: status `"draft"`, tagline, purpose, gate, outcomes, routing, lenses (ids), act contract (9 sections), parallel, loops, processes (each with a 9-section contract, loops, `subprocesses: U.<id>`, parallel where true). |
| `acts/<act>-depth.js` | IIFE like `discover-depth.js` §2–6: the HANDOFF map for every workflow (artifact → receiving unit, including the next act), CONT continuity for the act `""`, every process and every subprocess, the stop/park policy, `tailoring` (light / standard / rigorous, with skip/condense/add using fids `<act>.<proc>` and `<act>.<proc>.<sub>`), and `traceChain`. |

Load order (index.html): `<act>-library.js`, `<act>-units.js`, `<act>.js`, `<act>-depth.js`, after the DISCOVER files.

## The bar: as DISCOVER, not lighter

- **Processes:** keep the roadmap skeleton's processes, titles and gate.
  Process ids are fixed below.
- **Subprocesses:** 4 per process, each with:
  - all **10** contract sections and every field filled (continuity comes
    from depth CONT);
  - its own gate;
  - real, specific content, not filler.
- **Workflows:**
  - at least one per subprocess, with 4–6 steps in the form
    `[id, action, actor, outputArtifactName?, isDecision?]`;
  - at least one decision step;
  - loops `[from, to | "authority" | "stop", rework | alternate | escalate | stop, label]`;
  - the full `wf` object (`definition, inputs, preconditions, actors,
    decisions, cases, branches, failures, recovery, rework, criteria, checks,
    evidence, gate, outputs, exit, handoff, traceability, learning`).
- **Process and act loops:** the same loop format, between subprocess ids or
  process ids.
- **Names must resolve:**
  - **Lenses:** use exact lens names from `model.js` (e.g. "Quality /
    Testing", "DevOps / Delivery", "Infrastructure / Platform"). Act-level
    `lenses` uses lens ids.
  - **Artifacts:** every input and output name and every step output must be
    an alias of an artifact in the library, existing or added in
    `<act>-library.js`. Reuse existing ones where they fit (e.g.
    `opportunity-brief`, `decision-record`, `risk-register`,
    `learning-log`, `product-backlog`, `sprint-backlog`, `backlog-item`,
    `definition-of-ready`, `definition-of-done`, `problem-record`,
    `review-record`, `park-record`).
  - **Knowledge:** names resolve to `knowledge.js` keys or to entries you
    add.
- **Templates:** same shape as `artifacts.js`: type, format, aliases, what,
  purpose, owner, users, `tpl` in one of the formats doc, sheet, form,
  message, canvas or pack (each with its exact sub-shape), good, and signoff
  where relevant. Example values continue the book's **running example**:
  - clerks re-type emailed PDF orders into the ERP (~2.5 h/day);
  - an auto-fill-from-PDF initiative worth €375k–€960k/yr (likely €641k);
  - order-handling time 14 → 8 min, errors 3% → 1%;
  - ERP import API only, parsing accuracy on poor scans, vendor connector
    by June, rollout by site.

  Read `artifacts.js` for the existing example details and stay consistent
  with them.
- **Style:** British spelling, the book's voice, `→` for flow, plain
  specific sentences.
- **Draw on**:
  - the standards the book already cites (ISO/IEC/IEEE 29148, ISO/IEC
    25010, ISO 31000, ISO 9241-210, Scrum, Kanban, DORA, ITIL 4, SRE);
  - Squid's delivery manual and handbook, for depth that Squid already
    enforces:
    - `F:/Workspace/_goaled/Squid/squid-next/docs/content/*.js`;
    - `docs/architecture-handbook.md`;
    - `src/lib/workflow-map.ts`;
    - `src/lib/process.ts`;
    - `src/lib/gates/*.ts` (headers).

## The acts and how they join

Trace prefixes must not collide with DISCOVER's (REQ IDEA HYP Q SES THM PS
EXP OPP RSK DEC BRF) or with each other's. The backlog IDs INI, EPC, FEA and
STY, and LRN (learning log), are shared and may appear in any act.

| Act | Process ids (title) | Gate | Receives | Hands on | Trace prefixes it creates |
|---|---|---|---|---|---|
| **plan** (II) | requirements (Requirements Engineering) · scope (Scope & Prioritisation) · estimate (Estimation & Capacity) · roadmap (Roadmap & Release Planning) · invest (Investment & Approval) | Commitment | Opportunity brief, decision record, evidence pack, risk register (from DISCOVER) | Approved requirements baseline, prioritised product backlog (EPC/FEA), estimates and capacity, release roadmap, business case and commitment decision → DESIGN | NEED, RQ, EST, RMP, BC, CMT |
| **design** (III) | experience (Experience Design) · domain (Domain Modelling) · architecture (Architecture Definition) · data (Data Design) · secure (Security & Privacy by Design) · quality (Quality Attribute Specification) | Design Readiness | Requirements baseline, backlog, roadmap, commitment | UX flows and validated prototypes, UI spec and states, domain model, architecture description and ADRs, data model, threat model and privacy assessment, quality-attribute scenarios (measurable NFRs), design readiness record, Ready stories (DoR) → BUILD | UXF, PRT, UIS, DOM, ARC, ADR, DAT, THR, DPIA, QAS, DRR |
| **build** (IV) | pipeline (Environment & Pipeline Setup) · iteration (Iteration Planning) · implement (Implementation) · review (Review & Integration) · devtest (Developer Testing) · docs (Technical Documentation) | Definition of Done | Ready stories, design readiness record, ADRs | Environments and pipeline, sprint goal and iteration backlog, increments on mainline, reviewed and merged changes, developer test evidence, SBOM and provenance, technical docs and runbook, DoD record → VERIFY | ENV, PIPE, SPR, TSK, PR, CR, BLD, SBOM, DOC, DOD |
| **verify** (V) | strategy (Test Strategy & Planning) · functional (Functional Verification) · nonfunctional (Non-Functional Verification) · acceptance (Acceptance & Validation) · defects (Defect Triage & Resolution) | Quality Gate | Increments meeting DoD, criteria, NFRs | Test strategy and plan, test cases traced to criteria, test-run evidence, non-functional results, UAT sign-off, defect and residual-risk report, risk acceptances, quality gate record → RELEASE | TST, TC, TR, NFT, UAT, DEF, RRA, QGR |
| **release** (VI) | prep (Release Prep & Change Approval) · deploy (Deployment) · rollout (Progressive Rollout) · launch (Launch Readiness) · pdv (Post-Deployment Verification) | Go / No-Go | Quality gate record, verified increments | Release candidate and change record, go/no-go decision, deployment record with proven rollback, rollout ring records, launch readiness (support, comms, docs), release notes, post-deployment verification → OPERATE | RC, CHG, GNG, DEP, RING, LCH, RN, PDV |
| **operate** (VII) | observe (Observability & Monitoring) · incident (Incident Management) · problem (Problem Management) · support (Service Request & Support) · capacity (Capacity & Cost) · secops (Security Operations) | SLO & Error Budget | Release record, runbooks, SLO targets | SLOs, dashboards and alerts, incident records and postmortems, problem records and known errors (→ problem backlog), service requests and knowledge base, capacity and cost reports, security events and vulnerabilities, error-budget report → EVOLVE (signals); hotfixes → BUILD | SLO, ALR, INC, PM, PRB, KE, SR, CAP, VUL, EBR |
| **evolve** (VIII) | outcomes (Outcome Measurement) · insight (Feedback & Insight Synthesis) · debt (Tech Debt & Modernisation) · portfolio (Portfolio Review) · retire (Retirement & Decommission) | Portfolio Decision | Outcome data, signals, retros, opportunity brief's hypothesis | Outcome report vs hypothesis, insight synthesis, improvement backlog items, tech-debt register and modernisation plan, portfolio decision (iterate / scale / modernise / pivot / retire), retirement plan and decommission record, next-cycle opportunities → DISCOVER (REQ); small improvements → PLAN | OUT, INS, IMP, TDR, MOD, PDC, RET |

## Done means

`node acts/_validate.cjs <act>` (from `the-book/sdlc`) reports:
- **0 errors**;
- **no artifact warnings** (every artifact name has a template);
- **no lens warnings**;
- at most a handful of knowledge warnings.

Write only your act's four files. Do not edit `index.html`, `app.js`,
`artifacts.js`, `knowledge.js` or any DISCOVER file.
