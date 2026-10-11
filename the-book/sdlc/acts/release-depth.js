/*
 * ACT VI — RELEASE · extra workflows, handoffs, continuity, stop policy, tailoring
 * and the trace chain. Status: draft (awaiting review). Loaded after acts/release.js.
 *
 *  - Extra workflows where one per subprocess was unrealistic
 *  - Workflow handoffs naming the artifact and the receiving unit
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning; a no-go names what must change; a rollback
 *    raises a problem record; a cancelled release returns its stories unreleased
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.release;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const change = SP("prep", "change");
  change.workflows.push(W("expedite-change", "Expedite an Emergency Change",
    [["s1", "Raise the emergency change", "Release manager", "Emergency change record"], ["d1", "Truly an emergency?", "Emergency change authority", "", true], ["s2", "Approve with minimum checks", "Emergency change authority", "Change approval"], ["s3", "Deploy through the same pipeline", "DevOps / platform engineer", "Deployment record"], ["s4", "Review within two working days", "Change authority", "Change review notes"]],
    [["d1", "authority", "escalate", "Not an emergency → normal change path"], ["s3", "s1", "rework", "Fix fails → raise again with what was learned"], ["s4", "stop", "stop", "Review finds misuse → recorded in the learning log"]],
    { short: "Emergency Change", definition: "When production is harmed and a fix cannot wait, raise an emergency change, approve it with the minimum checks, deploy it through the same pipeline, and review it within two working days.", inputs: ["Problem record", "Rollback plan"], preconditions: ["Users are being harmed now", "Rollback already tried or not possible"], actors: ["Release manager", "Emergency change authority", "DevOps / platform engineer", "Change authority"],
      decisions: ["Is this truly an emergency, or a normal change in a hurry?"], cases: ["DEF-221 hotfix wanted 'today' — not an emergency", "ERP import failing for all sites — emergency"], branches: ["Emergency → approve and deploy", "Not an emergency → normal path", "Fix fails → raise again"],
      failures: ["Emergency path used to skip review", "Hotfix built outside the pipeline"], recovery: ["Post-review records the misuse; the change authority tightens the criteria", "Rebuild through the pipeline and redeploy"], rework: "Fix failed → raise a new emergency change with what was learned",
      criteria: ["Users harmed now", "Same pipeline, same build process"], checks: ["Post-implementation review within two working days"], evidence: ["Change approval", "Change review notes"], gate: "Emergency Change Reviewed",
      outputs: ["Emergency change record", "Change approval", "Deployment record"], exit: ["Fix deployed and reviewed"], handoff: "Emergency change record & deployment record → 6.5.1 Run Smoke Checks; review → learning log",
      traceability: ["Emergency CHG-#### linked to PRB-### and DEP-####"], learning: ["Emergency changes per month and how many were real — learning log"],
      uses: { s1: ["ITIL 4 — change enablement"], d1: ["Change risk assessment"], s2: ["Peer review of changes", "ISO/IEC 20000-1 — change management"], s3: ["Release record system"], s4: ["ISO/IEC 20000-1 — change management", "Single accountable owner"] },
      lensUses: { s1: ["ops: What is the user harm, right now?"], d1: ["gov: The emergency path is not a shortcut for impatience."], s2: ["sec: Security still sees the change."], s3: ["devops: Same pipeline — no laptop builds."], s4: ["gov: Reviewed within two working days.", "comp: Review recorded for audit."] } }));
  change.loops = [["expedite-change", "raise-change", "alternate", "Not an emergency → normal change"]];
  change.contract.artifacts.outputs.push("Emergency change record");

  const guard = SP("rollout", "guard");
  guard.workflows.push(W("kill-switch", "Pull the Kill Switch",
    [["s1", "Rollback threshold or user harm confirmed", "On-call engineer", "Guardrail readings"], ["s2", "Switch the site flag off", "On-call engineer", "Kill-switch record"], ["s3", "Confirm clerks are back on manual entry", "Site lead", "Site lead sign-off"], ["d1", "Restore exposure later, or withdraw?", "Release manager", "", true], ["s4", "Record & raise the problem", "Release manager", "Problem record"]],
    [["s3", "s2", "rework", "Manual entry not restored → redeploy previous"], ["d1", "authority", "escalate", "Harm continues → incident command"], ["d1", "stop", "stop", "Withdraw the release"]],
    { short: "Kill Switch", definition: "When a rollback threshold is crossed or users are harmed, switch the site's flag off at once, confirm the fallback works, then decide whether the release can be re-exposed later or must be withdrawn.", inputs: ["Guardrail definitions", "Runbook"], preconditions: ["Kill switch configured per site"], actors: ["On-call engineer", "Site lead", "Release manager", "Incident commander"],
      decisions: ["Re-expose after a fix, or withdraw the release?"], cases: ["Accuracy below 90% for 30 minutes at one site", "Wrong orders reaching the warehouse"], branches: ["Fixable → re-expose later through 6.3.3", "Not fixable → withdraw", "Harm continues → incident command"],
      failures: ["Switch pulled but fallback broken", "On-call waits for permission"], recovery: ["Redeploy the previous version", "Runbook states on-call needs no permission"], rework: "Fallback not restored → redeploy the previous version",
      criteria: ["Switch pulled within minutes of confirmation", "Fallback confirmed by the site"], checks: ["Site lead confirms manual entry works"], evidence: ["Kill-switch record", "Site lead sign-off"], gate: "Exposure Removed",
      outputs: ["Kill-switch record", "Problem record"], exit: ["Users safe on the fallback; decision recorded"], handoff: "Kill-switch record & problem record → 6.2.4 Roll Back or Roll Forward and the OPERATE problem backlog",
      traceability: ["Kill-switch use linked to RING-n, the reading and PRB-###"], learning: ["Time from breach to switch — learning log"],
      uses: { s1: ["Guardrail metrics", "Observability platform"], s2: ["Kill switch", "Feature-flag service", "Roll back first, diagnose later"], s3: ["On-call & paging tool"], d1: ["ISO 31000 — risk treatment", "Site Reliability Engineering"], s4: ["Feature toggles"] },
      lensUses: { s1: ["rel: Rollback threshold confirmed — no debate."], s2: ["ops: On-call acts without asking."], s3: ["cust: Clerks can still take orders.", "sup: Service desk told the site is on manual entry."], d1: ["ai: Is the parser fixable for this site's scans?"], s4: ["data: Orders auto-filled before the switch reviewed."] } }));
  guard.loops = [["kill-switch", "watch-guardrails", "alternate", "Pause enough → no kill switch"]];

  const handover = SP("pdv", "handover");
  handover.workflows.push(W("release-retro", "Hold the Release Retrospective",
    [["s1", "Build the release timeline", "Release manager", "Release record"], ["s2", "Read the DORA measures", "Release manager", ""], ["s3", "Run the blameless retrospective", "Release manager", "Release retrospective"], ["d1", "Every change owned?", "Release manager", "", true], ["s4", "Log learning & feed EVOLVE", "Release manager", "Learning log"]],
    [["d1", "s3", "rework", "Changes without owners → assign"]],
    { short: "Release Retro", definition: "Whatever the outcome, walk the release from assembly to close, read the DORA measures, decide what to keep and change, give every change an owner and log it.", inputs: ["Release record", "Post-deployment verification report", "Hypercare log"], preconditions: ["Release closed (passed, passed with issues, failed or rolled back)"], actors: ["Release manager", "Delivery team", "Support lead", "Operations lead"],
      decisions: ["Does every agreed change have an owner?"], cases: ["Rolled-back release — retrospective still held", "Go with conditions that were late"], branches: ["Owned → log and share", "Unowned → assign before closing"],
      failures: ["Retrospective skipped after a smooth release", "Blame instead of causes"], recovery: ["Release manager holds a 20-minute retro anyway", "Reframe on the system, not the person"], rework: "Changes without owners → assign owners",
      criteria: ["Blameless", "Every change owned"], checks: ["Learning log updated"], evidence: ["Release retrospective", "Learning log"], gate: "Release Learning Captured",
      outputs: ["Release retrospective", "Learning log"], exit: ["Learning logged and shared"], handoff: "Release retrospective & learning log → EVOLVE (Act VIII)",
      traceability: ["Each learning LRN-### linked to RC-### and GNG-###"], learning: ["Retrospective changes applied to the next release"],
      uses: { s1: ["Release record system"], s2: ["DORA metrics"], s3: ["Retrospective"], d1: ["Decide explicitly"], s4: ["ISO/IEC 20000-1 — post-implementation review"] },
      lensUses: { s1: ["gov: Timeline built from the record, not memory."], s2: ["ops: Lead time, frequency, change failure rate, time to restore."], s3: ["sup: Support's view of the first weeks.", "rel: What nearly went wrong."], d1: ["gov: Every change has an owner."], s4: ["prod: Patterns shared with the product backlog owner."] } }));
  handover.loops = [["release-retro", "close-handover", "rework", "Retro finds a gap in the record"]];
  handover.contract.artifacts.outputs.push("Release retrospective");
  handover.contract.knowledge.practices.push("Retrospective");
  P("pdv").contract.artifacts.outputs.push("Release retrospective", "Learning log");
  ACT.contract.artifacts.outputs.push("Learning log");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "assemble-rc": "Release candidate → 6.1.2 Raise & Approve the Change and 6.1.3 Write Release Notes",
    "raise-change": "Approved change record → 6.1.4 Hold the Go / No-Go Decision",
    "expedite-change": "Emergency change record & deployment record → 6.5.1 Run Smoke Checks; review → learning log",
    "write-notes": "Release notes → 6.1.4 Go / No-Go, 6.4.1 Enable Support and 6.4.2 Plan & Send Launch Communications",
    "go-no-go": "Go / No-Go decision record → 6.2.3 Deploy to Production; conditions register → 6.3.3 Promote Through the Rings",
    "plan-deploy": "Deployment plan & rollback plan → 6.2.2 Rehearse & Prove Rollback; rollback plan → 6.1.2 Raise & Approve the Change",
    "rehearse-rollback": "Staging rehearsal record → 6.1.4 Hold the Go / No-Go Decision (criterion rl4)",
    "deploy-prod": "Deployment record → 6.5.1 Run Smoke Checks, then 6.3.2 Run Ring 0",
    "recover-deploy": "Rollback record & problem record → OPERATE problem backlog; on fix-forward → BUILD and a new 6.1.4 Go / No-Go",
    "exposure-plan": "Exposure plan & guardrail definitions → 6.1.4 Hold the Go / No-Go Decision (criterion rl5) and 6.3.2 Run Ring 0",
    "run-canary": "Canary report → 6.3.3 Promote Through the Rings",
    "promote-ring": "Ring promotion records → 6.5.2 Verify Production Against Predictions; launch announcements timed by 6.4.2",
    "watch-guardrails": "Ring decision → 6.3.3 Promote Through the Rings; problem record → OPERATE problem backlog",
    "kill-switch": "Kill-switch record & problem record → 6.2.4 Roll Back or Roll Forward and the OPERATE problem backlog",
    "enable-support": "Support enablement pack → 6.4.4 Train Users & Confirm Readiness; hypercare roster → 6.5.3 Run Hypercare",
    "send-comms": "Communications plan → 6.4.4 Train Users & Confirm Readiness; announcements → each ring in 6.3.3",
    "publish-docs": "User documentation → 6.4.4 Train Users & Confirm Readiness and the service desk",
    "train-confirm": "Launch readiness record → 6.1.4 Hold the Go / No-Go Decision and each ring's entry in 6.3.3",
    "smoke-check": "Smoke check results → 6.3.2 Run Ring 0 and 6.5.2 Verify Production Against Predictions",
    "verify-prod": "Post-deployment verification report → 6.5.4 Close the Release & Hand Over",
    "hypercare": "Hypercare log → 6.5.4 Close the Release & Hand Over; problem records → OPERATE problem backlog",
    "close-handover": "Release record, operational handover pack, runbook & SLOs → OPERATE (Act VII); → Hold the Release Retrospective",
    "release-retro": "Release retrospective & learning log → EVOLVE (Act VIII)",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Release record, operational handover pack, runbook and SLO targets → OPERATE (Act VII); release retrospective and learning log → EVOLVE (Act VIII); rollbacks → BUILD", ["Creates the RC → CHG → GNG → DEP → RING → LCH → RN → PDV chain", "Every RC links the STY-### it released and VERIFY's QGR; every PDV links back to its DEP, RING and GNG"], "Days, not weeks: prep 2–4 days, rollout 1–2 weeks by site, close after a 72-hour soak (Light ≈ same day · Rigorous 2–4 weeks)", ["Deployment frequency and lead time for changes (DORA)", "Change failure rate and time to restore service (DORA)", "Share of releases closed with a production check", "Conditions met on time"], ["Release retrospective for every release, including rollbacks", "DORA readings reviewed monthly with OPERATE", "Patterns fed to EVOLVE"]],
    prep: ["Release candidate, approved change, release notes and the Go / No-Go record → 6.2 Deployment; conditions register → 6.3 Progressive Rollout", ["Creates RC-###, CHG-####, RN-x.y.z and GNG-###; GNG links RC, CHG, LCH and each condition"], "2–4 days", ["Days from quality gate to Go / No-Go", "No-go rate and reasons", "Conditions met by their due date"], ["Why releases were no-go or conditional — learning log"]],
    deploy: ["Deployment record (dark) → 6.5.1 smoke and 6.3.2 Ring 0; rollback records → OPERATE", ["Creates DEP-#### linking RC, CHG and the build digest"], "Plan and rehearse 1–2 days; deployment under 30 minutes", ["Deployment duration", "Rehearsed vs actual rollback time", "Change failure rate"], ["Rehearsal findings and failed deployments — learning log"]],
    rollout: ["Ring records and guardrail readings → 6.5.2 Verify Production; problems → OPERATE", ["Creates RING-0..n linked to DEP and GNG conditions"], "1–2 weeks (48–72 h soak per ring)", ["Time from deployment to full exposure", "Guardrail breaches per ring", "Time from breach to pause"], ["Breaches and holds by cause — learning log"]],
    launch: ["Launch readiness record → 6.1.4 Go / No-Go and each ring in 6.3.3; support pack → 6.5.3 hypercare", ["Creates LCH-### linked to RC and each ring"], "Runs alongside prep — 3–5 days before the first ring", ["Readiness gaps found after exposure", "Tickets in the first week per site", "Training attendance before the ring"], ["Readiness gaps and first-week questions — learning log"]],
    pdv: ["Closed release record, operational handover, runbook and SLOs → OPERATE; release retrospective → EVOLVE", ["Creates PDV-### linking DEP, RING, NFR and ADR IDs; closes RC, CHG and GNG"], "Smoke in minutes; soak 72 hours at full exposure; hypercare up to two weeks", ["Predictions met vs missed", "Days from full exposure to close", "Handover accepted first time"], ["Release retrospective; predictions that were wrong — learning log"]],
    "prep.assemble": ["Release candidate → 6.1.2 Raise & Approve the Change", ["Creates RC-### linking each STY-### and the QGR"], "½–1 day", ["Stories dropped after picking", "Exclusions disputed"], ["Stories dropped late and why — learning log"]],
    "prep.change": ["Approved change record → 6.1.4 Hold the Go / No-Go Decision", ["Creates CHG-#### linked to RC-###"], "½–2 days (standard: minutes)", ["Approval lead time", "Changes rejected or escalated", "Emergency changes per month"], ["Approval delays and their causes — learning log"]],
    "prep.notes": ["Release notes → 6.1.4 Go / No-Go and 6.4 Launch Readiness", ["Creates RN-x.y.z; each line links STY-### or DEF-###"], "½ day", ["Support questions the notes didn't answer"], ["Unclear notes — learning log"]],
    "prep.gonogo": ["Go / No-Go decision record → 6.2.3 Deploy to Production; conditions register → 6.3.3", ["Creates GNG-### linking RC-###, CHG-####, LCH-### and each condition C-#"], "1–2 hours, after a day of readiness review", ["Criteria met first time", "No-go rate", "Conditions closed on time"], ["Late or breached conditions — learning log"]],
    "deploy.plan": ["Deployment plan & rollback plan → 6.2.2 Rehearse & Prove Rollback", ["Plans linked to RC-### and the build digest"], "½ day", ["Manual steps remaining", "One-way doors accepted"], ["Steps that failed in rehearsal — learning log"]],
    "deploy.rehearse": ["Staging rehearsal record → 6.1.4 Go / No-Go", ["Staging DEP-#### linked to RC-###"], "2–4 hours", ["Rollback time in staging", "Rehearsals that found a fault"], ["Faults the rehearsal caught — learning log"]],
    "deploy.execute": ["Deployment record → 6.5.1 smoke and 6.3.2 Ring 0", ["Creates DEP-#### linking RC, CHG and digest"], "Under 30 minutes in the window", ["Deployment duration", "Deployments failed"], ["Deployment failures — learning log (DORA)"]],
    "deploy.rollback": ["Rollback record & problem record → OPERATE; fix-forward → BUILD", ["Links DEP-####, the trigger reading and PRB-###"], "Minutes to restore; decision within the day", ["Time to restore service", "Rollbacks per release"], ["Triggers that fired and time to act — learning log"]],
    "rollout.flags": ["Exposure plan & guardrails → 6.1.4 Go / No-Go and 6.3.2 Ring 0", ["Defines RING-0..n under RC-###"], "½–1 day, at least a week before go so baselines exist", ["Guardrails emitting before go", "Flags removed on schedule"], ["Guardrails that proved useless — learning log"]],
    "rollout.canary": ["Canary report → 6.3.3 Promote Through the Rings", ["Creates RING-0 linked to DEP-#### and GNG-###"], "48 hours", ["Faults found in Ring 0", "Soaks extended for lack of data"], ["What Ring 0 found that VERIFY did not — learning log"]],
    "rollout.promote": ["Ring promotion records → 6.5.2 Verify Production", ["Creates RING-1..n linked to conditions C-#"], "72 hours per ring", ["Rings held and why", "Time from deployment to full exposure"], ["Holds by cause — learning log"]],
    "rollout.guard": ["Ring decisions → 6.3.3; problem records → OPERATE", ["Breaches linked to RING-n and PRB-###"], "Throughout the rollout", ["Time from breach to pause", "Breaches that became rollbacks"], ["Breaches and response times — learning log"]],
    "launch.support": ["Support enablement pack → 6.4.4 and 6.5.3 Run Hypercare", ["KB articles tagged RN-x.y.z and LCH-###"], "1–2 days before Ring 0", ["Tickets answered from articles", "Escalations in the first week"], ["Questions support couldn't answer — learning log"]],
    "launch.comms": ["Communications plan → 6.4.4; announcements → each ring", ["Each message linked to RING-n and LCH-###"], "½ day plan; messages two days before each ring", ["Groups missed", "Messages re-sent with corrections"], ["Forgotten audiences — learning log"]],
    "launch.docs": ["User documentation → 6.4.4 and the service desk", ["Docs versioned RN-x.y.z"], "1–2 days, plus translation lead time", ["Users completing the task from the docs alone", "Doc-related tickets"], ["Steps users still got wrong — learning log"]],
    "launch.train": ["Launch readiness record → 6.1.4 Go / No-Go and each ring's entry", ["Creates LCH-### linked to RC-### and each RING-n"], "45 minutes per site, before its ring", ["Attendance before the ring", "Readiness gaps found after exposure"], ["Readiness gaps — learning log"]],
    "pdv.smoke": ["Smoke check results → 6.3.2 Ring 0 and 6.5.2", ["Linked to DEP-####"], "Minutes after each deployment", ["Smoke failures", "Failures smoke missed"], ["Smoke coverage gaps — learning log"]],
    "pdv.verify": ["Post-deployment verification report → 6.5.4 Close & Hand Over", ["Creates PDV-### linking DEP, RING and the NFR / ADR IDs checked"], "Through the 72-hour soak at full exposure", ["Predictions met vs missed", "Mismatches routed"], ["Wrong predictions and by how much — learning log"]],
    "pdv.hypercare": ["Hypercare log → 6.5.4; problems → OPERATE problem backlog", ["Early-life DEF-### and PRB-### linked to RC-###"], "Up to two weeks per site", ["Tickets per day", "Early-life defects by severity"], ["Early-life defect causes — learning log"]],
    "pdv.handover": ["Release record, operational handover pack, runbook and SLOs → OPERATE; retrospective and learning log → EVOLVE", ["Closes RC, CHG and GNG; creates LRN-### linked to RC-###"], "½ day handover; retrospective within a week of close", ["Handover accepted first time", "Days from full exposure to close", "Flags removed on schedule"], ["Release retrospective — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning; no-go names what must change ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "No-go with no path or kill switch → release cancelled or withdrawn; stories return unreleased with the reason; recorded in the learning log";
  ACT.routing.stop = "No-go → release cancelled; the failing criterion and what must change recorded, with learning";
  P("prep").contract.routing.stop = "No-go with no path → release cancelled; stories stay verified and unreleased; what must change and why — recorded in the learning log";
  P("deploy").contract.routing.stop = "Release withdrawn → stories back to BUILD with a rollback record and a problem record — recorded in the learning log";
  ACT.contract.cases.alternates.push("No-go → reopened once the failing criterion is met; only the failed criteria are re-evaluated, and a go is never reopened");
  ACT.contract.controls.rules.push("Every rollback raises a problem record; every release, including a rolled-back one, ends with a retrospective");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most releases: user-facing change, moderate risk, a flag to control exposure, more than one group of users.", skip: [], condense: {}, add: {} },
    light: { when: "Small, low-risk, reversible change behind a flag — a standard (pre-approved) change type, few users, no data migration.",
      skip: ["release.launch.train", "release.pdv.hypercare"],
      condense: { "release.prep.change": "Standard change — logged in the pipeline, no review", "release.prep.notes": "Two lines in the changelog and the help article", "release.prep.gonogo": "Go / No-Go as a checklist signed by the release manager in the pipeline", "release.deploy.plan": "Pipeline default plan; rollback = flag off and redeploy", "release.rollout": "Two rings: pilot users, then everyone", "release.launch": "One message and an updated help article", "release.pdv.verify": "Automated smoke plus a 24-hour soak" },
      add: {} },
    rigorous: { when: "High-risk or regulated change, data migration, many sites or external customers, or a hard-to-reverse step.",
      skip: [], condense: {},
      add: { "release.prep.change": "Change advisory with IT security and compliance; separation of duties enforced", "release.prep.gonogo": "Decided by someone who did not assemble the release; sponsor attends; conditions reported weekly", "release.deploy.rehearse": "Full dress rehearsal including restore from backup, timed against the recovery time objective", "release.rollout.canary": "Statistical canary analysis against a control group", "release.launch.docs": "Docs reviewed against ISO/IEC/IEEE 26514 and WCAG 2.2 AA by a specialist", "release.pdv.verify": "72-hour soak at full exposure and formal operational acceptance", "release.pdv.handover": "Post-implementation review per ISO/IEC 20000-1 with the change authority" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["RC", "Release candidate", "release-candidate"], ["CHG", "Change", "change-record"], ["GNG", "Go / No-Go decision", "go-no-go-record"], ["DEP", "Deployment", "deployment-record"], ["RING", "Rollout ring", "ring-record"], ["LCH", "Launch readiness", "launch-readiness"], ["RN", "Release notes", "release-notes"], ["PDV", "Post-deployment verification", "pdv-report"], ["LRN", "Learning", "learning-log"]];
})();
