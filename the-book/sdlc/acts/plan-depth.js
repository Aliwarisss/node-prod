/*
 * ACT II — PLAN · continuity, hand-offs, stop policy, tailoring and the trace chain.
 * Status: draft (awaiting review). Loaded after acts/plan.js.
 *
 *  - Extra workflows: requirement change control, and closing PLAN with learning
 *  - Workflow handoffs naming the artifact and the receiving unit (including DESIGN)
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log; a parked initiative needs a revisit trigger
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.plan;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const baseline = SP("requirements", "baseline");
  baseline.workflows.push(W("change-control", "Handle a Requirement Change",
    [["s1", "Log the change request", "Business analyst", "Requirement change request"], ["s2", "Analyse impact on scope, forecast & cost", "Business analyst", "Impact analysis"], ["d1", "Accept, defer or reject?", "Product manager", "", true], ["s3", "Update baseline & trace", "Business analyst", "Requirements baseline"], ["s4", "Notify affected owners", "Product manager", "Traceability matrix"]],
    [["d1", "s2", "rework", "Impact unclear → analyse again"], ["d1", "s4", "alternate", "Deferred → logged for the next horizon, owners told"], ["d1", "authority", "escalate", "Changes outcome, cost or date beyond tolerance → sponsor"], ["d1", "stop", "stop", "Rejected → reason recorded"]],
    { short: "Change Control", definition: "Once a baseline exists, every change is logged, its impact on scope, forecast and cost analysed, decided by the right person and traced.", inputs: ["Requirements baseline", "Traceability matrix"], preconditions: ["Baseline v1.0 approved"], actors: ["Business analyst", "Product manager", "Sponsor", "Engineering lead"],
      decisions: ["Accept, defer or reject the change?"], cases: ["Change from a stakeholder", "Change found by DESIGN or BUILD", "Regulatory change"], branches: ["Accept → update baseline", "Defer → next horizon", "Beyond tolerance → sponsor", "Reject → record reason"],
      failures: ["Baseline edited without a request", "Impact on forecast ignored"], recovery: ["Restore the last version and raise the request properly", "Re-run the forecast with the change"], rework: "Impact unclear → analyse again with engineering",
      criteria: ["Every change has a request, an impact and a decision"], checks: ["Version diff against the last baseline"], evidence: ["Requirement change request", "Impact analysis"], gate: "Change decided",
      outputs: ["Requirement change request", "Requirements baseline"], exit: ["Baseline version incremented or change rejected with reason"], handoff: "Updated baseline & trace → 2.2 Scope & Prioritisation and any downstream owner (DESIGN, BUILD)",
      traceability: ["Change request links RQ-### and the baseline version it changes"], learning: ["Change rate per month and its sources — learning log"],
      uses: { s1: ["Requirements change control"], s2: ["Requirements traceability", "Traceability matrix"], d1: ["Just enough, just in time"], s3: ["Requirements baselining", "Requirements management tool"], s4: ["Decision log"] },
      lensUses: { s1: ["req: Every change is a request, never a silent edit."], s2: ["prod: Impact on the MVP and the outcome.", "qa: Tests affected by the change."], d1: ["gov: Beyond tolerance goes to the sponsor."], s3: ["req: New baseline version with a diff."], s4: ["cust: Stakeholders whose needs changed are told."] } }));
  baseline.loops = [["change-control", "baseline-requirements", "rework", "Change reopens the baseline"]];
  baseline.contract.artifacts.outputs.push("Requirement change request");

  const commit = SP("invest", "commit");
  commit.contract.knowledge.practices.push("Retrospective");
  commit.workflows.push(W("close-plan", "Close PLAN & Capture Learning",
    [["s1", "Collect learning points", "Product manager", "Learning log"], ["s2", "Run the PLAN retrospective", "Product trio", "PLAN retrospective"], ["d1", "No-go or parked?", "Product manager", "", true], ["s3", "Set revisit trigger & owner", "Sponsor", "Park record"], ["s4", "Update the portfolio register", "Product manager", "Portfolio backlog entry"]],
    [["d1", "s4", "alternate", "Go / Phase → no revisit trigger"]],
    { short: "Close & Learn", definition: "Whatever the decision, capture what planning taught us, set a revisit trigger if parked, and update the portfolio so the initiative's status is true.", inputs: ["Commitment decision record"], preconditions: ["Decision recorded"], actors: ["Product manager", "Product trio", "Sponsor", "Portfolio board"],
      decisions: ["Was the initiative stopped or parked?"], cases: ["No-go — retrospective still held", "Park — revisit trigger required", "Phase — retro after tranche 1 too"], branches: ["Parked → set trigger", "Go / Phase → update portfolio"],
      failures: ["Retrospective skipped after a Go", "Park without a trigger"], recovery: ["Portfolio board requires the retro before tranche 2", "Default trigger: review in 90 days"], rework: "Changes without owners → assign owners",
      criteria: ["Retrospective held", "Every learning has an owner", "Park has a trigger"], checks: ["Learning log updated"], evidence: ["PLAN retrospective", "Learning log"], gate: "PLAN closed",
      outputs: ["Learning log", "PLAN retrospective", "Park record"], exit: ["Learning captured", "Portfolio register current"], handoff: "Learning log & PLAN retrospective → EVOLVE; committed initiative pack → DESIGN",
      traceability: ["Each learning LRN-### linked to CMT-##"], learning: ["Retrospective changes applied to the next PLAN"],
      uses: { s1: ["Decision log"], s2: ["Retrospective"], d1: ["Decide explicitly"], s3: ["Decision record"], s4: ["Portfolio register", "Stage-gate"] },
      lensUses: { s1: ["gov: Learning recorded against the commitment ID."], s2: ["prod: Which planning assumptions were weakest?", "fin: Estimate and case accuracy to check in EVOLVE."], d1: ["gov: Park needs an owner and a revisit trigger."], s3: ["biz: Trigger tied to a date or measurable condition."], s4: ["biz: Portfolio status matches the decision."] } }));
  commit.loops = [["close-plan", "commit", "rework", "Retro finds a gap in the record"]];
  commit.contract.artifacts.outputs.push("Learning log", "PLAN retrospective", "Park record");
  P("invest").contract.artifacts.outputs.push("Learning log", "PLAN retrospective");
  ACT.contract.artifacts.outputs.push("Learning log");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "derive-outcomes": "Outcome & success-criteria map & BRS → 2.1.2 Elicit Stakeholder & User Needs",
    "elicit-needs": "Stakeholder needs register → 2.1.3 Specify Functional & Non-Functional Requirements",
    "specify-requirements": "Requirements specification & quality-attribute drivers → 2.1.4 Trace, Validate & Baseline",
    "baseline-requirements": "Requirements baseline, traceability matrix & open questions log → 2.2 Scope & Prioritisation (and Handle a Requirement Change from now on)",
    "draw-mvp": "Scope statement & story map → 2.2.2 Decompose into Epics & Features",
    "decompose-initiative": "Initiative breakdown, feature briefs & product backlog → 2.2.3 Slice for Value & Learning",
    "slice-features": "Slice plan → 2.2.4 Order by Value (WSJF) and 2.3.1 Size the Work Relatively",
    "order-backlog": "Ordered product backlog & WSJF sheet → 2.3 Estimation & Capacity and 2.4.1 Map Dependencies & Constraints",
    "size-items": "Estimate sheet → 2.3.2 Establish Team Capacity",
    "plan-capacity": "Capacity plan → 2.3.3 Forecast with Ranges",
    "run-forecast": "Delivery forecast → 2.3.4 Reconcile Scope, Time & Capacity",
    "reconcile-plan": "Scope–time–capacity trade-off & re-forecast → 2.4 Roadmap & Release Planning",
    "map-dependencies": "Dependency register → 2.4.2 Build the Now / Next / Later Roadmap",
    "sequence-roadmap": "Release roadmap → 2.4.3 Plan Releases & Rollout",
    "plan-releases": "Release plan → 2.4.4 Publish & Align the Roadmap",
    "publish-roadmap": "Published roadmap & release plan → 2.5 Investment & Approval",
    "build-case": "Business case, benefits model & options appraisal → 2.5.2 Secure Funding & Resourcing",
    "secure-funding": "Funding request & confirmation → 2.5.3 Confirm Risk, Compliance & Conditions",
    "confirm-conditions": "Risk register, screenings & commitment conditions → 2.5.4 Make the Commitment Decision",
    "commit": "Commitment decision record & committed initiative pack → DESIGN (Act III) and Close PLAN & Capture Learning",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Committed initiative pack — requirements baseline, ordered backlog (EPC/FEA), estimates and capacity, forecast, roadmap and release plan, business case and commitment record → DESIGN (Act III); learning log and PLAN retrospective → EVOLVE", ["Carries BRF-### and INI-### from DISCOVER; creates the NEED → RQ → EPC/FEA → EST → RMP → BC → CMT chain", "Every CMT links back to its BC, the baseline version, RMP and BRF"], "2–5 weeks for an initiative (Light ≈ 3–5 days for a feature inside a funded product · Rigorous 6–10 weeks)", ["Lead time from brief accepted to commitment", "Forecast accuracy — 85% date met (checked in BUILD / RELEASE)", "Requirement change rate in the first month after baseline", "Benefit realised vs business case (checked in EVOLVE)"], ["PLAN retrospective at every commitment decision", "Estimate and forecast accuracy reviewed each quarter", "Case vs actuals fed to EVOLVE"]],
    requirements: ["Requirements baseline, traceability matrix and open questions log → 2.2 Scope & Prioritisation", ["Creates NEED-## and RQ-###; SC-n links to BRF-###"], "1–2 weeks", ["Requirements failing the 29148 review on first pass", "NFRs found later that were missed here", "Changes in the first month after baseline"], ["Missed requirements and their source — learning log"]],
    scope: ["Scope statement, ordered product backlog (EPC/FEA) and slice plan → 2.3 Estimation & Capacity and 2.4 Roadmap", ["Creates EPC-### and FEA-###, each linked to INI-### and RQ-###"], "3–5 days", ["Share of features cut to fit", "Out-of-scope items that crept back", "Slices that rolled over a sprint (BUILD)"], ["Slicing patterns that worked — learning log"]],
    estimate: ["Estimate sheet, capacity plan, delivery forecast and trade-off → 2.4 Roadmap & Release Planning and 2.5 Investment & Approval", ["Creates EST-## linked to FEA-### and slices"], "3–5 days", ["Forecast accuracy at 85%", "Estimate vs actual by item type", "Planned vs actual capacity"], ["Calibration of sizes and throughput — learning log"]],
    roadmap: ["Dependency register, release roadmap, release plan and briefing log → 2.5 Investment & Approval", ["Creates RMP-## linked to SC-n and FEA-###"], "3–5 days", ["Dependencies that slipped", "Items that changed horizon", "Releases that met their window"], ["Dependency surprises — learning log"]],
    invest: ["Commitment decision record and committed initiative pack → DESIGN; learning log and retrospective → EVOLVE", ["Creates BC-## and CMT-##; CMT links BC, the baseline version, RMP and RSK"], "1–2 weeks", ["Days from roadmap to commitment", "Tranche releases on evidence vs on schedule", "Business case vs realised benefit (EVOLVE)"], ["PLAN retrospective; park revisit dates tracked"]],
    "requirements.outcomes": ["Outcome & success-criteria map and BRS → 2.1.2 Elicit Stakeholder & User Needs", ["SC-n linked to BRF-###; BRS items linked to SC-n"], "1–2 days", ["Criteria with a verified baseline", "Criteria later found unmeasurable"], ["Unmeasurable criteria — learning log"]],
    "requirements.needs": ["Stakeholder needs register → 2.1.3 Specify Functional & Non-Functional Requirements", ["Creates NEED-## linked to SC-n and stakeholder group"], "2–4 days", ["Groups represented vs stakeholder map", "Needs found only by the negative question"], ["Silent stakeholders discovered later — learning log"]],
    "requirements.specify": ["Requirements specification and quality-attribute drivers → 2.1.4 Trace, Validate & Baseline", ["Creates RQ-### linked to NEED-##; each NFR linked to its ISO/IEC 25010 characteristic"], "3–5 days", ["First-pass 29148 review rate", "NFRs with numbers", "TBDs open at baseline"], ["Requirement defects found in DESIGN or VERIFY — learning log"]],
    "requirements.baseline": ["Requirements baseline, traceability matrix and open questions log → 2.2 Scope & Prioritisation", ["Baseline version links BRF → SC → NEED → RQ; change requests link RQ and version"], "1–2 days, then change control for the life of the initiative", ["Trace completeness", "Change requests per month", "Orphans and gaps found after baseline"], ["Change sources — learning log"]],
    "scope.mvp": ["Scope statement and story map → 2.2.2 Decompose into Epics & Features", ["MVP items linked to RQ-###"], "1 day", ["Out-of-scope items that crept back in"], ["MVP vs what users actually needed first — learning log"]],
    "scope.decompose": ["Initiative breakdown, feature briefs and product backlog → 2.2.3 Slice for Value & Learning", ["Creates EPC-### and FEA-### under INI-###"], "1–2 days", ["Coverage at first check", "Features later found to be layers"], ["Decomposition mistakes — learning log"]],
    "scope.slice": ["Slice plan → 2.2.4 Order by Value (WSJF) and 2.3.1 Size the Work Relatively", ["Slices linked to FEA-### and RQ-###"], "1–2 days", ["Slices passing the checklist first time", "Slices that rolled over a sprint (BUILD)"], ["Splitting patterns that worked — learning log"]],
    "scope.prioritise": ["Ordered product backlog and WSJF scoring sheet → 2.3 Estimation & Capacity and 2.4.1 Map Dependencies & Constraints", ["WSJF score recorded on each FEA-###"], "½–1 day, then at every roadmap review", ["Rank changes after delivery evidence", "Disputes escalated"], ["Scoring calibration — learning log"]],
    "estimate.size": ["Estimate sheet → 2.3.2 Establish Team Capacity", ["Creates EST-## linked to FEA-### or slice"], "½–1 day", ["Estimate vs actual by type", "Items spiked before sizing"], ["Size calibration — learning log"]],
    "estimate.capacity": ["Capacity plan → 2.3.3 Forecast with Ranges", ["Capacity plan versioned per planning horizon"], "½ day", ["Planned vs actual capacity", "Specialist availability met"], ["Capacity surprises — learning log"]],
    "estimate.forecast": ["Delivery forecast → 2.3.4 Reconcile Scope, Time & Capacity", ["Forecast links EST-## set and capacity-plan version"], "½ day, re-run every sprint review", ["85% date met", "Forecast range width"], ["Forecast vs actual — learning log"]],
    "estimate.reconcile": ["Scope–time–capacity trade-off and re-forecast → 2.4 Roadmap & Release Planning", ["Trade-off record links EST-##, FEA-### and the forecast version"], "½–1 day", ["Trade-offs revisited later", "Quality incidents traced to a trade-off"], ["Trade-offs that didn't hold — learning log"]],
    "roadmap.dependencies": ["Dependency register → 2.4.2 Build the Now / Next / Later Roadmap", ["Each dependency linked to FEA-### and its owner"], "1–2 days", ["Dependencies confirmed in writing", "Dependencies that slipped"], ["Dependency slips — learning log"]],
    "roadmap.horizons": ["Release roadmap → 2.4.3 Plan Releases & Rollout", ["Creates RMP-## linked to SC-n and FEA-###"], "1 day", ["Items that changed horizon"], ["Why items moved — learning log"]],
    "roadmap.release": ["Release plan → 2.4.4 Publish & Align the Roadmap", ["Each release linked to RMP-## and FEA-###"], "1 day", ["Releases on window", "Rollouts held at a site"], ["Rollout lessons per site — learning log"]],
    "roadmap.align": ["Published roadmap and briefing log → 2.5 Investment & Approval", ["Briefing log entries linked to RMP-##"], "1–2 days", ["Audiences briefed", "Objections and time to resolve"], ["Objections and how they were resolved — learning log"]],
    "invest.case": ["Business case, benefits model and options appraisal → 2.5.2 Secure Funding & Resourcing", ["Creates BC-## linked to OPP-###, EST-## and the forecast"], "2–4 days", ["Finance changes at review", "Benefit vs realised (EVOLVE)"], ["Benefit assumptions disproven — learning log"]],
    "invest.funding": ["Funding request and confirmation → 2.5.3 Confirm Risk, Compliance & Conditions", ["Funding linked to BC-## and INI-###; tranches linked to evidence milestones"], "2–5 days", ["Time from request to funds", "Tranches released on evidence"], ["Funding delays — learning log"]],
    "invest.conditions": ["Risk register, screenings and commitment conditions → 2.5.4 Make the Commitment Decision", ["RSK-## updated; conditions linked to owners and CMT-##"], "2–4 days", ["Conditions met on time", "Risks that materialised"], ["Conditions that failed — learning log"]],
    "invest.commit": ["Commitment decision record and committed initiative pack → DESIGN; learning log and retrospective → EVOLVE", ["Creates CMT-## and LRN-### linking BC, RQ baseline version, RMP and RSK"], "1–2 days", ["Days from pack to decision", "Commitments reversed later"], ["PLAN retrospective; park revisit dates — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; a parked initiative needs a revisit trigger ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "No-go → commitment record + learning log; Park → park record with a revisit trigger and owner";
  ACT.routing.stop = "Business case fails → No-go: commitment record, learning log; Park sets a revisit trigger";
  P("invest").contract.routing.stop = "No-go → record and notify; Park → park record with revisit trigger — both recorded in the learning log";
  ACT.contract.cases.alternates.push("Parked initiative → reopened when its revisit trigger fires; baseline, forecast and case re-checked before re-entry");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "A funded initiative of moderate size: a new capability, one or two teams, some uncertainty.", skip: [], condense: {}, add: {} },
    light: { when: "A feature or small change inside a funded product, one team, investment well inside the sponsor's limit.",
      skip: ["plan.roadmap.align", "plan.invest.funding"],
      condense: { "plan.requirements": "Outcomes, needs and requirements written straight into the feature in the backlog tool; NFRs still get numbers", "plan.requirements.baseline": "The feature's requirements are the baseline; change via the backlog", "plan.scope.decompose": "Feature only — no new epic", "plan.estimate": "Team sizes in refinement; forecast from throughput in one pass", "plan.roadmap.horizons": "Add the feature to the existing roadmap", "plan.invest.case": "One-paragraph value note in the feature", "plan.invest.commit": "Product owner's decision in the backlog, recorded with rationale" },
      add: {} },
    rigorous: { when: "Large or multi-team investment, regulated domain, external vendor on the critical path, or a hard-to-reverse commitment.",
      skip: [], condense: {},
      add: { "plan.requirements.specify": "Formal SRS with independent 29148 review; quality-attribute scenarios for every NFR", "plan.requirements.baseline": "Baseline signed by sponsor, architecture and compliance; formal change board", "plan.estimate.forecast": "Monte Carlo with and without each critical dependency; back-test published", "plan.roadmap.dependencies": "Contractual dates for every external dependency", "plan.invest.conditions": "Full DPIA and security assessment before commitment; legal review of vendor contract", "plan.invest.commit": "Decision taken by the portfolio board with an independent challenge" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["NEED", "Stakeholder need", "needs-register"], ["RQ", "Requirement", "requirements-spec"], ["EPC", "Epic", "product-backlog"], ["FEA", "Feature", "product-backlog"], ["EST", "Estimate", "estimate-sheet"], ["RMP", "Roadmap item", "release-roadmap"], ["BC", "Business case", "business-case"], ["CMT", "Commitment", "commitment-record"], ["LRN", "Learning", "learning-log"]];
})();
