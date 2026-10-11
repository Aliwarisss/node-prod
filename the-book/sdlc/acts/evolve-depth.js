/*
 * ACT VIII — EVOLVE · continuity, extra workflows, policy, tailoring and the trace chain.
 * Status: draft (awaiting review). Loaded after acts/evolve.js.
 *
 *  - Extra workflows where one per subprocess was unrealistic
 *  - Workflow handoffs naming the artifact and the receiving unit (incl. DISCOVER and PLAN)
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log; a stopped outcome is a
 *    recorded decision; a retirement ends only with a decommission record
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.evolve;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const review = SP("outcomes", "review");
  review.workflows.push(W("reconcile-value", "Reconcile Realised Value with Finance",
    [["s1", "Turn readings into benefit drivers", "Data analyst", "Benefits realisation"], ["s2", "Price each benefit", "Finance partner", "Realised value reconciliation"], ["s3", "Set cost to date alongside", "Finance partner", "Realised value reconciliation"], ["d1", "Finance agrees the realised value?", "Finance partner", "", true], ["s4", "Attach to the outcome report", "Product manager", "Outcome report"]],
    [["d1", "s1", "rework", "Driver disputed → re-derive from readings"], ["d1", "authority", "escalate", "Value far outside the range → sponsor"]],
    { short: "Reconcile Value", definition: "Turn the readings into money, agreed with finance, and set the realised run-rate against the value hypothesis and the cost to date.", inputs: ["Outcome readings log", "Opportunity brief"], preconditions: ["Readings complete for the value drivers"], actors: ["Data analyst", "Finance partner", "Product manager", "Sponsor"],
      decisions: ["Does finance agree the realised value?"], cases: ["Benefit only partly attributable to the change", "Only some sites live"], branches: ["Agreed → attach to report", "Disputed → re-derive", "Far outside range → sponsor"],
      failures: ["Benefits counted that the change did not cause", "Cost to date left out"], recovery: ["Use the comparison group to attribute", "Add cost to date from the finance ledger"], rework: "Disputed driver → re-derive from readings",
      criteria: ["Each benefit built from a reading", "Finance agreement"], checks: ["Comparison-group attribution"], evidence: ["Realised value reconciliation", "Review sign-offs"], gate: "Value agreed",
      outputs: ["Realised value reconciliation"], exit: ["Value agreed with finance"], handoff: "Realised value reconciliation → Run the Outcome Review (8.1.4) and 8.4 Portfolio Review",
      traceability: ["Each benefit line links its SC-# reading and BRF-### hypothesis line"], learning: ["Predicted vs realised value per benefit — learning log, back to DISCOVER sizing"],
      uses: { s1: ["Benefits realisation management", "Comparison group"], s2: ["Benefits realisation management"], s3: ["Decision log"], d1: ["Measure what was promised"], s4: ["Outcome review"] },
      lensUses: { s1: ["data: Benefits derived from recorded readings only."], s2: ["fin: Priced with finance's rates, as ranges."], s3: ["fin: Cost to date beside value."], d1: ["gov: Finance signs the figure."], s4: ["biz: Value set against the brief's hypothesis."] } }));
  review.loops = [["reconcile-value", "outcome-review", "rework", "Value figure changes the judgement"]];

  const identify = SP("debt", "identify");
  identify.workflows.push(W("eol-watch", "Watch End-of-Life Dates",
    [["s1", "List versioned dependencies & vendor components", "Engineering lead", "Service inventory"], ["s2", "Check support and end-of-life dates", "Engineer", "Tech-debt item"], ["d1", "End of support within 12 months?", "Engineering lead", "", true], ["s3", "Register as debt with deadline", "Engineering lead", "Tech-debt register"]],
    [["d1", "s1", "alternate", "Nothing due → re-check next quarter"], ["s2", "authority", "escalate", "Already unsupported with known vulnerabilities → security officer"]],
    { short: "End-of-Life Watch", definition: "Each quarter, check every versioned dependency and vendor component for end-of-support dates and register anything due within a year as debt with a deadline.", inputs: ["Service inventory", "Usage & operational signals"], preconditions: ["Dependency list or SBOM available"], actors: ["Engineering lead", "Engineer", "Security officer"],
      decisions: ["Does support end within 12 months?"], cases: ["Vendor gives no date", "Open-source project abandoned"], branches: ["Due → register with deadline", "Not due → re-check next quarter", "Already unsupported → security officer"],
      failures: ["Vendor notice missed", "Date known but not registered"], recovery: ["Subscribe to vendor notices; add to the quarterly check", "Register at once with cost of delay High"], rework: "Missing dates → ask the vendor and record the answer",
      criteria: ["Every component checked", "Due items registered with deadlines"], checks: ["Quarterly review"], evidence: ["Tech-debt register"], gate: "End-of-life checked",
      outputs: ["Tech-debt register"], exit: ["Due items registered"], handoff: "Tech-debt items with deadlines → 8.3.2 Assess Interest & Risk",
      traceability: ["TDR-### records the vendor notice and the end-of-support date"], learning: ["End-of-life dates found late — learning log"],
      uses: { s1: ["Static analysis", "ISO/IEC 14764 — maintenance types"], s2: ["Technical risk assessment"], d1: ["Make debt visible"], s3: ["Tech-debt register", "Technical debt quadrant"] },
      lensUses: { s1: ["vendor: Every vendor component and its contract."], s2: ["vendor: Support dates from the vendor, in writing.", "sec: Unsupported means no security fixes."], d1: ["rel: Plan before support ends, not after."], s3: ["eng: Deadline recorded on the item."] } }));
  identify.loops = [["eol-watch", "log-debt", "rework", "End-of-life items feed the next debt-finding session"]];
  identify.contract.artifacts.inputs.push("Service inventory");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "define-measures": "Outcome measurement plan → 8.1.2 Confirm Baselines & Instrumentation",
    "verify-instrumentation": "Baseline record & instrumentation check → 8.1.3 Record Outcome Readings",
    "take-readings": "Outcome readings log → 8.1.4 Hold the Outcome Review (and 8.2.2 for gap analysis)",
    "outcome-review": "Outcome report (OUT-###) → 8.4 Portfolio Review; gaps → 8.2.3 Triage into Improvement Items",
    "gather-signals": "Signal inventory → 8.2.2 Synthesise Insights",
    "synthesise-insights": "Insight synthesis → 8.2.3 Triage into Improvement Items; gap insights → 8.1.4 Hold the Outcome Review",
    "triage-insights": "Improvement items → PLAN (product backlog), DISCOVER (request), problem backlog or 8.3.1; → 8.2.4 Close the Feedback Loop",
    "close-loop": "Feedback responses → feedback-givers; cycle retrospective & learning log → 8.4 Portfolio Review and DISCOVER (Act I)",
    "log-debt": "Tech-debt register → 8.3.2 Assess Interest & Risk",
    "rank-debt": "Ranked register & debt interest assessment → 8.3.3 Plan Paydown & Modernisation",
    "plan-modernisation": "Modernisation plan → 8.4 Portfolio Review (funding) and PLAN (slices); → 8.3.4 Track Paydown & Fitness",
    "verify-paydown": "Debt paydown report → 8.4.1 Assemble the Portfolio Review Pack",
    "assemble-review-pack": "Portfolio review pack → 8.4.2 Evaluate Options",
    "evaluate-options": "Portfolio options appraisal → 8.4.3 Make the Portfolio Decision",
    "portfolio-decision": "Portfolio decision record (PDC-###) → 8.4.4 Re-rank & Route; retire → 8.5.1 Plan the Retirement",
    "route-next-cycle": "Request log entries (REQ-###) → DISCOVER (Act I); product backlog entries (FEA-###) → PLAN (Act II); re-ranked portfolio backlog → quarterly planning",
    "plan-retirement": "Retirement plan (RET-##) → 8.5.2 Notify & Transition Users",
    "transition-users": "Transition tracker → 8.5.3 Retain, Migrate or Dispose of Data",
    "data-disposition": "Data disposition record & certificates → 8.5.4 Decommission & Close",
    "switch-off": "Decommission record → 8.4 Portfolio Review (savings); learning log → DISCOVER and the next cycle",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Next-cycle opportunities → DISCOVER (Act I) as requests; small improvements and modernisation slices → PLAN (Act II); portfolio decision → quarterly planning; learning log → every act", ["Creates the OUT → INS → IMP → TDR → MOD → PDC → RET chain", "Every OUT links back to BRF, DEC and the SC-# it judges; every PDC links INI and OUT; new REQ and FEA link PDC and IMP — the cycle closes"], "Continuous; outcome review at each by-date (typically 90 days after go-live, then quarterly); portfolio review quarterly; a retirement 4–10 weeks", ["Share of initiatives with an outcome review at the by-date", "Realised vs hypothesised value", "Share of insights routed and done within a quarter", "Debt interest trend and DORA trend", "Run cost removed by retirements"], ["Cycle retrospective at each outcome review", "Learning log reviewed quarterly by the portfolio board", "Prediction accuracy fed back to DISCOVER sizing and PLAN estimates"]],
    outcomes: ["Outcome report & realised value → 8.4 Portfolio Review; gaps → 8.2", ["Creates OUT-### with readings OUT-### · R-##; links BRF-### and SC-#"], "Plan before release (1–2 days); readings on cadence; review ½–1 day at each by-date", ["Criteria judged at the by-date", "Readings missed or corrected", "Realised vs hypothesised value"], ["Hard-to-measure criteria and late instrumentation — learning log, for DISCOVER and DESIGN"]],
    insight: ["Insight synthesis & routed improvement items → PLAN, DISCOVER, problem backlog, 8.3; learning log → 8.4 and DISCOVER", ["Creates S-### signals, INS-## and IMP-###; IMP links the receiving FEA, REQ, PRB or TDR"], "Monthly cycle; synthesis 2–3 days; triage ½ day", ["Signals per insight", "Insights routed and accepted", "Improvement items done within a quarter"], ["Channels and methods that yielded the best insights — learning log"]],
    debt: ["Ranked register, modernisation plans and paydown report → 8.4 Portfolio Review; slices → PLAN", ["Creates TDR-### and MOD-##; MOD links TDR and its FEA / STY slices"], "Register continuous; ranking quarterly (½ day); plans 2–5 days", ["Debt interest per quarter", "Share of capacity spent on debt", "Items paid with fitness functions passing"], ["Recurring debt sources — learning log, for DESIGN and BUILD"]],
    portfolio: ["Portfolio decision → DISCOVER (requests), PLAN (improvements), 8.5 (retirements); re-ranked backlog → quarterly planning", ["Creates PDC-###; links INI-###, OUT-###, MOD-##; new REQ-### and FEA-### link PDC"], "Quarterly; pack 2–3 days; decision in the planning session", ["Initiatives reviewed per quarter", "Decisions reversed later", "Follow-ups acknowledged within a week"], ["Board decisions against the scores, and why — learning log"]],
    retire: ["Decommission record & savings → 8.4 Portfolio Review; lessons → learning log; the cycle closes", ["Creates RET-##; decommission record and certificates link RET-## and PDC-###"], "4–10 weeks from plan to close (notice periods set the floor)", ["Days from decision to switch-off", "Run cost removed", "Use found after switch-off"], ["Hidden dependants and data surprises — learning log"]],
    "outcomes.plan": ["Outcome measurement plan → 8.1.2 Confirm Baselines & Instrumentation", ["SC-# carried from BRF-### into the plan"], "1–2 days, before release", ["Brief criteria carried over unchanged", "Criteria with a named source"], ["Criteria that were hard to define — learning log, back to DISCOVER"]],
    "outcomes.baseline": ["Baseline record & instrumentation check → 8.1.3 Record Outcome Readings", ["Each baseline linked to SC-# and its query version"], "2–4 days", ["Metrics fit for judging", "Instrumentation defects found after go-live"], ["Instrumentation gaps — learning log, for DESIGN and BUILD"]],
    "outcomes.read": ["Outcome readings log → 8.1.4 Hold the Outcome Review", ["Readings OUT-### · R-## linked to SC-#"], "On cadence (weekly or monthly); ½ day per round", ["Readings on time", "Corrections recorded"], ["Confounders met — learning log"]],
    "outcomes.review": ["Outcome report & value reconciliation → 8.4 Portfolio Review; gaps → 8.2.3", ["Creates OUT-### linking BRF-###, DEC-### and every reading"], "½–1 day at each by-date; value reconciliation 1–2 days", ["Reviews held on time", "Realised vs hypothesised value"], ["Predicted vs realised value — learning log and DISCOVER"]],
    "insight.collect": ["Signal inventory → 8.2.2 Synthesise Insights", ["Creates S-### linking FB, INC, PRB and EBR source IDs"], "1–2 days per period", ["Channels covered", "Signals per channel"], ["Channels that matter most — learning log"]],
    "insight.synthesise": ["Insight synthesis → 8.2.3 Triage; gap insights → 8.1.4", ["Creates INS-## linking S-### and OUT-###"], "2–3 days per period", ["Insights passing peer review", "Insights later disproven"], ["Insights that contradicted DISCOVER — learning log"]],
    "insight.triage": ["Improvement items → PLAN, DISCOVER, problem backlog or 8.3; → 8.2.4", ["Creates IMP-### linking INS-## and the receiving FEA, REQ, PRB or TDR"], "½ day per period", ["Items accepted by receivers", "Orphan items"], ["Routing rules that needed changing — learning log"]],
    "insight.close": ["Learning log & cycle retrospective → 8.4 and DISCOVER", ["Creates LRN-### linking OUT-### / INS-##"], "½ day; cycle retrospective 2 h at each outcome review", ["Channels answered", "Learnings applied within a quarter"], ["Feedback volume after responses — learning log"]],
    "debt.identify": ["Tech-debt register → 8.3.2 Assess Interest & Risk", ["Creates TDR-### linking PRB, INC, retro or vendor notice"], "Continuous; debt-finding session 2 h per quarter", ["Items found before they cause incidents", "End-of-life dates found late"], ["Recurring debt sources — learning log"]],
    "debt.assess": ["Ranked register & interest assessment → 8.3.3 Plan Paydown & Modernisation", ["TDR-### score and rank recorded per quarter"], "½ day per quarter", ["Interest estimate vs actual", "Accepted debt revisited on time"], ["Estimate accuracy — learning log"]],
    "debt.plan": ["Modernisation plan → 8.4 and PLAN; → 8.3.4", ["Creates MOD-## linking TDR-### and FEA / STY slices"], "2–5 days per plan", ["Plans with measurable exit", "Slices releasable alone"], ["Approaches that worked — learning log"]],
    "debt.track": ["Debt paydown report → 8.4.1 Assemble the Portfolio Review Pack", ["Paid TDR-### links MOD-## slice and fitness-function run"], "Continuous; report quarterly", ["Items paid per quarter", "Interest removed", "Stalled migrations"], ["Stalled paydowns and why — learning log"]],
    "portfolio.pack": ["Portfolio review pack → 8.4.2 Evaluate Options", ["Pack links INI-###, OUT-###, INS-##, TDR-###, MOD-##"], "2–3 days before quarterly planning", ["Packs on time", "Evidence gaps the board found"], ["Evidence the board asked for — learning log"]],
    "portfolio.options": ["Options appraisal → 8.4.3 Make the Portfolio Decision", ["Each option cites OUT, INS, TDR or MOD IDs"], "1–2 days", ["Options considered per initiative (target 5)", "Recommendations overturned by challenge"], ["Options the board chose against the scores — learning log"]],
    "portfolio.decide": ["Portfolio decision record → 8.4.4 Re-rank & Route; retire → 8.5.1", ["Creates PDC-### linking INI-### and OUT-###"], "In the quarterly planning session", ["Decisions with a next-review trigger", "Decisions reversed later"], ["Decision quality reviewed at the next portfolio review — learning log"]],
    "portfolio.rerank": ["Requests (REQ-###) → DISCOVER; product backlog entries (FEA-###) → PLAN; retirements → 8.5", ["REQ-### and FEA-### link PDC-### and IMP-###; INI-### rank updated"], "In and up to a week after quarterly planning", ["Follow-ups acknowledged within a week", "Active initiatives vs WIP limit"], ["Time from decision to work starting — learning log"]],
    "retire.plan": ["Retirement plan → 8.5.2 Notify & Transition Users", ["Creates RET-## linking PDC-### and every CI"], "1–2 weeks (notice periods set the floor)", ["Dependants found after approval"], ["Late-found dependants — learning log"]],
    "retire.notify": ["Transition tracker → 8.5.3 Retain, Migrate or Dispose of Data", ["Each group links RET-## and its CI"], "The notice window — typically 4–8 weeks", ["Groups moved on time", "Exceptions owned"], ["Slowest groups and why — learning log"]],
    "retire.data": ["Data disposition record & certificates → 8.5.4 Decommission & Close", ["Certificates link RET-## and each data class"], "1–3 weeks", ["Classes verified", "Data found in unexpected places"], ["Unexpected data stores — learning log, for DESIGN's data design"]],
    "retire.decommission": ["Decommission record → 8.4 Portfolio Review; learning log → next cycle", ["Decommission record closes RET-##; LRN-### links it"], "2–4 weeks (read-only period included)", ["Use after switch-off", "Run cost removed"], ["Retirement retrospective — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; stopping an outcome is a decision; retirement ends in a decommission record ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "Retire → 8.5, ending in a decommission record; stopping pursuit of an outcome is a recorded decision — both in the learning log";
  ACT.routing.stop = "Retire → decommission record and learning log; a stopped outcome is recorded, never silent";
  P("outcomes").contract.routing.stop = "Stop pursuing the criteria → recorded in the outcome report and the learning log; feeds 8.4 (pivot / retire)";
  ACT.contract.cases.alternates.push("Parked follow-up → park record with a revisit trigger, reviewed at the next portfolio review");
  ACT.contract.artifacts.evidence.push("Learning log");
  P("portfolio").contract.artifacts.outputs.push("Learning log");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most initiatives: a funded change with a value hypothesis, reviewed quarterly.", skip: [], condense: {}, add: {} },
    light: { when: "A small, low-risk change inside a funded product, or a solo / small team.",
      skip: ["evolve.retire", "evolve.debt.track"],
      condense: { "evolve.outcomes.plan": "Reuse the product's standing metrics; one line per criterion", "evolve.outcomes.baseline": "Spot-check one metric against a manual count", "evolve.insight": "One monthly pass: collect, synthesise and route in a single session", "evolve.debt": "A debt list on the product backlog, ranked with features", "evolve.portfolio.pack": "One page: outcome vs hypothesis and a recommendation", "evolve.portfolio.options": "Options discussed in the decision meeting, retire included" },
      add: {} },
    rigorous: { when: "Large investment, regulated domain, personal data, or a hard-to-reverse retirement.",
      skip: [], condense: {},
      add: { "evolve.outcomes.review": "Independent reviewer re-computes every reading before the judge signs", "evolve.outcomes.baseline": "Data-quality audit of each metric's pipeline", "evolve.debt.assess": "Security and architecture boards review the top-ranked items", "evolve.portfolio.decide": "Decision minuted and ratified by the executive above the investment threshold", "evolve.retire.data": "Records manager and privacy officer co-sign every disposition; deletion certificates audited", "evolve.retire.decommission": "Change advisory board approves switch-off; 30-day usage alarm after removal" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["OUT", "Outcome report", "outcome-report"], ["INS", "Insight", "insight-synthesis"], ["IMP", "Improvement item", "improvement-backlog"], ["TDR", "Tech-debt item", "tech-debt-register"], ["MOD", "Modernisation plan", "modernisation-plan"], ["PDC", "Portfolio decision", "portfolio-decision"], ["RET", "Retirement", "retirement-plan"], ["LRN", "Learning", "learning-log"]];
})();
