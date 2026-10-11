/*
 * ACT V — VERIFY · extra workflows, handoffs, continuity, stop policy, tailoring and
 * the trace chain. Status: draft (awaiting review). Loaded after acts/verify.js.
 *
 *  - Extra workflows where one per subprocess was unrealistic
 *  - Workflow handoffs naming the artifact and the receiving unit (including RELEASE)
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log; a fail names where work goes
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.verify;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const reliability = SP("nonfunctional", "reliability");
  reliability.workflows.push(W("evaluate-accuracy", "Evaluate Extraction Accuracy",
    [["s1", "Freeze the labelled evaluation set", "ML engineer", "Test corpus"], ["s2", "Run extraction on the named build", "CI pipeline", "Accuracy results"], ["s3", "Measure by segment & check routing", "ML engineer", "Extraction accuracy evaluation"], ["d1", "Every segment meets QAS-03?", "QA lead", "", true], ["s4", "Log gaps as defects or residual risks", "QA lead", "Defect report"]],
    [["d1", "s4", "alternate", "Segment below target → defect or residual risk"], ["s4", "s2", "rework", "Model or rule fix → re-evaluate"], ["d1", "authority", "escalate", "Below target with no mitigation → risk owner"]],
    { short: "Accuracy", definition: "Measure field-level extraction accuracy of the named build on a frozen, labelled corpus, segment by segment, and prove low-confidence lines always reach a person.", inputs: ["Test corpus", "Quality-attribute scenarios", "Build under test"], preconditions: ["Evaluation set labelled twice and frozen", "Never used for tuning"], actors: ["ML engineer", "QA lead", "Risk owner", "Order team lead"],
      decisions: ["Does every segment meet the accuracy measure in QAS-03?"], cases: ["Handwritten annotations below target", "Confidence threshold changed in the build"], branches: ["All segments met → report", "Segment below target with mitigation → residual risk", "Below target without mitigation → escalate"],
      failures: ["Evaluation set leaked into tuning", "One average hides a weak segment"], recovery: ["Draw and label a fresh held-out set", "Report every segment separately"], rework: "Model or rule fix → re-run the evaluation on the new build",
      criteria: ["≥ 95% field accuracy per segment", "100% of lines under 90% confidence routed to review"], checks: ["Label agreement", "Routing check on every low-confidence line"], evidence: ["Accuracy results"], gate: "Accuracy Measured",
      outputs: ["Extraction accuracy evaluation"], exit: ["Every segment has a result; gaps logged"], handoff: "",
      traceability: ["NFT-05 → QAS-03 → TST-01/R1; gaps → DEF-### or RRA-###"], learning: ["Segments that drift in production — OPERATE watch list"],
      uses: { s1: ["Golden dataset", "ISO/IEC 25059 — evaluation data"], s2: ["CI pipeline", "Test against a named build"], s3: ["Model evaluation", "Confusion matrix", "Boundary value analysis"], d1: ["Evidence, not claims"], s4: ["Risk is owned, never implied", "Defect tracker"] },
      lensUses: { s1: ["ai: Held out, labelled twice, frozen.", "data: Segments match the real order mix."], s2: ["qa: The same build that will ship."], s3: ["ai: Accuracy by segment, not one average.", "dom: Field accuracy on quantities and prices matters most."], d1: ["rel: Low-confidence lines reach a person — 100%."], s4: ["gov: Gaps become defects or owned risks."] } }));
  reliability.contract.knowledge.methods.push("Model evaluation");
  reliability.contract.knowledge.techniques.push("Confusion matrix");
  reliability.contract.lenses.applicable.push("AI / ML");
  reliability.contract.artifacts.outputs.push("Extraction accuracy evaluation");
  reliability.loops = [["evaluate-accuracy", "inject-faults", "alternate", "Accuracy fix touches the review queue → re-inject queue faults"]];
  P("nonfunctional").contract.artifacts.outputs.push("Extraction accuracy evaluation");

  const gate = SP("defects", "gate");
  gate.workflows.unshift(W("accept-residual-risk", "Report and Accept Residual Risk",
    [["s1", "Compile open defects & unmet measures", "QA lead", "Defect & residual-risk report"], ["s2", "Rate each residual risk with its mitigation", "QA lead", "Residual-risk report"], ["d1", "Within the owner's authority to accept?", "Risk owner", "", true], ["s3", "Owner accepts with conditions & expiry", "Risk owner", "Risk acceptance"], ["s4", "Track in the risk register", "QA lead", "Risk register"]],
    [["d1", "authority", "escalate", "Above appetite → sponsor"], ["d1", "s1", "rework", "Mitigation unverified → verify first"], ["s3", "stop", "stop", "Owner refuses → fix or pull scope"]],
    { short: "Residual Risk", definition: "State everything known to be wrong or unproven, rate what it leaves, and have an owner with authority accept each risk with conditions and an expiry — or refuse it.", inputs: ["Defect log", "Non-functional results", "UAT sign-off", "Risk register"], preconditions: ["Triage current", "Fix–verify loops closed or decided"], actors: ["QA lead", "Risk owner", "Product owner", "Sponsor"],
      decisions: ["Is the residual risk within the owner's authority to accept?"], cases: ["Sev-3 accessibility defect for a single-site pilot", "Accuracy gap mitigated by human review"], branches: ["Within authority → accept with conditions", "Above appetite → sponsor", "Refused → fix or pull scope"],
      failures: ["A known issue left out of the report", "Acceptance without expiry"], recovery: ["Reconcile the report with the defect log and NFT results", "Add expiry and revisit trigger before signature"], rework: "Mitigation not verified → verify it first",
      criteria: ["Nothing known left out", "Every acceptance owned, conditioned and dated"], checks: ["Report reconciled with the defect log", "Owner's authority checked against the rating"], evidence: ["Risk acceptance record"], gate: "Residual Risk Owned",
      outputs: ["Defect & residual-risk report", "Risk acceptance"], exit: ["Every residual risk fixed, accepted or refused"], handoff: "",
      traceability: ["RRA-### → DEF-### / NFT-## → TST-01/R#"], learning: ["Accepted risks that materialised in OPERATE — learning log"],
      uses: { s1: ["Defect tracker", "ISO/IEC/IEEE 29119 — test completion"], s2: ["Risk matrix", "ISO 31000 — risk treatment and acceptance"], d1: ["Risk is owned, never implied", "Severity–priority triage"], s3: ["Risk acceptance", "Decision log"], s4: ["Risk register"] },
      lensUses: { s1: ["qa: Every open defect and unmet measure, nothing softened."], s2: ["gov: Residual rating after verified mitigation.", "sec: Security residuals rated with CVSS."], d1: ["gov: Owner's authority covers this rating."], s3: ["prod: Conditions limit scope (Rotterdam only, behind the flag)."], s4: ["ops: OPERATE can see what ships knowingly."] } }));
  gate.workflows.push(W("close-verification", "Close Verification & Capture Learning",
    [["s1", "Collect what verification found late", "QA lead", "Defect log"], ["s2", "Run the verification retrospective", "Delivery team", "Verification retrospective"], ["d1", "Anything to shift left?", "QA lead", "", true], ["s3", "Record changes with owners", "QA lead", "Learning log"]],
    [["d1", "s3", "alternate", "Nothing to shift left → record and close"]],
    { short: "Close & Learn", definition: "Whatever the gate decided, look at what was found late or escaped, decide what to move earlier, and record it with owners.", inputs: ["Quality gate record", "Defect log"], preconditions: ["Gate decided"], actors: ["QA lead", "Delivery team", "Product owner"],
      decisions: ["Is there anything to shift left into refinement, the DoR or the DoD?"], cases: ["Fail — retrospective still held", "Requirement gap found late"], branches: ["Changes → owners and learning log", "None → record and close"],
      failures: ["Retrospective skipped after a pass", "Changes without owners"], recovery: ["QA lead holds it before the next plan is approved", "Assign owners before closing"], rework: "Changes without owners → assign owners",
      criteria: ["Retrospective held", "Every change owned"], checks: ["Learning log updated"], evidence: ["Verification retrospective"], gate: "Verification Closed",
      outputs: ["Verification retrospective", "Learning log"], exit: ["Learning captured"], handoff: "",
      traceability: ["LRN-### → QGR-### / DEF-###"], learning: ["Retrospective changes checked at the next test plan"],
      uses: { s1: ["Defects cluster together", "Root cause analysis"], s2: ["Retrospective"], d1: ["Shift left"], s3: ["Decision log"] },
      lensUses: { s1: ["qa: Where were defects introduced and why found late?"], s2: ["eng: What would have caught it in BUILD?"], d1: ["req: Requirement gaps go back into refinement practice."], s3: ["gov: Each change has an owner."] } }));
  gate.loops = [["quality-gate", "accept-residual-risk", "rework", "Unowned residual risk → seek acceptance"], ["close-verification", "quality-gate", "rework", "Retro finds a gap in the record"]];
  gate.contract.knowledge.practices.push("Retrospective");
  gate.contract.artifacts.outputs.push("Verification retrospective", "Learning log");
  P("defects").contract.artifacts.outputs.push("Verification retrospective", "Learning log");
  ACT.contract.artifacts.outputs.push("Learning log");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "rate-quality-risks": "Quality risk analysis → 5.1.2 Define Levels, Types & Exit Criteria",
    "write-test-plan": "Test strategy & release test plan → 5.1.3 Provision Test Environments and 5.1.4 Prepare Test Data",
    "ready-environment": "Test environment record & smoke check → 5.2 Functional, 5.3 Non-Functional and 5.4 Acceptance",
    "prepare-corpus": "Test data plan & test corpus → 5.2.1 Design Test Cases and 5.3 Non-Functional Verification",
    "derive-cases": "Test cases traced to criteria & traceability matrix → 5.2.2 Automate & Run in CI",
    "run-in-ci": "Test-run evidence → 5.2.4 Regression & Verification Sign-off; failures → 5.5.1 Log & Classify Defects",
    "explore-session": "Exploratory session sheets → 5.2.4 Regression & Verification Sign-off; bugs → 5.5.1 Log & Classify Defects",
    "regress-and-sign": "Verification sign-off → 5.4 Acceptance & Validation and 5.5.4 Quality Gate",
    "run-load-test": "Performance test report → Non-functional results (5.5.4); bottlenecks → OPERATE capacity",
    "security-verify": "Security test report → Non-functional results (5.5.4); findings → 5.5.1 Log & Classify Defects",
    "a11y-audit": "Accessibility audit report → Non-functional results (5.5.4); failures → 5.5.1 Log & Classify Defects",
    "inject-faults": "Resilience test report → Non-functional results (5.5.4); runbook fixes → BUILD",
    "evaluate-accuracy": "Extraction accuracy evaluation → Non-functional results (5.5.4); gaps → 5.5.2 Triage or Report and Accept Residual Risk",
    "plan-uat": "UAT plan → 5.4.2 Run User Acceptance Tests",
    "run-uat": "UAT execution log → 5.4.3 Validate the Outcome; defects → 5.5.1; change requests → product backlog",
    "validate-outcome": "Outcome validation report → 5.4.4 Obtain Acceptance Sign-off; signals → OPERATE and EVOLVE",
    "sign-acceptance": "UAT sign-off → 5.5.4 Quality Gate",
    "log-defect": "Defect report → 5.5.2 Triage & Route Defects",
    "triage-defects": "Triage decisions → 5.5.3 Fix–Verify Loop (BUILD); requirement issues → PLAN; design flaws → DESIGN",
    "verify-fix": "Re-test results & verified defects → Report and Accept Residual Risk (5.5.4)",
    "accept-residual-risk": "Defect & residual-risk report & risk acceptances → Hold the Quality Gate",
    "quality-gate": "Quality gate record → RELEASE (Act VI) — Release Prep & Change Approval; on fail → BUILD / DESIGN / PLAN",
    "close-verification": "Verification retrospective & learning log → EVOLVE; DoR / DoD changes → BUILD and PLAN",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Quality gate record, quality evidence pack and risk acceptances → RELEASE (Act VI); defects → BUILD; requirement issues → PLAN; learning log and retrospective → EVOLVE", ["Creates the TST → TC → TR → NFT → UAT → DEF → RRA → QGR chain on top of STY", "Every QGR links its TST plan, the TR runs on the named build, NFT results, the UAT sign-off, open DEFs and RRAs", "Every TC traces to an acceptance criterion, its STY and its RQ"], "1–3 weeks per release, overlapping BUILD's sprints (Light ≈ 2–4 days · Rigorous 3–6 weeks)", ["Escaped defects — found after the Quality Gate, per release", "Change failure rate (DORA)", "Share of criteria with automated CI evidence", "Lead time from Done to gate decision", "Defects found per stage (shift-left trend)"], ["Verification retrospective at every gate", "Escapes traced back to the stage that should have caught them", "Patterns fed to EVOLVE and into the DoR / DoD"]],
    strategy: ["Quality risk analysis, test strategy, release test plan, ready environments and test data → 5.2, 5.3 and 5.4", ["Creates TST-01 (risk analysis, R# items) and TST-02 (plan) linking RQ, QAS, THR and DISCOVER's R-##"], "2–4 days", ["Risks rated high that produced defects (hit rate)", "Days from build announced to environment ready"], ["Exit criteria that proved ambiguous; environment gaps — learning log"]],
    functional: ["Test cases, test-run evidence and verification sign-off → 5.4 Acceptance and 5.5.4 Quality Gate; failures → 5.5", ["Creates TC-### (linked to AC, STY, RQ) and TR-#### (linked to TC and build)"], "Continuous through the release; 3–8 days of focused effort", ["Criteria with passing CI evidence", "Defects found here vs later", "Flaky-test rate"], ["Escaped regressions and flaky causes — learning log"]],
    nonfunctional: ["Non-functional results → 5.5.4 Quality Gate; findings → 5.5; capacity and failure modes → OPERATE", ["Creates NFT-## per QAS, linked to QAS-## and THR-##"], "3–10 days, partly overnight", ["Must QAS proven before the gate", "NFR-related incidents in the first 30 days of OPERATE"], ["Predicted vs production behaviour — OPERATE and EVOLVE"]],
    acceptance: ["UAT sign-off and outcome validation → 5.5.4 Quality Gate; signals → OPERATE / EVOLVE; change requests → product backlog", ["Creates UAT-## scenarios and the UAT sign-off; measures link to BRF and OPP"], "3–10 days including measurement", ["Scenarios accepted first time", "Outcome measures vs hypothesis"], ["Predicted vs observed value — EVOLVE"]],
    defects: ["Quality gate record → RELEASE; fixes → BUILD; requirement issues → PLAN; retrospective → EVOLVE", ["Creates DEF-###, RRA-### and QGR-###; QGR links everything the decision relied on"], "Daily throughout; gate in 1 day", ["Mean time from defect logged to verified", "Reopen rate", "Open Sev-1/2 at gate (target 0)", "Accepted risks that materialised"], ["Verification retrospective; accepted-risk outcomes tracked by OPERATE — learning log"]],
    "strategy.risk": ["Quality risk analysis → 5.1.2 Define Levels, Types & Exit Criteria", ["Creates TST-01 with R# items linking RQ, QAS, THR and R-##"], "½–1 day", ["Risks rated high that produced defects", "Risks found later that were missed here"], ["Missed risks — learning log"]],
    "strategy.approach": ["Test strategy & release test plan → 5.1.3 Provision Test Environments and 5.1.4 Prepare Test Data", ["Creates TST-02 linking every R# to a level, type and technique"], "1–2 days", ["Exit criteria changed after approval (target 0)", "Planned vs actual schedule"], ["Ambiguous exit criteria — learning log"]],
    "strategy.environments": ["Test environment record → execution in 5.2–5.4", ["Environment record names the build and TST-02"], "1–3 days", ["Days to ready", "Results invalidated by environment problems"], ["Environment differences that hid defects — learning log"]],
    "strategy.data": ["Test data plan & corpus → 5.2.1 Design Test Cases and 5.3", ["Data sets listed against the TC-### and NFT-## that use them"], "2–4 days", ["Cases blocked for lack of data", "Privacy incidents (target 0)"], ["Data gaps and masking issues — learning log"]],
    "functional.cases": ["Test cases & traceability matrix → 5.2.2 Automate & Run in CI", ["Creates TC-### linked to AC, STY and RQ"], "1–3 days per feature", ["Criteria without cases (target 0)", "Defects found by exploration that a case should have caught"], ["Criteria that needed a requirement issue — learning log"]],
    "functional.automate": ["Test-run evidence → 5.2.4 Regression & Verification Sign-off; failures → 5.5.1", ["Creates TR-#### linking TC-### and the build version"], "Continuous; minutes per run", ["Share of results with CI evidence", "Flake rate", "Pipeline duration"], ["Flake causes and fixes — learning log"]],
    "functional.explore": ["Session sheets → 5.2.4; bugs → 5.5.1", ["Sessions link charters to TST-01/R#; bugs to DEF-###"], "60–120 min per session; 1–2 days in total", ["Defects per session hour", "Charters added from clusters"], ["Charters that found most — learning log"]],
    "functional.regression": ["Verification sign-off → 5.4 and 5.5.4", ["Sign-off fingerprint covers every TC-### and TR-#### on the final build"], "½–1 day per build", ["Regressions caught here vs in UAT or production", "Re-signs caused by late changes"], ["Escaped regressions — learning log"]],
    "nonfunctional.performance": ["Performance test report → Non-functional results; bottlenecks → OPERATE", ["Creates NFT-01 linked to QAS-01"], "2–4 days incl. overnight soak", ["QAS met first run", "Production p95 vs test p95"], ["Predicted vs production performance — OPERATE feedback"]],
    "nonfunctional.security": ["Security test report → Non-functional results; findings → 5.5", ["Creates NFT-02 linked to THR-## and DEF-###"], "3–10 days incl. pen test", ["Open Critical/High at gate (target 0)", "Security findings after release"], ["Threats the model missed — DESIGN feedback"]],
    "nonfunctional.accessibility": ["Accessibility audit report → Non-functional results; failures → 5.5", ["Creates NFT-03 linked to QAS-05 and WCAG criteria"], "1–2 days", ["Criteria failed", "Accessibility complaints after release"], ["Failures a design review could have caught — DESIGN feedback"]],
    "nonfunctional.reliability": ["Resilience test report & accuracy evaluation → Non-functional results; runbook fixes → BUILD", ["Creates NFT-04 (QAS-02) and NFT-05 (QAS-03)"], "2–4 days", ["Faults where the hypothesis held", "Recovery time vs objective", "Accuracy by segment"], ["Failure modes we could not inject; drifting segments — OPERATE watch list"]],
    "acceptance.uatplan": ["UAT plan → 5.4.2 Run User Acceptance Tests", ["Creates UAT-## scenarios linked to JTBD and STY"], "1–2 days", ["Scenarios users found unrealistic"], ["Scenario realism — learning log"]],
    "acceptance.uat": ["UAT execution log → 5.4.3; defects → 5.5.1; change requests → product backlog", ["UAT-##.# results link DEF-### and FEA-###"], "2–5 days", ["Scenarios passed first time", "Issues misclassified"], ["Issues that were requirement gaps — learning log"]],
    "acceptance.validate": ["Outcome validation report → 5.4.4; signals → OPERATE / EVOLVE", ["Measures link to BRF-### and OPP-###"], "1–2 weeks of measurement, overlapping UAT", ["Outcome vs hypothesis", "Confidence of the measure"], ["Predicted vs observed value — EVOLVE"]],
    "acceptance.signoff": ["UAT sign-off → 5.5.4 Quality Gate", ["UAT sign-off lists conditions as DEF-### / RRA-###"], "½ day", ["Conditions met by their date"], ["Conditions that slipped — learning log"]],
    "defects.log": ["Defect report → 5.5.2 Triage & Route", ["Creates DEF-### linked to TC / UAT / NFT and the build"], "Minutes per defect", ["Reports returned for missing information", "Duplicate rate"], ["Defects users found that tests missed — learning log"]],
    "defects.triage": ["Triage decisions → 5.5.3; requirement issues → PLAN; design flaws → DESIGN", ["Each DEF-### decision links STY / RQ and an owner"], "15 minutes daily", ["Defects untriaged > 1 day (target 0)", "Severity disputes"], ["Where defects were introduced — learning log"]],
    "defects.fix": ["Verified defects & re-test results → 5.5.4", ["DEF-### → fix PR → build → TR-####"], "Hours to days per defect", ["Time logged → verified", "Reopen rate"], ["Root causes of Sev-1/2 — learning log"]],
    "defects.gate": ["Quality gate record → RELEASE (Act VI); retrospective & learning log → EVOLVE", ["Creates RRA-### and QGR-###; QGR links TST-02, TR, NFT, UAT, DEF and RRA; LRN-### from the retrospective"], "1–2 days incl. acceptances", ["Gate decisions reversed later", "Accepted risks that materialised", "Escapes per release"], ["Verification retrospective — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; a fail names where the work goes ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "Fail → quality gate record names where the work goes (BUILD, DESIGN or PLAN); unfit or rejected → stop — both recorded in the learning log";
  ACT.routing.stop = "Fail or rejected → recorded, routed back or stopped; learning log";
  P("defects").contract.routing.stop = "Gate fails → quality gate record with reasons and routes; work returns to BUILD, DESIGN or PLAN — recorded in the learning log";
  ACT.contract.cases.alternates.push("Accepted risk expires or its trigger fires → OPERATE raises it; re-verified before wider rollout");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most releases: new capability, moderate risk, users affected.", skip: [], condense: {}, add: {} },
    light: { when: "Small, reversible change behind a flag, no new screens, no change to load, data or security surface.",
      skip: ["verify.nonfunctional.performance", "verify.acceptance.validate"],
      condense: { "verify.strategy": "One-page plan: risks, levels and exit criteria together", "verify.strategy.environments": "Standing staging; smoke check only", "verify.functional.explore": "One 60-minute session on the riskiest area", "verify.nonfunctional.security": "Automated SAST, SCA and DAST only; pen test at the next major release", "verify.nonfunctional.accessibility": "Automated scan plus a keyboard check of changed screens", "verify.acceptance.uatplan": "Product owner demo with one or two users replaces a formal UAT plan", "verify.defects.gate": "Written gate decision by QA lead and product owner; no meeting" },
      add: {} },
    rigorous: { when: "Regulated domain, external users, personal or financial data, AI decisions or a hard-to-reverse release.",
      skip: [], condense: {},
      add: { "verify.strategy.risk": "Independent review of the risk analysis by risk and compliance", "verify.functional.cases": "Formal, peer-reviewed cases for every criterion", "verify.nonfunctional.security": "External pen test and re-test; per-requirement ASVS evidence retained", "verify.nonfunctional.accessibility": "Audit with disabled users; EN 301 549 conformance statement", "verify.nonfunctional.reliability": "Restore drill and a full failure game day", "verify.acceptance.validate": "Production pilot at one site for at least two weeks", "verify.defects.gate": "Gate with security and compliance sign-off; evidence retained for audit" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["STY", "Story (from BUILD)", "backlog-item"], ["TST", "Test risk analysis & plan", "release-test-plan"], ["TC", "Test case", "test-case"], ["TR", "Test run", "test-run-evidence"], ["NFT", "Non-functional test", "nft-summary"], ["UAT", "Acceptance scenario", "uat-plan"], ["DEF", "Defect", "defect-report"], ["RRA", "Residual-risk acceptance", "risk-acceptance"], ["QGR", "Quality gate record", "quality-gate-record"], ["LRN", "Learning", "learning-log"]];
})();
