/*
 * ACT I — DISCOVER (technical discovery) · place in the delivery system (dual-track agile).
 * Status: draft (awaiting review). Loaded after acts/discover-depth.js.
 *
 *  - Two modes: initiative mode (the full act, once per initiative) and feature mode
 *    (a light weekly technical-discovery loop alongside delivery)
 *  - Feature mode as an executable workflow (`ACT.continuous`) whose steps reuse the act's units
 *  - Accepted ADRs feed the product backlog as enabler stories; trace chain extends to STY
 */
(function () {
  const ACT = window.NODE_ACTS.discover;

  /* ───────── 1. Initiative mode ends in the product backlog ───────── */
  ACT.contract.routing.forward = "Feasible → ADR accepted → PLAN with the handoff pack; enabler work enters the product backlog";
  ACT.contract.knowledge.patterns.push("Multi-level backlog");
  ACT.contract.flow.parallel.push("Feature mode runs every week alongside delivery, inside funded products");
  ACT.contract.continuity.handoff = "ADR and handoff pack → PLAN; in feature mode, ready enabler stories → product backlog → delivery track; learning log → EVOLVE";
  ACT.contract.continuity.traceability.push("Feature mode adds STY-### enabler stories, each linked to the spike and ADR behind it");

  const chain = ACT.traceChain, li = chain.findIndex((x) => x[0] === "LRN");
  chain.splice(li, 0, ["STY", "Story", "backlog-item"]);

  /* ───────── 2. Feature mode: continuous technical discovery as a workflow ───────── */
  const steps = [
    ["s1", "Pick the riskiest technical unknown on the backlog", "Engineer", "Technical hypothesis list", false, "discover.frame.unknowns"],
    ["s2", "Plan a time-boxed spike", "Engineer", "Spike plan", false, "discover.frame.spikes"],
    ["s3", "Run the spike", "Engineer", "Spike results", false, "discover.validate.prototype"],
    ["d1", "Hypothesis held?", "Tech lead", "", true, "discover.decide.record"],
    ["s4", "Record or update the ADR", "Engineer", "Technical decision record (ADR)", false, "discover.decide.record"],
    ["s5", "Write the enabler story & acceptance criteria", "Engineer", "Backlog item (ready)", false, null],
    ["d2", "Meets Definition of Ready?", "Delivery team", "", true, null],
  ];
  ACT.continuous = {
    id: "continuous", title: "Continuous Technical Discovery (Feature Mode)", short: "Feature mode", status: "draft", gate: "Definition of Ready",
    summary: "Inside a funded product, an engineer takes the riskiest technical unknown each week, spikes it, records the decision and turns it into a ready enabler story — one or two sprints ahead of delivery.",
    mode: "feature",
    steps: steps.map(([id, title, actor, out, decision, reuses]) => ({ id, title, short: title, actor, out, decision, reuses })),
    loops: [["d1", "s1", "rework", "Disproved → next unknown or a different approach"], ["d2", "s5", "rework", "Not ready → refine the story"], ["s1", "authority", "escalate", "Unknown too big → initiative mode"]],
    wf: {
      short: "Feature mode",
      definition: "A weekly loop inside a funded product: pick the riskiest technical unknown, spike it inside a timebox, record what it decided, and turn it into a ready enabler story for delivery.",
      inputs: ["Technical hypothesis list", "Learning log", "Definition of Ready"],
      preconditions: ["Product funded and in delivery", "Spike capacity reserved each sprint"],
      actors: ["Engineer", "Tech lead", "Delivery team"],
      decisions: ["Did the spike support the hypothesis?", "Does the story meet the Definition of Ready?"],
      cases: ["Unknown turns out large or hard to reverse → initiative mode", "Answer found in the docs → no spike, record it"],
      branches: ["Held → record the ADR and write the story", "Disproved → next unknown", "Ready → product backlog", "Not ready → refine"],
      failures: ["Spike capacity eaten by delivery", "Stories written on unproven assumptions"],
      recovery: ["Reserve a fixed spike slot each sprint", "Mark the assumption on the story and test it behind a feature flag"],
      rework: "Disproved hypothesis → test the next unknown; story fails the Definition of Ready → refine it",
      criteria: ["At least one spike a fortnight on the riskiest unknown", "Every enabler story links its spike and ADR"],
      checks: ["Definition of Ready check at refinement"],
      evidence: ["Spike results", "Technical decision record (ADR)"],
      gate: "Definition of Ready",
      outputs: ["Spike results", "Technical decision record (ADR)", "Backlog item (ready)"],
      exit: ["Ready enabler stories in the product backlog, one to two sprints ahead of delivery"],
      handoff: "Ready enabler stories in the product backlog → delivery track (sprint planning)",
      traceability: ["STY-### → ADR-### → SPK-## → H-##"],
      learning: ["Disproved hypotheses kept in the learning log", "Monthly retro on spike accuracy"],
      timebox: "Every week, continuously — about half a day per engineer",
      measures: ["Spikes run per sprint", "Spikes inside timebox", "Enabler stories with a linked spike", "Surprises found in BUILD that a spike could have caught"],
      uses: { s1: ["Make beliefs falsifiable"], s2: ["Timebox", "Spike"], s3: ["Technical spike"], d1: ["Learn the most for the least"], s4: ["Decision record"], s5: ["User stories", "INVEST"], d2: ["Definition of Ready"] },
      lensUses: { s1: ["arch: The unknown most likely to change the architecture."], s2: ["eng: Success signal set before running."], s3: ["eng: Throwaway code, realistic data."], d1: ["arch: Read against the signal, not the hope."], s4: ["arch: Context, decision, consequences."], s5: ["qa: Acceptance criteria testable."], d2: ["eng: Ready means proven, not just written."] },
    },
    teach: {
      objectives: ["Explain when to run technical discovery in initiative mode and when in feature mode", "Run one weekly spike loop from unknown to ready enabler story", "Apply the Definition of Ready to an enabler story"],
      exercise: "Pick one technical unknown from a product you know. Write it as a hypothesis, plan a one-day spike with a success signal, and draft the enabler story you'd write if it holds.",
      checks: [
        ["A funded product team wants to switch PDF parsing vendors. Which mode?", ["Initiative mode — all five processes", "Feature mode — spike the riskiest unknown this week", "Neither — just switch"], 1, "It's a contained change inside a funded product; a weekly spike is proportionate. Go to initiative mode only if it turns out large or hard to reverse."],
        ["An enabler story has no linked spike or ADR. Is it ready?", ["Yes — it's written", "No — the Definition of Ready needs the evidence", "Only if estimated"], 1, "Ready means proven and linked, not just written."],
      ],
    },
  };

  /* ───────── 3. Walkthrough continues into feature mode ───────── */
  ACT.walkthrough.push({ at: "discover.continuous", title: "Keep discovering", text: "ADR-001 is accepted and the service is in delivery. Each week an engineer spikes the next unknown — 'can we match customer codes from the sender domain?' — records the result and writes the enabler story; STY-118 is pulled into sprint 2.", arts: ["spike-results", "discovery-adr", "backlog-item"] });
})();
