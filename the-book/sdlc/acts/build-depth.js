/*
 * ACT IV — BUILD · handoffs, continuity, stop policy, tailoring and the trace chain.
 * Status: draft (awaiting review). Loaded after acts/build.js.
 *
 *  - Workflow handoffs naming the artifact and the receiving unit (including VERIFY)
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log; a stopped story or
 *    cancelled sprint leaves a re-plan record; an abandoned branch is closed with a reason
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.build;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);

  /* ───────── 1. Subprocess-level loops between workflows ───────── */
  SP("pipeline", "ci").loops = [["restore-green", "build-pipeline", "rework", "Repeated red mains → strengthen a gate"]];
  SP("iteration", "replan").loops = [["close-sprint", "replan", "rework", "Retrospective finds silent scope change → record it"]];
  SP("implement", "flags").loops = [["retire-flag", "flag-work", "rework", "Flag cannot be removed → fix its design"]];

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "provision-env": "Environment catalogue & IaC change records → 4.1.2 Build the CI/CD Pipeline",
    "build-pipeline": "Pipeline definition, repository standards & first green CI run → 4.1.3 Manage Secrets & Access",
    "restore-green": "Learning log entry (cause & prevention) → 4.2.4 sprint retrospective; green main → every lane",
    "secure-secrets": "Secrets inventory & secret-scanning gate → 4.1.4 Secure the Supply Chain",
    "attest-build": "Supply-chain policy, SBOM & provenance steps → 4.2 Iteration Planning (pipeline ready for the sprint)",
    "confirm-capacity": "Ready stories & capacity plan → 4.2.2 Set the Sprint Goal & Select Stories",
    "set-goal": "Sprint goal & iteration backlog → 4.2.3 Break Stories into Tasks & Commit",
    "commit-sprint": "Sprint commitment (SPR-##, rev 0) & task breakdown → 4.3 Implementation",
    "replan": "Re-plan record (rev n) → sprint board and 4.3 lanes; history → Review & Retrospect the Sprint",
    "close-sprint": "Sprint review notes → product backlog; sprint retrospective & learning log → EVOLVE",
    "kick-off-story": "Before-you-start checklist, query answers & branch → 4.3.2 Build in Small Commits",
    "build-increment": "Commits on the branch (all tasks ticked) → 4.4.1 Open the Pull Request",
    "flag-work": "Feature flag register entry → 4.4 Review & Integration; flag targeting → RELEASE",
    "retire-flag": "Updated feature flag register → 4.6.3 Write the Runbook",
    "conform-design": "Design query outcome & ADR revision → 4.4.2 Review against Criteria & Standards (and DESIGN on ADR change)",
    "open-pr": "Pull request → 4.4.2 Review against Criteria & Standards and 4.4.3 Run Automated Checks",
    "review-code": "Code review record (approved) → 4.4.4 Merge on Green & Build the Increment",
    "gate-analysis": "Static analysis report & quality gate result → 4.4.4 Merge on Green & Build the Increment",
    "merge-build": "Build record, SBOM, provenance & staging deployment record → 4.6.4 Check the Definition of Done",
    "map-tests": "Criterion-to-test map → 4.5.2 Write Unit Tests (and VERIFY for end-to-end-only criteria)",
    "unit-tests": "Unit test results & coverage report → 4.5.3 Write Integration & Contract Tests",
    "contract-tests": "Integration & contract test results → 4.5.4 Keep the Suite Fast & Trustworthy",
    "keep-suite": "Developer test evidence (linked to BLD-###) → 4.6.4 Check the Definition of Done",
    "document-code": "Technical documentation & changelog → 4.6.4 Check the Definition of Done",
    "publish-api": "API reference → 4.6.4 Check the Definition of Done; consuming teams",
    "write-runbook": "Runbook → 4.6.4 Check the Definition of Done; RELEASE launch readiness and OPERATE",
    "check-done": "DoD record & increment hand-off pack → VERIFY (Act V)",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Done increments with DoD records and the increment hand-off pack → VERIFY (Act V); runbook → RELEASE and OPERATE; retrospective actions and learning log → EVOLVE", ["Carries STY-### from DESIGN and creates ENV → PIPE → SPR → TSK → PR → CR → BLD → SBOM → DOC → DOD", "Every DOD-### links its STY-###, BLD-###, PR-### and CR-###; every BLD-### links its SBOM-### and pipeline run"], "Setup 1–2 weeks once, then sprints of 1–2 weeks; a story takes 2–5 days from kick-off to Done (Light ≈ one-week sprints, minimal setup · Rigorous adds formal security and audit evidence)", ["Lead time for changes (commit → staging)", "Deployment frequency to staging", "Change failure rate and time to restore main", "Sprint goals met; stories done vs committed; re-plans per sprint", "Escaped defects found in VERIFY per story"], ["Sprint retrospective every sprint", "DORA trend reviewed monthly", "Patterns from red mains, re-plans and DoD failures fed to EVOLVE"]],
    pipeline: ["Environment catalogue, pipeline definition, secrets inventory, supply-chain policy → 4.2 Iteration Planning (and every sprint after)", ["Creates ENV-## and PIPE-##; each gate maps to a DoD item; SBOM-### per build"], "1–2 weeks at the start; improved every sprint", ["Time to a green walking skeleton", "PR check duration", "Drift incidents", "Builds without SBOM or provenance (target 0)"], ["Gates that missed defects; near-miss secret leaks — learning log"]],
    iteration: ["Sprint commitment, task breakdown and sprint goal → 4.3 Implementation; review notes → product backlog; retro → learning log", ["Creates SPR-## (with revisions) and TSK-###; STY-### carried from DESIGN"], "2–4 hours of planning per two-week sprint; daily 15 min; review and retro 2–3 hours", ["Sprint goals met", "Committed vs done", "Re-plans per sprint and their causes", "Blocker age"], ["Retrospective actions — learning log"]],
    implement: ["Commits on the branch, flags and design-query outcomes → 4.4 Review & Integration", ["Commits carry TSK-###; branches carry STY-###; design queries link ADR-###"], "1–4 days per story", ["Commits per day; branch age at PR", "Design queries raised per sprint", "Flags older than their removal date"], ["Questions that should have been caught at Ready; ADRs changed by build — learning log and DESIGN"]],
    review: ["Approved, merged, attested build staged → 4.6.4 Check the Definition of Done", ["Creates PR-###, CR-### and BLD-###; BLD links PR, run, SBOM-### and provenance"], "Review within 1 working day; merge to staged < 1 hour", ["Time to first review", "Review rounds per PR", "Quality-gate failures by type", "Queue ejections"], ["Defects found in review and by analysers — fed into coding standards"]],
    devtest: ["Criterion-to-test map and developer test evidence → 4.6.4 Check the Definition of Done; test map → VERIFY", ["Each test named against AC-n of STY-###; results linked to BLD-### by run #"], "Continuous with the code; suite health 1 hour per sprint", ["Criteria with tests (target 100%)", "PR suite duration", "Flaky tests in quarantine", "Escaped defects found in VERIFY"], ["Escaped defects traced to missing tests — learning log"]],
    docs: ["DoD records and increment hand-off pack → VERIFY; runbook → RELEASE / OPERATE; API reference → consuming teams", ["Creates DOC-### and DOD-###; DOD links STY, BLD, PR, CR, DOC"], "Docs with each change; runbook dry run ½ day per feature; DoD check ½ hour per story", ["Stories done first time vs returned", "DoD items most often unmet", "Runbook steps that failed in dry run or incident"], ["DoD items most often unmet — retrospective; runbook gaps found in OPERATE — learning log"]],
    "pipeline.envs": ["Environment catalogue & IaC change records → 4.1.2 Build the CI/CD Pipeline", ["Creates ENV-## per environment, linked to its IaC path and ARC-##"], "2–4 days initially; minutes per later change", ["Time to rebuild an environment from code", "Drift detections", "Parity gaps open"], ["Parity gaps that hid a defect — learning log"]],
    "pipeline.ci": ["Pipeline definition, repository standards & green walking skeleton → 4.1.3 Manage Secrets & Access", ["Creates PIPE-## (versioned); each gate references its DoD item"], "2–5 days initially; improved every sprint", ["PR check duration (target < 10 min)", "Time to restore red main", "Known-bad changes caught per gate"], ["Gates that missed defects; red-main causes — learning log"]],
    "pipeline.secrets": ["Secrets inventory & scanning gate → 4.1.4 Secure the Supply Chain", ["Each secret linked to ENV-## and the THR-## it mitigates"], "1–2 days initially; rotations on schedule", ["Secrets in code found by scans (target 0)", "Rotations overdue", "Readers per secret"], ["Near-miss leaks — learning log"]],
    "pipeline.supply": ["Supply-chain policy, SBOM & provenance steps → 4.2 Iteration Planning", ["Creates SBOM-### per build, equal to its BLD-###; provenance links commit and PIPE-##"], "1–3 days initially", ["Builds with SBOM and verified provenance (target 100%)", "Open critical/high findings and their age", "Exceptions past expiry (target 0)"], ["Findings that reached a build — learning log"]],
    "iteration.capacity": ["Ready stories & capacity plan → 4.2.2 Set the Sprint Goal & Select Stories", ["STY-### checked against the DoR; DRR-### linked where design was needed"], "30–60 min before planning", ["Ready stories available vs needed", "Forecast vs actual"], ["Stories that passed the DoR but were not ready — learning log"]],
    "iteration.goal": ["Sprint goal & iteration backlog → 4.2.3 Break Stories into Tasks & Commit", ["Goal → FEA-###; each STY-### → FEA-### → EPC-###"], "1 hour", ["Sprint goals met", "Stories split during planning"], ["Goals missed and why — learning log"]],
    "iteration.tasks": ["Sprint commitment & task breakdown → 4.3 Implementation", ["Creates SPR-## (rev 0) listing STY-### with owners; TSK-### → STY-###"], "1–2 hours", ["Tasks added after commit", "Stories without test or docs tasks (target 0)"], ["Tasks discovered mid-sprint — learning log"]],
    "iteration.replan": ["Re-plan records → sprint board; review notes → product backlog; retro → learning log → EVOLVE", ["SPR-## revisions list added / removed STY-###; LRN-### linked to SPR-##"], "Daily 15 min; re-plan 15 min; review and retro 2–3 hours", ["Re-plans per sprint and causes", "Blocker age", "Retro actions applied next sprint"], ["Causes of re-plans; retro actions — learning log"]],
    "implement.start": ["Before-you-start checklist & branch → 4.3.2 Build in Small Commits", ["Branch named after STY-###; queries logged against STY-###"], "1–2 hours per story", ["Questions raised before vs after building", "Stories returned to refinement"], ["Questions that should have been caught at Ready — learning log"]],
    "implement.code": ["Commits on the branch → 4.4.1 Open the Pull Request", ["Every commit names its TSK-###"], "1–4 days per story", ["Branch age at PR", "Commits per day", "Red pipelines on branch"], ["Tasks that overran and why — learning log"]],
    "implement.flags": ["Flag register entries → 4.4 Review & Integration; flag targeting → RELEASE", ["Each flag linked to FEA-### / STY-### and its removal PR-###"], "Minutes to add; removal within a quarter", ["Active release flags", "Flags past removal date (target 0)"], ["Flag-related defects — learning log"]],
    "implement.conform": ["Design-query outcomes & ADR revisions → 4.4.2 Review (and DESIGN on ADR change)", ["Design query → ADR-### revision → PR-###"], "Hours per query; architect answers within a day", ["Design queries per sprint", "Fitness-function failures", "ADRs revised from build findings"], ["ADRs changed by build findings — learning log and DESIGN"]],
    "review.pr": ["Pull request → 4.4.2 Review and 4.4.3 Automated Checks", ["Creates PR-### linked to STY-### and its TSK-### commits"], "15–30 min per PR", ["PR size (lines)", "Time from tasks done to PR"], ["PR size vs review time — delivery metrics"]],
    "review.codereview": ["Code review record → 4.4.4 Merge on Green & Build the Increment", ["Creates CR-### linked to PR-###"], "Within 1 working day; under an hour each", ["Time to first review", "Review rounds per PR", "Findings by kind"], ["Defects found in review by kind — coding standards"]],
    "review.analysis": ["Quality gate result → 4.4.4 Merge on Green & Build the Increment", ["Findings linked to PR-### and later BLD-###"], "Minutes per run", ["Gate failures by type", "Suppressions per sprint", "Open findings and age"], ["Recurring findings — coding standards and learning log"]],
    "review.merge": ["Build record, SBOM, provenance & staging record → 4.6.4 Check the Definition of Done", ["Creates BLD-### linking PR-###, run #, SBOM-### and provenance; staging record links ENV-03"], "Under 1 hour from approval to staged", ["Approval → staged time", "Queue ejections", "Staging walk-through failures"], ["Staging failures and ejections — delivery metrics and learning log"]],
    "devtest.testmap": ["Criterion-to-test map → 4.5.2 Write Unit Tests; end-to-end criteria → VERIFY", ["AC-n of STY-### → test names"], "30–60 min per story", ["Criteria mapped (target 100%)", "Criteria flagged untestable"], ["Criteria hard to test — fed back to refinement"]],
    "devtest.unit": ["Unit test results & coverage → 4.5.3 Write Integration & Contract Tests", ["Test names reference AC-n"], "With the code", ["Changed-line coverage", "Mutation score on critical modules"], ["Defects that escaped unit tests — learning log"]],
    "devtest.integration": ["Integration & contract results → 4.5.4 Keep the Suite Fast & Trustworthy", ["Contract versions linked to PR-### and BLD-###"], "½–1 day per story touching a seam", ["Seams tested vs touched", "Contract breaks caught before merge"], ["Integration defects found later in VERIFY — learning log"]],
    "devtest.suite": ["Developer test evidence → 4.6.4 Check the Definition of Done", ["Results linked by run # to BLD-###"], "1 hour per sprint plus fixes", ["PR suite duration", "Flaky tests in quarantine", "Re-runs per week"], ["Causes of flakiness — learning log"]],
    "docs.devdocs": ["Technical documentation & changelog → 4.6.4 Check the Definition of Done", ["Creates DOC-### pages linked to STY-### and ADR-###"], "With each PR", ["PRs merged with stale docs (target 0)", "Broken links found"], ["Questions new developers still ask — learning log"]],
    "docs.api": ["API reference → 4.6.4 Check the Definition of Done; consuming teams", ["Contract version → BLD-### → DOC-###"], "Minutes (generated) plus examples", ["Endpoints without examples (target 0)", "Consumer questions after publishing"], ["Consumer questions — learning log"]],
    "docs.runbook": ["Runbook → 4.6.4 Check the Definition of Done; RELEASE and OPERATE", ["Each alert → runbook section → STY-###"], "½ day per feature including dry run", ["Alerts with runbook actions (target 100%)", "Dry-run steps that failed"], ["Runbook gaps found in incidents — fed back from OPERATE"]],
    "docs.done": ["DoD record & increment hand-off pack → VERIFY (Act V)", ["Creates DOD-### linking STY-###, BLD-###, PR-###, CR-###, DOC-###"], "15–30 min per story", ["Stories done first time vs returned", "DoD items most often unmet", "Hand-offs rejected by VERIFY"], ["DoD failures — sprint retrospective and learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; stopped work leaves a re-plan record ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "Risk past tolerance → halt the story, re-plan record with the reason, learning log entry; abandoned branches closed with a reason";
  ACT.routing.stop = "Risk past tolerance → halt, re-plan with a reason, learning log";
  P("iteration").contract.routing.stop = "Goal obsolete → sprint cancelled by the product owner; re-plan record and learning log entry; unfinished stories return to the product backlog";
  ACT.contract.cases.alternates.push("Hotfix from OPERATE → enters the sprint through a re-plan, built and reviewed with the same gates");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most product teams: a shared codebase, sprints of one to two weeks, staging plus production, moderate risk.", skip: [], condense: {}, add: {} },
    light: { when: "Solo or small team, internal tool or early product, low data sensitivity, easy to roll back.",
      skip: ["build.implement.flags", "build.devtest.suite"],
      condense: { "build.pipeline": "One pipeline template: build, test, scan, deploy to one staging environment", "build.pipeline.secrets": "Secrets manager and secret scanning only; rotation yearly", "build.pipeline.supply": "Dependency scanning and an SBOM; provenance later", "build.iteration": "Weekly plan on one board; goal plus a short commitment note", "build.devtest.testmap": "Criteria listed in the PR with their tests", "build.docs.api": "Generated reference only", "build.docs.runbook": "One-page runbook for the main alerts" },
      add: {} },
    rigorous: { when: "Regulated or safety-relevant domain, sensitive or financial data, many teams, or contractual security obligations.",
      skip: [], condense: {},
      add: { "build.pipeline.supply": "SLSA Build L3, signed commits and a licence review by legal for every new dependency", "build.pipeline.secrets": "Quarterly access reviews and rotation evidence kept for audit", "build.review.codereview": "Two approvals; security champion approval on security-sensitive paths", "build.review.analysis": "DAST on staging and ASVS L2 checklist evidence per release", "build.devtest.unit": "Mutation testing gate on critical modules", "build.docs.done": "DoD records retained as audit evidence; QA lead countersigns", "build.iteration.replan": "Re-plans affecting regulated scope approved by the sponsor" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["STY", "Story (from DESIGN)", "backlog-item"], ["ENV", "Environment", "environment-catalogue"], ["PIPE", "Pipeline definition", "pipeline-definition"], ["SPR", "Sprint commitment", "sprint-commitment"], ["TSK", "Task", "task-breakdown"], ["PR", "Pull request", "pull-request"], ["CR", "Code review", "code-review-record"], ["BLD", "Build", "build-record"], ["SBOM", "Software bill of materials", "sbom"], ["DOC", "Technical document", "tech-docs"], ["DOD", "Definition of Done record", "dod-record"], ["LRN", "Learning", "learning-log"]];
})();
