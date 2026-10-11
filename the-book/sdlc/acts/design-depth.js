/*
 * ACT III — DESIGN · continuity, handoffs, stop policy, tailoring and the trace chain.
 * Status: draft (awaiting review). Loaded after acts/design.js.
 *
 *  - Extra workflows where one per subprocess was not enough (baseline gate,
 *    superseding an ADR, the per-story Ready Gate)
 *  - Workflow handoffs naming the artifact and the receiving unit
 *  - CONTINUITY: handoff · traceability · timebox · measures · learning for every unit
 *  - Policy: every stop records learning in the learning log
 *  - Tailoring profiles (Light / Standard / Rigorous) and the trace-ID chain
 */
(function () {
  const ACT = window.NODE_ACTS.design;
  const P = (id) => ACT.processes.find((p) => p.id === id);
  const SP = (pid, sid) => P(pid).subprocesses.find((s) => s.id === sid);
  const W = (id, title, steps, loops, f) => ({
    id, title, short: f.short || title, summary: f.definition, status: "draft", gate: f.gate,
    steps: steps.map(([sid, t, actor, out, dec]) => ({ id: sid, title: t, short: t, actor, out, decision: !!dec })), loops, wf: f,
  });

  /* ───────── 1. Extra workflows ───────── */
  const baseline = SP("architecture", "baseline");
  baseline.workflows.push(W("baseline-gate", "Run the Architecture Baseline Gate",
    [["s1", "Collect evidence per criterion", "Architect", "Baseline gate record"], ["s2", "Independent review of the ten criteria", "Reviewer", "Architecture review notes"], ["d1", "All ten criteria pass?", "Reviewer", "", true], ["s3", "Version & publish the baseline", "Architect", "Architecture baseline"]],
    [["d1", "s1", "rework", "Criterion fails → its named next action"], ["d1", "authority", "escalate", "Reviewer and architect disagree → design authority"]],
    { short: "Baseline Gate", definition: "Check the baseline against the ten criteria — boundary, actors, capabilities, dependencies, shape, drivers, risks, decisions, findability, owner and reviewer — judged by someone who is not the author; on a pass, version and publish it.", inputs: ["Architecture baseline", "Architecture views", "ADRs"], preconditions: ["Views reviewed"], actors: ["Architect", "Reviewer", "Engineering lead", "Design authority"],
      decisions: ["Do all ten criteria pass with evidence?"], cases: ["Baseline lists no open questions", "No second architect available"], branches: ["Pass → baseline vN published", "Fail → the failed criterion's next action", "Dispute → design authority"],
      failures: ["Gate passed by assertion", "Gate treated as a date rather than a state"], recovery: ["Re-run with evidence attached per criterion", "Use a senior engineer from an adjacent team as reviewer"], rework: "Failed criterion → do its next action and recheck only that criterion",
      criteria: ["Ten criteria each with evidence", "Reviewer is not the author"], checks: ["Independent review"], evidence: ["Baseline gate record", "Architecture review notes"], gate: "Architecture Baseline",
      outputs: ["Baseline gate record", "Architecture baseline"], exit: ["Baseline vN published and findable from the repository"], handoff: "Architecture baseline vN → 3.6 Quality Attribute Specification and BUILD via the design pack",
      traceability: ["Baseline version → ADR-### and ARC-## views"], learning: ["Criteria that fail most often — learning log"],
      uses: { s1: ["Architecture baseline", "ISO/IEC/IEEE 42010"], s2: ["Architecture review"], d1: ["Surface unknowns early"], s3: ["Architecture repository", "Diagram-as-code"] },
      lensUses: { s1: ["arch: Evidence attached to each criterion."], s2: ["eng: Reviewer from outside the authoring team."], d1: ["arch: A baseline with no open questions fails."], s3: ["ops: Baseline findable from the repository where engineers work."] } }));
  baseline.loops = [["baseline-gate", "describe-views", "rework", "Gate fails on the views"]];

  const adr = SP("architecture", "adr");
  adr.workflows.push(W("supersede-adr", "Supersede an ADR & Re-check Stories",
    [["s1", "Write the new ADR citing the old", "Engineering lead", "ADR"], ["d1", "Accept the superseding decision?", "Architect", "", true], ["s2", "Mark the old ADR superseded; link forward", "Engineering lead", "ADR"], ["s3", "Mark stories relying on it for re-check", "Product owner", "Ready Gate result"], ["s4", "Increment the baseline version", "Architect", "Architecture baseline"]],
    [["d1", "s1", "rework", "Weak case → strengthen evidence"], ["d1", "authority", "escalate", "Beyond the team's authority → design authority"]],
    { short: "Supersede ADR", definition: "When a decision must change, write a new ADR that supersedes the old one, keep the old record, and send every story that relied on it back through the Ready Gate.", inputs: ["ADRs", "Spike results"], preconditions: ["New evidence or context that changes an accepted decision"], actors: ["Engineering lead", "Architect", "Product owner", "Design authority"],
      decisions: ["Is the superseding decision accepted?"], cases: ["Vendor misses its connector date", "Stories already in a sprint rely on the old decision"], branches: ["Accepted → supersede and re-check", "Weak case → rework", "Beyond authority → escalate"],
      failures: ["Old ADR edited or deleted", "Relying stories not re-checked"], recovery: ["Restore the old record from history and supersede properly", "Query stories by ADR link and re-open their Ready Gate"], rework: "Weak case → strengthen the evidence and re-present",
      criteria: ["Old record kept and linked forward", "Every relying story re-checked"], checks: ["ADR review"], evidence: ["Peer review notes"], gate: "ADR accepted",
      outputs: ["ADR", "Ready Gate result", "Architecture baseline"], exit: ["New ADR accepted; relying stories re-confirmed or reworked"], handoff: "Superseding ADR & re-check list → 3.6.4 Ready Gate for the affected stories",
      traceability: ["ADR-### superseded by ADR-### → affected STY-###"], learning: ["Why decisions changed — learning log"],
      uses: { s1: ["Decision record (ADR)"], d1: ["ADR review"], s2: ["Supersede, never delete", "ADR log"], s3: ["Decide explicitly"], s4: ["ADR log"] },
      lensUses: { s1: ["arch: The new context that changed the decision."], d1: ["eng: Cost of changing course stated."], s2: ["arch: The old record is kept, never edited."], s3: ["eng: Stories are not Ready again until their owner confirms they still hold."], s4: ["arch: Baseline version incremented."] } }));
  adr.loops = [["supersede-adr", "write-adr", "alternate", "A decision changes later"]];

  const readiness = SP("quality", "readiness");
  readiness.workflows.push(W("ready-gate", "Run the Ready Gate on a Story",
    [["s1", "Check purpose, requirements & criteria (1–3)", "Product owner", "User story"], ["s2", "Check dependencies, impact & design (4–6)", "Engineering lead", "Ready Gate result"], ["s3", "Check testability & size (7–8)", "QA lead", "Ready Gate result"], ["d1", "All eight conditions met?", "Product owner", "", true], ["s4", "Record result, failures & corrections", "Product owner", "Ready Gate result"]],
    [["d1", "s1", "rework", "Failed condition → its return point; recheck only what changed"], ["s2", "authority", "escalate", "Dependency without an owner → delivery lead"], ["d1", "stop", "stop", "Story no longer needed → remove"]],
    { short: "Ready Gate", definition: "Run the eight conditions — purpose, requirements, acceptance criteria, dependencies, architecture impact, design, testability, size — on one story, record any failure with its correction, and recheck only what changed.", inputs: ["User story", "Definition of Ready", "Architecture Impact Check", "UI specification"], preconditions: ["Story sliced by behaviour with acceptance criteria"], actors: ["Product owner", "Engineering lead", "QA lead", "Design lead", "Delivery team"],
      decisions: ["Are all eight conditions met?"], cases: ["Time-dependent criteria need a fixed clock", "Dependency recorded as 'infrastructure will do it'"], branches: ["Pass → Ready", "Fail → back to the named step", "Unowned dependency → escalate", "No longer needed → remove"],
      failures: ["Conditions ticked without evidence", "Author approves their own story"], recovery: ["Approval tied to this exact version; any change re-opens the gate", "Named approver who is not an author"], rework: "Failed condition → correct at its return point; recheck that condition and anything the correction touched",
      criteria: ["Eight conditions met", "Approver is not an author"], checks: ["Evidence per condition"], evidence: ["Ready Gate result"], gate: "Ready Gate",
      outputs: ["Ready Gate result", "Ready stories"], exit: ["Story Ready, or its failure recorded with owner and date"], handoff: "Ready story → product backlog → BUILD sprint planning",
      traceability: ["STY-### → RQ-### → impact outcome, UIS-##, ADR-###"], learning: ["Which condition fails most often — learning log"],
      uses: { s1: ["INVEST", "Specification by example"], s2: ["Definition of Ready", "Design review"], s3: ["Three amigos", "ISO/IEC/IEEE 29148 — verifiable requirements"], d1: ["Decide explicitly"], s4: ["Backlog tool"] },
      lensUses: { s1: ["prod: Actor, behaviour and outcome named.", "req: Every linked requirement covered by a criterion."], s2: ["arch: Impact resolved; ADRs accepted, not draft.", "ux: Empty, error and stale states designed."], s3: ["qa: Each criterion has a verification approach.", "eng: Fits one iteration with time for correction."], d1: ["prod: The approver did not write the story."], s4: ["qa: Failure and correction recorded — evidence, not ceremony."] } }));
  readiness.loops = [["ready-gate", "design-readiness", "rework", "Stories fail → readiness not met"]];
  readiness.contract.artifacts.outputs.push("Learning log");
  P("quality").contract.artifacts.outputs.push("Learning log");
  ACT.contract.artifacts.outputs.push("Design pack", "Learning log");

  /* ───────── 2. Workflow handoffs: artifact → receiving unit ───────── */
  const HANDOFF = {
    "map-flows": "UX flows & wireframes → 3.1.2 Prototype & Validate with Users",
    "usability-round": "Validated prototype & usability findings → 3.1.3 Specify UI & States",
    "specify-states": "UI specification & state matrix → 3.1.4 Design for Accessibility",
    "a11y-design-review": "Accessibility checklist & updated UI spec → 3.6.4 Run Design Readiness (design pack)",
    "event-storm": "Ubiquitous language glossary & Event Storming board → 3.2.2 Define Bounded Contexts & Context Map",
    "map-contexts": "Context map → 3.2.3 Model Entities, Aggregates & Lifecycles (and 3.3 Architecture Definition)",
    "model-aggregates": "Domain model & entity lifecycles → 3.2.4 Specify Invariants & Business Rules",
    "specify-rules": "Invariant catalogue & domain model → 3.3 Architecture Definition and 3.4.1 Design the Data Model",
    "impact-check": "Impact outcome → 3.3.2 Write the System Design (contained / structural) or 3.6.4 Ready Gate (no impact)",
    "write-system-design": "System design, interface contracts & failure-mode table → 3.3.3 Decide & Record (ADRs); also 3.4 and 3.5",
    "write-adr": "Accepted ADRs → 3.3.4 Describe Views & Update the Baseline",
    "describe-views": "Architecture views & draft baseline → Run the Architecture Baseline Gate",
    "baseline-gate": "Architecture baseline vN → 3.6 Quality Attribute Specification and BUILD via the design pack",
    "supersede-adr": "Superseding ADR & re-check list → 3.6.4 Ready Gate for the affected stories",
    "design-data-model": "Data model → 3.4.2 Assign Ownership, Consistency & Contracts",
    "assign-ownership": "Data ownership table & data contracts → 3.4.3 Map Lineage, Classification & Retention (stale states → 3.1.3)",
    "lineage-retention": "Data lineage map & retention schedule → 3.4.4 Plan Migration & Backfill and 3.5.3 Assess Privacy Impact",
    "plan-migration": "Migration & rollback plan → 3.6.4 design pack → BUILD (scripts) and RELEASE (cut-over)",
    "stride-session": "Threat model & data-flow diagram → 3.5.2 Define Security Requirements & Controls",
    "select-controls": "Security requirements → 3.6.4 stories and VERIFY's test planning",
    "run-dpia": "Privacy impact assessment → 3.5.4 Assess Third-Party Risk and 3.6.4 Design Readiness",
    "assess-vendor": "Vendor security assessment, DPA & conditions → 3.6.4 Design Readiness and the risk register",
    "rank-drivers": "Utility tree & ranked drivers → 3.6.2 Write Quality-Attribute Scenarios and 3.3.3 ADRs",
    "write-scenarios": "Quality-attribute scenarios → 3.6.3 Analyse Trade-offs & Fitness Functions (and VERIFY's test strategy)",
    "analyse-tradeoffs": "Trade-off analysis & fitness functions → 3.6.4 Run Design Readiness & Make Stories Ready",
    "design-readiness": "Ready stories, design readiness record, ADRs & design pack → BUILD (Act IV) — Iteration Planning",
    "ready-gate": "Ready story → product backlog → BUILD sprint planning",
  };
  ACT.processes.forEach((p) => p.subprocesses.forEach((s) => s.workflows.forEach((w) => { if (HANDOFF[w.id]) w.wf.handoff = HANDOFF[w.id]; })));

  /* ───────── 3. Continuity for every unit: [handoff, traceability[], timebox, measures[], learning[]] ───────── */
  const CONT = {
    "": ["Ready stories (DoR), the design readiness record, ADRs and the design pack → BUILD (Act IV); requirement gaps → PLAN; learning log → EVOLVE", ["Creates UXF → PRT → UIS, DOM, ARC → ADR, DAT, THR → DPIA, QAS → DRR on top of PLAN's RQ-###", "Every Ready STY-### links its RQ-###, impact outcome and the UIS / ADR / QAS / THR IDs it depends on"], "2–6 weeks for an initiative's first release, then continuous — one or two sprints ahead of delivery (Light ≈ days per feature · Rigorous 6–10 weeks)", ["Share of stories passing the Ready Gate first time", "Stories returned from BUILD for design gaps", "Architecture impact found after Ready (should be near zero)", "Usability task success and time on task vs today's baseline"], ["Design retrospective at each readiness decision", "Ready Gate failures by condition reviewed monthly", "Patterns fed to EVOLVE"]],
    experience: ["Validated prototype, UI spec with all states and accessibility checklist → 3.6.4 Design Readiness and BUILD", ["Creates UXF-##, PRT-## and UIS-## linked to RQ-###"], "1–3 weeks", ["Usability rounds to validation", "States found missing in BUILD"], ["Findings that surprised the team — learning log"]],
    domain: ["Glossary, context map, domain model and invariant catalogue → 3.3 Architecture Definition and 3.4 Data Design", ["Creates DOM-## and INV-## / BR-## rules linked to RQ-###"], "3–8 days", ["Terms changed after build started", "Rules found missing in VERIFY"], ["Model changes during BUILD — learning log"]],
    architecture: ["Impact outcomes, system designs, accepted ADRs and baseline vN → 3.6 and BUILD", ["Creates ARC-## views and ADR-###; impact outcomes recorded on RQ-###"], "1–3 weeks (each impact check takes minutes)", ["Share of requirements with no impact", "Impact found after Ready", "ADRs superseded within a year"], ["Late impact and superseded ADRs — learning log"]],
    data: ["Data model, ownership table, retention schedule and migration plan → 3.5 and BUILD", ["Creates DAT-## linked to DOM-##; retention set per data set"], "1–2 weeks", ["Second writers found later", "Migration rehearsal surprises"], ["Data surprises — learning log"]],
    secure: ["Threat model, security requirements, DPIA and supplier assessments → 3.6.4 Design Readiness and VERIFY", ["Creates THR-## and DPIA-##; SEC-## requirements link THR-## to STY-###"], "1–2 weeks", ["High threats found after design", "Security requirements without a story"], ["Threats found in VERIFY or OPERATE — learning log"]],
    quality: ["Ready stories, design readiness record and design pack → BUILD (Act IV)", ["Creates QAS-## and DRR-###; STY-### marked Ready"], "1–2 weeks, then per refinement", ["NFRs with a number and a verification method", "Ready Gate first-pass rate"], ["Readiness failures by area — learning log"]],
    "experience.flows": ["UX flows & wireframes → 3.1.2 Prototype & Validate with Users", ["Creates UXF-## linked to RQ-###"], "2–4 days", ["Requirements covered by a flow", "Flow changes after usability testing"], ["Flows that changed after testing — learning log"]],
    "experience.prototype": ["Validated prototype & usability findings → 3.1.3 Specify UI & States", ["Creates PRT-## linked to UXF-##; findings UF-## linked to PRT-##"], "1–2 weeks per round", ["Rounds to validation", "Task success and time on task"], ["Surprising findings — learning log"]],
    "experience.uispec": ["UI specification & state matrix → 3.1.4 Design for Accessibility", ["Creates UIS-## linked to UXF-## and RQ-###"], "2–5 days", ["States found missing in BUILD", "Spec review rounds"], ["Missing states — learning log"]],
    "experience.a11y": ["Accessibility checklist & updated UI spec → 3.6.4 Design Readiness", ["Each WCAG criterion linked to UIS-## components"], "1–3 days", ["Criteria failing at design review", "Accessibility defects found in VERIFY"], ["Accessibility defects — learning log"]],
    "domain.language": ["Glossary & Event Storming board → 3.2.2 Define Bounded Contexts", ["Each term linked to its source workshop or session (SES-##)"], "1–2 days", ["Terms agreed in one workshop", "Hotspots still open at the gate"], ["Terms that caused defects — learning log"]],
    "domain.contexts": ["Context map → 3.2.3 Model Entities & Aggregates and 3.3", ["Each context linked to its owner and glossary terms"], "1–2 days", ["Boundaries moved later"], ["Moved boundaries and why — learning log"]],
    "domain.model": ["Domain model → 3.2.4 Specify Invariants & Business Rules", ["Creates DOM-## linked to its bounded context"], "2–3 days", ["Model changes during BUILD"], ["Model changes — learning log"]],
    "domain.rules": ["Invariant catalogue & domain model → 3.3 and 3.4; examples → stories' acceptance criteria", ["Creates INV-## / BR-## linked to DOM-## and RQ-###"], "1–3 days", ["Rules with agreed examples", "Rules found missing in VERIFY"], ["Missing rules — learning log"]],
    "architecture.impact": ["Impact outcome → 3.3.2 Write the System Design, or straight to 3.6.4", ["Outcome recorded on RQ-### and inherited by its STY-###"], "Minutes per requirement; about ½ day per release", ["Share of requirements with no impact", "Impact found after Ready"], ["Missed impact — learning log"]],
    "architecture.sysdesign": ["System design → 3.3.3 ADRs; 3.4 and 3.5 in parallel", ["System design linked to RQ-### and its impact outcome"], "2–5 days", ["Review rounds", "Failure modes found in BUILD or VERIFY"], ["Missed failure modes — learning log"]],
    "architecture.adr": ["Accepted ADRs → 3.3.4 Describe Views & Update the Baseline", ["Creates ADR-### linked to QAS-## drivers and the system design"], "1–3 days per ADR (spikes 1–2 days)", ["ADRs with two or more real options", "ADRs superseded within a year"], ["Superseded ADRs and why — learning log"]],
    "architecture.baseline": ["Architecture baseline vN → 3.6 and BUILD via the design pack", ["Creates ARC-## views; the baseline version links ADR-###"], "2–4 days; version bumps in hours", ["Baseline gate first-pass rate", "Views out of date at review"], ["Stale views — learning log"]],
    "data.model": ["Data model → 3.4.2 Assign Ownership, Consistency & Contracts", ["Creates DAT-## linked to DOM-## and INV-##"], "2–4 days", ["Schema changes in BUILD"], ["Schema changes — learning log"]],
    "data.ownership": ["Ownership table & contracts → 3.4.3 Map Lineage & Retention", ["Each entity linked to its owner and contract version"], "1–2 days", ["Second writers found later"], ["Hidden writers — learning log"]],
    "data.lineage": ["Lineage map & retention schedule → 3.4.4 and 3.5.3", ["Each data set linked to DAT-##, its lawful basis and retention"], "1–3 days", ["Copies found after design", "Data sets without retention"], ["Late-found copies — learning log"]],
    "data.migration": ["Migration plan → 3.6.4 (design pack) → BUILD and RELEASE", ["Each step linked to DAT-## and its release and site"], "2–5 days including rehearsal", ["Rehearsals to pass", "Rollbacks used in RELEASE"], ["Rehearsal surprises — learning log"]],
    "secure.threat": ["Threat model → 3.5.2 Define Security Requirements & Controls", ["Creates THR-## linked to boundaries in ARC-##"], "1–2 days", ["High threats found after design"], ["Late threats — learning log"]],
    "secure.controls": ["Security requirements → 3.6.4 stories and VERIFY", ["SEC-## requirements link THR-## to STY-###"], "1–2 days", ["Requirements without a story", "Controls failing in VERIFY"], ["Failed controls — learning log"]],
    "secure.privacy": ["Privacy impact assessment → 3.5.4 and 3.6.4", ["Creates DPIA-## linked to data sets and purposes"], "1–5 days (a full DPIA up to 3 weeks)", ["Screenings recorded", "Privacy issues after release"], ["Privacy issues — learning log"]],
    "secure.supply": ["Supplier assessment & conditions → 3.6.4 and the risk register", ["Each supplier linked to ADR-### and its risk conditions"], "1–3 weeks (supplier response time)", ["Critical suppliers with an exit plan", "Supplier incidents after go-live"], ["Supplier issues — learning log"]],
    "quality.drivers": ["Ranked drivers → 3.6.2 Write Scenarios and 3.3.3 ADRs", ["Each driver linked to RQ-###, a risk or a brief measure"], "½–1 day", ["Ties at the top", "Drivers re-ranked later"], ["Re-ranked drivers — learning log"]],
    "quality.scenarios": ["Measurable NFRs → 3.6.3 Analyse Trade-offs and VERIFY", ["Creates QAS-## linked to RQ-### or RSK-##"], "1–3 days", ["Scenarios with a numeric measure and a method", "Targets changed after VERIFY"], ["Wrong targets — learning log"]],
    "quality.tradeoffs": ["Trade-offs & fitness functions → 3.6.4 and BUILD's pipeline", ["ADR-### ↔ QAS-## sensitivity and trade-off points"], "1–3 days", ["(H,H) scenarios analysed", "Fitness functions automated"], ["Surprising trade-offs — learning log"]],
    "quality.readiness": ["Ready stories, design readiness record, ADRs & design pack → BUILD (Act IV)", ["Creates DRR-###; STY-### marked Ready with links to RQ, UIS, ADR, QAS and THR IDs"], "½–1 day per review; minutes per story for the Ready Gate", ["Ready Gate first-pass rate", "Stories returned from BUILD"], ["Readiness failures by condition — learning log"]],
  };
  const unitAt = (key) => { if (!key) return ACT; const [p, s] = key.split("."); return s ? SP(p, s) : P(p); };
  Object.entries(CONT).forEach(([key, [handoff, traceability, timebox, measures, learning]]) => { unitAt(key).contract.continuity = { handoff, traceability, timebox, measures, learning }; });

  /* ───────── 4. Policy: every stop records learning ───────── */
  const allUnits = [ACT, ...ACT.processes, ...ACT.processes.flatMap((p) => p.subprocesses)];
  allUnits.forEach((u) => { const r = u.contract.routing; if (r.stop && !/learning log/i.test(r.stop)) r.stop += " — recorded in the learning log"; });
  ACT.contract.routing.stop = "No viable design → decision record, learning log, and the requirement returned to PLAN";
  ACT.routing.stop = "No viable design → stop with a decision record and learning log; back to PLAN";
  ACT.contract.cases.alternates.push("Ready with conditions → BUILD starts unblocked stories; each condition has an owner and a date");

  /* ───────── 5. Tailoring profiles ───────── */
  ACT.tailoring = {
    standard: { when: "Most features: a new capability with some architecture impact and some personal data.", skip: [], condense: {}, add: {} },
    light: { when: "A small, reversible change with no architecture impact and no new personal data — or feature mode inside a funded product.",
      skip: ["design.domain.contexts", "design.architecture.sysdesign", "design.architecture.adr", "design.data.migration", "design.secure.supply", "design.quality.tradeoffs"],
      condense: { "design.experience": "Flow sketch and UI spec with its states in one session; a quick test with three users", "design.domain": "Glossary update only", "design.architecture.impact": "Impact check recorded on each story — 'no impact' expected", "design.architecture.baseline": "Version bump only if anything changed", "design.secure.threat": "Ten-minute STRIDE check of any new boundary", "design.secure.privacy": "DPIA screening record only", "design.quality": "Reuse the baseline's scenarios; add any new one inline in the story" },
      add: {} },
    rigorous: { when: "Structural impact, regulated or sensitive data, safety- or money-critical behaviour, or hard-to-reverse decisions.",
      skip: [], condense: {},
      add: { "design.experience.prototype": "At least two usability rounds, including assistive-technology users", "design.experience.a11y": "Formal WCAG 2.2 AA / EN 301 549 conformance statement", "design.architecture.adr": "ADRs reviewed by the design authority", "design.architecture.baseline": "External ATAM-style architecture review before the baseline gate", "design.secure.threat": "Attack trees and an independent security review", "design.secure.privacy": "Full DPIA under Article 35 with DPO sign-off", "design.data.migration": "Two rehearsals on production-sized data", "design.quality.tradeoffs": "Fitness functions automated before BUILD starts" } },
  };

  /* ───────── 6. Trace-ID chain ───────── */
  ACT.traceChain = [["UXF", "UX flow", "ux-flow"], ["PRT", "Prototype", "prototype"], ["UIS", "UI specification", "ui-spec"], ["DOM", "Domain model", "domain-model"], ["ARC", "Architecture view", "architecture-description"], ["ADR", "Architecture decision", "adr"], ["DAT", "Data model", "data-model"], ["THR", "Threat", "threat-model"], ["DPIA", "Privacy impact assessment", "dpia"], ["QAS", "Quality-attribute scenario", "qa-scenarios"], ["DRR", "Design readiness record", "design-readiness-record"], ["STY", "Ready story", "backlog-item"], ["LRN", "Learning", "learning-log"]];
})();
