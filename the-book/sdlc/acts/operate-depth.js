/*
 * ACT VII — OPERATE · continuity, handoffs, stop policy, tailoring and the trace chain.
 * Status: draft (awaiting review). Loaded after acts/operate.js.
 *
 *  - Extra workflows where one per subprocess was not enough
 *  - Workflow handoffs naming the artifact and the receiving unit (including EVOLVE and BUILD)
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log; a freeze is lifted only by the service owner
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.operate;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const command = SP("incident", "command");
  command.workflows.push(W("send-updates", "Keep Stakeholders Informed",
    [["s1", "Draft the update from the timeline", "Communications lead", "Incident status update"], ["s2", "Commander checks facts & next-update time", "Incident commander", ""], ["d1", "Customers affected?", "Communications lead", "", true], ["s3", "Post the status page & customer notice", "Communications lead", "Customer notice"], ["s4", "Brief service desk, sponsor & ops manager", "Communications lead", "Stakeholder update"]],
    [["d1", "s4", "alternate", "Internal only → brief internal stakeholders"], ["s2", "s1", "rework", "Facts wrong or speculative → redraft"], ["s3", "authority", "escalate", "Legal or contractual wording → service owner & legal"]],
    { short: "Updates", definition: "On a fixed cadence, tell everyone affected what is known, what is being done and when the next update comes — in plain language, never speculation.", inputs: ["Incident record", "Incident timeline"], preconditions: ["Commander and communications lead named"], actors: ["Communications lead", "Incident commander", "Service owner", "Legal"],
      decisions: ["Are customers affected, so the status page and customer notice are needed?"], cases: ["Customer-facing outage", "Internal-only degradation"], branches: ["Customers → status page and notice", "Internal → brief stakeholders only", "Facts wrong → redraft", "Legal wording → service owner and legal"],
      failures: ["Updates stop when people are busy", "Speculating about cause in public"], recovery: ["Communications lead owns the clock, not the responders", "Correct publicly in the next update"], rework: "Facts wrong or speculative → redraft",
      criteria: ["Plain language", "States impact, action and next-update time"], checks: ["Commander checks facts"], evidence: ["Incident timeline"], gate: "Update sent on time",
      outputs: ["Incident status update", "Customer notice", "Stakeholder update"], exit: ["Every update sent on cadence until resolution"], handoff: "Status updates → service desk, sponsor, ops manager and affected customers; final update → 7.2.4 postmortem",
      traceability: ["Every update logged on INC-### with time and audience"], learning: ["Update cadence kept vs missed — learning log"],
      uses: { s1: ["Status page", "Incident channel"], s2: ["Incident Command System"], d1: ["Impact–urgency matrix"], s3: ["Status page"], s4: ["ITIL 4 — incident management", "Single accountable owner"] },
      lensUses: { s1: ["cust: Impact in users' terms, not system names."], s2: ["ops: No speculation about cause."], d1: ["cust: Who outside the company is affected?"], s3: ["sup: Service desk sees the notice before customers call.", "biz: Key customers called personally for Sev-1."], s4: ["dom: Ops manager told which orders and sites are affected."] } }));
  command.loops = [["send-updates", "set-severity", "rework", "Updates reveal a severity change"]];
  command.contract.artifacts.outputs.push("Customer notice");

  const budget = SP("observe", "budget");
  budget.workflows.push(W("ops-review", "Run the Monthly Operations Review",
    [["s1", "Assemble the review pack", "SRE lead", "Operations review pack"], ["s2", "Review SLOs, incidents, problems, support, capacity & security", "Service owner", "Operations review minutes"], ["d1", "Signals that need work?", "Service owner", "", true], ["s3", "Raise problem records & backlog items", "Problem manager", "Problem record"], ["s4", "Send the signal pack to EVOLVE", "SRE lead", "Operations signal pack"]],
    [["d1", "s4", "alternate", "Nothing new → send signals only"], ["s2", "s1", "rework", "Pack incomplete → complete it"], ["s3", "authority", "escalate", "Work competes with roadmap → product owner & sponsor"]],
    { short: "Ops Review", definition: "Once a month, look at the whole service at once — SLOs, incidents, problems, support, capacity, cost and security — decide what needs work, and send the signals to EVOLVE.", inputs: ["Error-budget report", "Incident records", "Problem record", "Support report", "Cost-to-serve report", "Security posture report"], preconditions: ["Monthly reports published"], actors: ["SRE lead", "Service owner", "Problem manager", "Product owner", "Support lead", "Security lead"],
      decisions: ["Do any signals need new work?"], cases: ["Quiet month", "Freeze in force"], branches: ["Signals need work → problem records and backlog items", "Nothing new → send signals only", "Competes with roadmap → product owner and sponsor"],
      failures: ["Review becomes a status meeting with no decisions", "Signals never reach EVOLVE"], recovery: ["Every agenda item ends in a decision or 'no action'", "Signal pack is the meeting's required output"], rework: "Pack incomplete → complete it before the meeting",
      criteria: ["Every signal has a decision", "Postmortem actions reviewed"], checks: ["Pack completeness check"], evidence: ["Operations review minutes"], gate: "Operations review held",
      outputs: ["Operations review minutes", "Problem record", "Operations signal pack"], exit: ["Decisions recorded; signal pack sent"], handoff: "Operations signal pack → EVOLVE; problem records → 7.3; backlog items → PLAN",
      traceability: ["Minutes link every EBR, INC, PRB, SR, CAP and VUL discussed"], learning: ["Decisions from the review that changed the roadmap — learning log"],
      uses: { s1: ["Monitoring platform"], s2: ["Operations review", "Trend analysis"], d1: ["Signals are not defects", "Decide explicitly"], s3: ["Decision log"], s4: ["ISO/IEC 20000-1 — service reporting"] },
      lensUses: { s1: ["ops: One pack, every operational view."], s2: ["rel: Which SLOs are at risk?", "prod: Which signals are product questions, not bugs?"], d1: ["gov: Every signal ends in a decision."], s3: ["prod: Work ranked in the one backlog."], s4: ["biz: Outcome readings reach EVOLVE on time."] } }));
  budget.loops = [["ops-review", "budget-review", "rework", "Review disputes the budget attribution"]];
  budget.contract.artifacts.outputs.push("Operations review minutes", "Operations signal pack");
  P("observe").contract.artifacts.outputs.push("Operations signal pack");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "set-slos": "SLO specification & error-budget policy → 7.1.2 Instrument & Build Dashboards",
    "instrument-service": "Service dashboard, telemetry catalogue & updated runbook → 7.1.3 Alert on SLO Burn",
    "tune-alerts": "Alert rules & on-call rota → 7.1.4 Track the Error Budget and 7.2.1 Detect & Log",
    "budget-review": "Error-budget report & signal digest → Run the Monthly Operations Review and EVOLVE; release freeze notice → RELEASE (Go / No-Go)",
    "ops-review": "Operations signal pack → EVOLVE (Act VIII); problem records → 7.3.1; backlog items → PLAN",
    "declare-incident": "Incident record → 7.2.2 Classify & Command",
    "set-severity": "Incident record & command roster → 7.2.3 Mitigate & Restore and Keep Stakeholders Informed",
    "send-updates": "Status updates → service desk, sponsor and customers; final update → 7.2.4 Run the Blameless Postmortem",
    "restore-service": "Resolved incident record & timeline → 7.2.4 Run the Blameless Postmortem; hotfix request → BUILD (expedited iteration item)",
    "write-postmortem": "Postmortem & problem record → 7.3.1 Identify & Log Problems; actions → BUILD; learning → EVOLVE",
    "find-problems": "Problem record → 7.3.2 Investigate Root Cause",
    "investigate": "Problem record with root cause & investigation → 7.3.3 Record Known Errors & Workarounds",
    "publish-known-error": "Known-error record → 7.3.4 Rank & Resolve in the Backlog; KB article & briefing → 7.4.3 Triage Questions & Feedback",
    "rank-fix": "Problem fix as a product backlog entry → PLAN (ranking) and BUILD; fix verification → EVOLVE",
    "set-path-to-help": "Service catalogue & support model → 7.4.2 Fulfil Service Requests and 7.4.3 Triage Questions & Feedback",
    "fulfil-request": "Closed service request → support report; repeat requests → EVOLVE as automation candidates",
    "route-contact": "Feedback record → product owner (PLAN) and EVOLVE; incident record → 7.2.1; repeat-contact trend → 7.3.1",
    "kcs-article": "Knowledge-base article → service desk and self-service; search gaps → EVOLVE",
    "forecast-demand": "Demand forecast → 7.5.2 Plan & Test Capacity",
    "capacity-plan": "Capacity plan & load-test results → 7.5.3 Measure Cost to Serve; change requests → RELEASE change enablement",
    "cost-to-serve": "Cost-to-serve report → 7.5.4 Right-size & Optimise and EVOLVE",
    "right-size": "Verified savings & optimisation log → cost-to-serve report and EVOLVE",
    "triage-vuln": "Hotfix request → BUILD; verified vulnerability register → 7.6.4 Review Access & Posture",
    "tune-detections": "Detection rule catalogue → 7.6.3 Respond to Security Incidents",
    "contain-threat": "Security event record & security postmortem → 7.3 Problem Management; breach notification → DPO record; fixes → BUILD",
    "access-review": "Security posture report → EVOLVE and compliance",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Signals — error-budget report, postmortems, problem records, routed feedback, cost and posture reports — → EVOLVE (Act VIII); problem fixes → product backlog (PLAN); hotfixes → BUILD", ["Creates the SLO → ALR → INC → PM → PRB → KE chain, plus SR, CAP, VUL and EBR", "Every INC links the SLO it hurt and the DEP it followed; every PRB links its INC and PM; every fix links back to its PRB"], "Continuous while the service is live; monthly error-budget review and operations review; quarterly capacity and access reviews", ["SLO attainment and error budget consumed", "Time to restore service (DORA)", "Repeat incidents per quarter", "First-contact resolution", "Cost to serve per order", "Vulnerabilities past SLA"], ["Every postmortem and stop lands in the learning log", "Operations review sends signals to EVOLVE monthly", "Patterns across incidents reviewed quarterly"]],
    observe: ["SLOs, dashboards and alerts → 7.2 Incident Management; error-budget report & signal pack → EVOLVE; freeze notice → RELEASE", ["Creates SLO-##, ALR-## and EBR-YYYY-MM; EBR links SLO, INC and DEP"], "SLOs in 2–4 weeks after go-live; then continuous; budget review monthly", ["Share of SLOs met", "Pages per on-call shift", "Incidents first detected by users rather than alerts"], ["SLO revisions and their reasons — learning log"]],
    incident: ["Postmortems & problem records → 7.3 Problem Management; hotfix requests → BUILD; learning → EVOLVE", ["Creates INC-### and PM-###; INC links ALR or SR, DEP and the hotfix STY"], "Minutes to hours per incident; postmortem within 5 working days", ["Time to detect", "Time to restore", "Postmortem actions done within 30 days"], ["Postmortem patterns — learning log, reviewed quarterly"]],
    problem: ["Problem fixes → product backlog (PLAN / BUILD); known errors → 7.4 Support; verified closures → EVOLVE", ["Creates PRB-### and KE-###; PRB links INC, PM and the FEA / STY that fixed it"], "Days to weeks per problem; investigations timeboxed at 10 working days", ["Repeat incidents", "Problems closed per quarter", "Age of open known errors"], ["Causes found vs first suspected — learning log"]],
    support: ["Feedback & signals → product owner and EVOLVE; incidents → 7.2; repeat contacts → 7.3", ["Creates SR-### carrying its triage decision and the INC, PRB or FEA it became"], "Continuous; SLAs per the service catalogue; support report monthly", ["First-contact resolution", "Requests within SLA", "Feedback records with a product decision"], ["Misrouted contacts and search gaps — learning log"]],
    capacity: ["Capacity plan and cost-to-serve report → EVOLVE and the operations review; changes → RELEASE change enablement", ["Creates CAP-YYYY-Q# (capacity) and CAP-YYYY-MM (cost); links forecast, CHG and savings"], "Quarterly and before each peak or site rollout; cost monthly", ["Headroom at peak", "Forecast error", "Cost per order vs target"], ["Forecast vs actual and estimate vs actual cost — learning log"]],
    secops: ["Security postmortems → 7.3; fixes → BUILD; posture report → EVOLVE and compliance", ["Creates VUL-###; security detections are ALR-## linked to THR-##; confirmed attacks become INC-###"], "Continuous; vulnerability SLA by risk; access review quarterly", ["Vulnerabilities past SLA", "Time to contain", "Unjustified access found"], ["How attacks got in and how they were found — learning log"]],
    "observe.sli": ["SLO specification & error-budget policy → 7.1.2 Instrument & Build Dashboards", ["Creates SLO-## linked to its journey and DESIGN's QAS-##"], "1–2 weeks after 28 days of data", ["SLOs revised in their first quarter", "Journeys without an SLO"], ["Targets that proved wrong — learning log"]],
    "observe.instrument": ["Service dashboard, telemetry catalogue & runbook link → 7.1.3 Alert on SLO Burn", ["Every metric and panel names its SLO-##"], "3–5 days", ["SLIs verified against raw events", "Telemetry cost per month"], ["Gaps found only during incidents — learning log"]],
    "observe.alert": ["Alert rules & on-call rota → 7.1.4 Track the Error Budget and 7.2 Incident Management", ["Creates ALR-## linked to SLO-## and a runbook step"], "2–4 days, then tuned monthly", ["Pages per shift", "Pages with no action", "Incidents missed by alerts"], ["Noisy and silent alerts — learning log"]],
    "observe.budget": ["Error-budget report & signal pack → EVOLVE; freeze notice → RELEASE", ["Creates EBR-YYYY-MM linking SLO-##, INC-### and DEP-###"], "½ day monthly, plus the operations review", ["Budget consumed per SLO", "Days frozen per quarter", "Burn attributed"], ["Freezes, causes and recovery time — learning log"]],
    "incident.detect": ["Incident record → 7.2.2 Classify & Command", ["Creates INC-### linked to ALR-## or SR-###"], "Minutes — declared within 10 minutes of a page", ["Time to detect", "Share detected by alerts vs users"], ["Detection gaps — learning log"]],
    "incident.command": ["Incident record, roster & updates → 7.2.3 Mitigate & Restore", ["Severity, roles and every update logged on INC-###"], "Commander on the bridge within 15 minutes", ["Time to commander", "Updates on cadence"], ["Severity changes after first call — learning log"]],
    "incident.restore": ["Resolved incident record → 7.2.4 Run the Blameless Postmortem; hotfix request → BUILD", ["INC-### links DEP-### rolled back and the hotfix STY-###"], "Target: Sev-1 within 1 h, Sev-2 within 4 h", ["Time to restore by severity", "Mitigations that made it worse"], ["Time to restore by mitigation type — learning log"]],
    "incident.postmortem": ["Postmortem & problem records → 7.3 Problem Management; actions → BUILD; learning → EVOLVE", ["Creates PM-### linked to INC-###; actions PM-###-A#; problems PRB-###"], "Within 5 working days of resolution", ["Postmortems on time", "Actions done within 30 days", "Repeat incidents from the same cause"], ["Cross-incident patterns — learning log"]],
    "problem.identify": ["Problem record → 7.3.2 Investigate Root Cause", ["Creates PRB-### linked to INC-###, PM-### and SR-###"], "Weekly, and after every postmortem", ["Problems found proactively vs reactively", "Duplicates merged"], ["Missed patterns — learning log"]],
    "problem.analyse": ["Problem record with root cause → 7.3.3 Record Known Errors & Workarounds", ["Root cause and evidence on PRB-###"], "Timebox 10 working days", ["Investigations within timebox", "Causes later disproven"], ["Suspected vs proven causes — learning log"]],
    "problem.knownerror": ["Known-error record → 7.3.4 Rank & Resolve; KB article → 7.4", ["Creates KE-### linked to PRB-###"], "1–3 days", ["Known errors with tested workarounds", "Workaround cost per month"], ["Workarounds that failed in use — learning log"]],
    "problem.resolve": ["Product backlog entry → PLAN / BUILD; fix verification → EVOLVE", ["PRB-### links the FEA / STY that fixed it and the KE-### retired"], "Ranked within a week; verified over one SLO window after release", ["Time from logged to verified", "Problems reopened"], ["Fixes that didn't stop recurrence — learning log"]],
    "support.channels": ["Service catalogue & support model → 7.4.2 and 7.4.3", ["Catalogue entries name the service and its SLO-##"], "1–2 weeks at go-live; reviewed quarterly", ["Contacts outside the front door", "Tiers with named people"], ["Where users still ask for help — learning log"]],
    "support.requests": ["Closed service requests → support report; repeat requests → EVOLVE", ["Creates SR-### linked to its catalogue entry and any CHG-###"], "Per the catalogue SLA (standard: same day)", ["Requests within SLA", "Re-fulfilled requests"], ["Requests worth automating — learning log"]],
    "support.triage": ["Feedback records → product owner and EVOLVE; incidents → 7.2; problems → 7.3", ["SR-### carries its triage decision and what it became"], "Answer or route within the response SLA", ["First-contact resolution", "Misrouted contacts"], ["Signals mistaken for defects — learning log"]],
    "support.knowledge": ["KB articles → service desk and self-service; search gaps → EVOLVE", ["Articles link SR-### and KE-###"], "Same day as the resolution; review every 6 months", ["Article reuse", "Searches with no result", "Stale articles"], ["Most reused articles — learning log"]],
    "capacity.demand": ["Demand forecast → 7.5.2 Plan & Test Capacity", ["Forecast filed under CAP-YYYY-Q#"], "2–3 days per quarter", ["Forecast error at peak"], ["Forecast vs actual — learning log"]],
    "capacity.plan": ["Capacity plan & load-test results → 7.5.3; changes → RELEASE change enablement", ["CAP-YYYY-Q# links the forecast and each CHG-###"], "1–2 weeks before each peak or site rollout", ["Headroom at peak", "Saturation incidents"], ["What saturated first — learning log"]],
    "capacity.cost": ["Cost-to-serve report → 7.5.4 and EVOLVE", ["CAP-YYYY-MM compared with the DISCOVER cost estimate (DEC-012)"], "1–2 days monthly", ["Cost per order", "Spend allocated"], ["Estimate vs actual run cost — learning log"]],
    "capacity.optimise": ["Verified savings → cost-to-serve report and EVOLVE", ["Each saving links its CHG-### and CAP report"], "Monthly, a few days per optimisation", ["Savings verified vs estimated", "Optimisations rolled back"], ["Savings that hurt reliability — learning log"]],
    "secops.vulns": ["Hotfix requests → BUILD; register → 7.6.4 and EVOLVE", ["Creates VUL-### linked to CVE, SBOM component, STY and DEP"], "Per SLA: 72 h known-exploited critical · 7 d critical · 30 d high · 90 d medium", ["Vulnerabilities past SLA", "Mean time to remediate"], ["Time to remediate by severity — learning log"]],
    "secops.monitor": ["Detection rule catalogue → 7.6.3 Respond to Security Incidents", ["Security detections are ALR-## linked to THR-##"], "Days per use case; tested monthly", ["High threats with a tested detection", "False-positive rate"], ["Threats found by people, not rules — learning log"]],
    "secops.respond": ["Security postmortem → 7.3; fixes → BUILD; notification record → DPO", ["Confirmed attacks become INC-### (security) linked to ALR-##"], "Contain within 1 h of confirmation; notification decision within 72 h", ["Time to contain", "Notifications on time"], ["Entry points and detection sources — learning log"]],
    "secops.posture": ["Security posture report → EVOLVE and compliance", ["Posture report links VUL-### and the quarter's access review"], "Quarterly, about a week", ["Unjustified access found", "Secrets past rotation"], ["How excess access arose — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; a freeze is lifted only by the service owner ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "Budget spent → feature releases frozen; only reliability fixes and security patches ship until the SLO recovers and the service owner lifts the freeze — recorded in the learning log";
  ACT.routing.stop = "Budget spent → freeze feature releases until the SLO recovers; recorded in the learning log";
  P("observe").contract.routing.stop = "Budget spent → freeze feature releases; the service owner lifts the freeze when the SLO is back within target — recorded in the learning log";
  ACT.contract.cases.alternates.push("Freeze lifted early by the service owner for a fix that restores reliability — reason recorded");
  ACT.contract.artifacts.outputs.push("Learning log");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most live services: internal or B2B users, several sites, moderate impact when it fails.", skip: [], condense: {}, add: {} },
    light: { when: "A low-risk internal tool: one site, a few users, small blast radius, no personal data beyond staff names.",
      skip: ["operate.capacity.demand", "operate.capacity.optimise"],
      condense: { "operate.observe.sli": "One SLO per critical journey; budget policy in a paragraph", "operate.observe.alert": "One fast-burn page and one slow-burn ticket per SLO", "operate.incident.command": "On-call engineer also commands Sev-2 and below", "operate.incident.postmortem": "Short review in the incident record for all but Sev-1", "operate.problem": "Problems kept as backlog items with root-cause and workaround fields", "operate.support": "One shared channel with a rota; KB as a single FAQ page", "operate.capacity.cost": "Quarterly cost check against the estimate", "operate.secops.posture": "Half-yearly access review" },
      add: {} },
    rigorous: { when: "Customer-facing or regulated service, many sites, personal or payment data, or an external SLA.",
      skip: [], condense: {},
      add: { "operate.observe.sli": "SLOs reviewed by an independent reliability review and tied to external SLAs", "operate.observe.budget": "Freeze decisions recorded at the change advisory forum", "operate.incident.restore": "Dual control on every production command", "operate.incident.postmortem": "Postmortems for Sev-3 with customer impact; reviewed by the risk forum", "operate.problem.resolve": "Problem closure signed by the service owner", "operate.capacity.plan": "Load test before every peak and every site rollout", "operate.secops.monitor": "24/7 monitoring by a SOC or managed detection provider", "operate.secops.respond": "Annual breach exercise with legal and the DPO", "operate.secops.posture": "Independent sample of recertifications by internal audit" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["SLO", "Service level objective", "slo-spec"], ["ALR", "Alert / detection", "alert-rules"], ["INC", "Incident", "incident-record"], ["PM", "Postmortem", "postmortem"], ["PRB", "Problem", "problem-record"], ["KE", "Known error", "known-error"], ["SR", "Service request / contact", "service-request"], ["CAP", "Capacity & cost report", "capacity-report"], ["VUL", "Vulnerability", "vulnerability-register"], ["EBR", "Error-budget report", "error-budget-report"], ["LRN", "Learning", "learning-log"]];
})();
