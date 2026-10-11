/*
 * ACT I — DISCOVER · step instructions for prompts.
 * Status: draft (awaiting review). Loaded after acts/discover-agile.js.
 *
 * Prompts for every level are generated from the unit contracts (app.js). Steps are the
 * smallest unit, so each one gets a hand-written instruction here: exactly what the person
 * asks the agent to do at that step. Keys are the step's path inside the act
 * ("<process>.<subprocess>.<workflow>.<step>", or "continuous.<step>" for feature mode).
 * `out` gives the expected output for steps that produce no artifact of their own.
 */
(function () {
  const ACT = window.NODE_ACTS.discover;
  ACT.promptAsk = {
    /* 1.1 Understand the Brief & the System */
    "context.brief.read-brief.s1": "Read the client brief I've pasted. Restate the ask in one sentence a developer would write — what must happen, with no technology named — then list the capabilities it implies as numbered verbs. If the brief names a technology, record it separately as a client preference.",
    "context.brief.read-brief.s2": "From the same brief, list every input and output with its format (email, PDF, API call, file, screen…), the users who touch the system, and the volumes and peaks. Put the source next to every number, or mark it 'assumed'. End with an in-scope / out-of-scope list.",
    "context.brief.read-brief.s3": "List every technical question the brief leaves open, as rows for my question log: Q-## ID, the question, its area (data, integration, performance, security, infrastructure, code), why it matters, and who could answer it. Mark any that only a spike or prototype can answer.",
    "context.brief.read-brief.d1": "Compare my technical brief summary with the original brief. Point out anything I missed, misread or quietly turned into a solution — so I can take it to the tech lead for a read-back.",
    "context.brief.read-brief.s4": "For each open question in my log, suggest the best person or source to answer it and the quickest way to get the answer. Flag any question that blocks tomorrow's work.",
    "context.system.audit-system.s1": "I have read access to this repository. Read the README, build files and dependency manifest, then give me the exact steps to run it locally or in a test environment. List anything that blocks running it.",
    "context.system.audit-system.s2": "Follow one real transaction through the code — from its entry point to where data is stored and back — and list every component, class and external call it passes through, with file paths. Don't summarise the folder tree; follow the request.",
    "context.system.audit-system.s3": "Draw a C4 level-1 context diagram as a table (element · type · talks to · protocol / format) for the system and everything around it: people, the system in scope, and every external system. Then give it to me as Mermaid too.",
    "context.system.audit-system.s4": "Measure the code's health with numbers: test count and coverage if available, dependencies and how far behind each is, build and deploy steps, TODO/FIXME count, duplicated logic. Then list the three debt hotspots that would slow new work, and any security finding (e.g. secrets in config) separately.",
    "context.system.audit-system.d1": "From my audit, prepare the 'safe to build on?' call for the tech lead: build on it, build beside it, or replace it — the evidence for each, and what must be true first.",
    "context.integrations.map-integrations.s1": "Trace the data through today's flow, as rows for my data flow map: DF-## ID, from, to, what data, format, trigger or frequency, volume, sensitivity (public / internal / personal / confidential), and whether a person does it by hand.",
    "context.integrations.map-integrations.s2": "List every system, API and service the solution will depend on, as rows for my integration inventory: INT-## ID, direction, interface type, auth method, owner. Include the ones we'd have to add, such as a parsing or OCR service.",
    "context.integrations.map-integrations.s3": "For each integration, read its real contract (OpenAPI spec, vendor guide or the calling code) and fill in: limits (rate, payload size, timeout, opening hours), error responses, idempotency and versioning. Write 'unknown' instead of guessing, and give me a single test call I can run against a test environment for each.",
    "context.integrations.map-integrations.d1": "From my inventory, prepare the call for the tech lead: is any dependency blocking, which are high risk and why, and what would unblock each one.",
    "context.integrations.map-integrations.s4": "For every unknown or high-risk row, draft the follow-up: who to ask, the exact question, and how it should come back (in writing, with a date). Add each as a question to my question log.",
    "context.constraints.log-constraints.s1": "From my brief summary, audit, data flow map and integration inventory, pull out every technical limit into constraint-log rows: C-## or A-## ID, the statement, area, hard or soft, and the source. Don't add anything that isn't in my documents.",
    "context.constraints.log-constraints.s2": "Go through the log and challenge each constraint: does it have a source I could show someone? Re-tag anything that doesn't as an assumption, with a confidence (high / medium / low) and the cheapest way to test it.",
    "context.constraints.log-constraints.s3": "For each hard constraint, write a short confirmation request to its owner — the statement, its source, and a yes/no question — so I can get it confirmed in writing.",
    "context.constraints.log-constraints.s4": "Assemble my system context pack: one paragraph per part (brief, audit, context diagram, data flows, integrations, constraints, open questions) with a link to the full document, and a short 'what this means for the next step' at the end.",
    "context.constraints.log-constraints.d1": "Review my system context pack as the tech lead would: could someone frame the problem from it without guessing? List what's missing or unsourced.",

    /* 1.2 Frame the Technical Problem */
    "frame.separate.split-solution.s1": "From the brief and my notes, write down every solution anyone has proposed, word for word, with who proposed it. Don't judge or rephrase them yet.",
    "frame.separate.split-solution.s2": "For the main proposal, build a why-chain: ask what it's for, then why that matters, one line at a time, until you reach a condition in the system (cite SYS / DF IDs from my system context pack). Stop when no tool or product is named.",
    "frame.separate.split-solution.s3": "State the problem in two or three sentences with no technology, product or vendor named — what fails, where in the flow, and what would show it's fixed. Then list the original proposal as one option for later.",
    "frame.separate.split-solution.d1": "Check my problem statement for hidden solution words and anything not supported by the system context pack, so I can take it to the tech lead.",
    "frame.unknowns.rank-unknowns.s1": "Collect every open question from my question log and every low- or medium-confidence assumption from my constraint log into one list.",
    "frame.unknowns.rank-unknowns.s2": "Rewrite each unknown as a hypothesis — 'We believe … ; we're wrong if …' — with a concrete result that would prove it wrong. One unknown per hypothesis.",
    "frame.unknowns.rank-unknowns.s3": "Rate each hypothesis on impact (how badly it would hurt if wrong) and uncertainty (how little evidence we have), rank them, and say how each could be tested: spike, measure, ask or docs.",
    "frame.unknowns.rank-unknowns.d1": "Prepare the top three hypotheses for the tech lead with a one-line case for why each could sink the build.",
    "frame.quality.set-targets.s1": "From ISO/IEC 25010, shortlist the quality attributes that matter for this problem and rank them — at most three at the top — with one line on why each matters here.",
    "frame.quality.set-targets.s2": "Write each top attribute as a scenario: 'When [stimulus], the system [response], measured as [number]'. Use the volumes and limits from my system context pack.",
    "frame.quality.set-targets.s3": "Define the technical success metrics: name, target, how and where it will be measured, and which quality attribute it proves. Mark baselines as 'to measure' where we don't have them yet.",
    "frame.quality.set-targets.d1": "Check every target is a number with a unit and a measurement method, and flag any two that conflict.",
    "frame.spikes.plan-spikes.s1": "From my ranked hypotheses, pick the ones a spike can answer. For the rest, say how they'll be answered instead (docs, a measurement, asking an owner).",
    "frame.spikes.plan-spikes.s2": "For each, design the smallest throwaway test that could prove the hypothesis wrong — what to build or run, on which data and environment. No production systems.",
    "frame.spikes.plan-spikes.s3": "Give each spike a timebox (a day or less unless justified) and a success signal written now, before any result exists.",
    "frame.spikes.plan-spikes.s4": "Assemble my technical framing pack: one paragraph each for the problem, the ranked unknowns, the quality targets and the spike plan, with links to the full documents.",
    "frame.spikes.plan-spikes.d1": "Review my spike plan as the tech lead would: is every spike small, time-boxed, safe and tied to one hypothesis?",

    /* 1.3 Investigate the Real Problem */
    "problem.reproduce.trace-flow.s1": "Help me pick a small, representative set of real samples to reproduce with (normal, edge and failing cases), and tell me exactly what to mask before using them.",
    "problem.reproduce.trace-flow.s2": "Give me step-by-step instructions to reproduce today's flow in our test environment with those samples, including what to log or time at each step.",
    "problem.reproduce.trace-flow.s3": "Turn my notes and logs into flow-trace rows: step, what happens, system (SYS ID), data in → out, manual or not, median time, and whether it goes wrong there.",
    "problem.reproduce.trace-flow.d1": "Check my trace could be repeated by another engineer from what's written, and list anything missing.",
    "problem.baseline.measure-baseline.s1": "For each success metric, tell me the best data source (logs, database, timed sample) and write the exact query or method to measure it.",
    "problem.baseline.measure-baseline.s2": "Help me choose a representative period and sample — covering normal and peak load — and say what would make it unrepresentative.",
    "problem.baseline.measure-baseline.s3": "From the raw results I paste, compute median, p95 and error rates per metric, and fill the baseline rows with method, period, sample and confidence.",
    "problem.baseline.measure-baseline.d1": "Check my baseline method for bias or gaps before the tech lead reviews it.",
    "problem.causes.find-causes.s1": "From my trace and baseline, list the symptoms, each with its number.",
    "problem.causes.find-causes.s2": "For each symptom, build a why-chain down to a system condition — data, integration, code, infrastructure or a manual step — never a person.",
    "problem.causes.find-causes.s3": "For each cause, find the evidence in my trace, baseline or logs, mark any cause without evidence, and rank the causes by how much of the baseline they explain.",
    "problem.causes.find-causes.d1": "Challenge my root causes: which are symptoms in disguise, and which lack evidence?",
    "problem.statement.state-problem.s1": "Draft the technical problem statement in five parts: what fails and where, how much (baseline), why (root causes), within which limits (hard constraints), and what a solution must achieve (targets). No technology named.",
    "problem.statement.state-problem.s2": "Link every clause to its evidence — trace step, baseline row, RC or C ID — and mark any clause you can't link.",
    "problem.statement.state-problem.s3": "Read the statement for solution words, vague words ('slow', 'better') and unsupported claims, and rewrite them.",
    "problem.statement.state-problem.d1": "Prepare the statement for the tech lead's read-back, with the evidence links listed underneath.",

    /* 1.4 Research Solution Options */
    "validate.scan.scan-tech.s1": "List the existing ways to solve my technical problem statement: commercial products, open-source libraries, features of platforms the client already has, improving what's there, and doing nothing.",
    "validate.scan.scan-tech.s2": "Check each candidate against my hard constraints (data region, interfaces, auth) and the problem statement, and mark fits yes / no / unknown with the reason.",
    "validate.scan.scan-tech.s3": "For each candidate that fits, record maturity, licence and cost band, with sources. Flag any licence that needs legal review.",
    "validate.scan.scan-tech.d1": "Propose a shortlist of two or three genuinely different routes plus 'do nothing', with why each made it.",
    "validate.evaluate.score-options.s1": "Turn my ranked quality attributes and hard constraints into weighted criteria, and fix the weights before we look at any option.",
    "validate.evaluate.score-options.s2": "For each shortlisted option, give me the quickest sandbox test or test call that produces evidence for each criterion, using masked or synthetic data.",
    "validate.evaluate.score-options.s3": "Score each option 1–5 per criterion from the evidence I paste, cite the evidence for every score, and list the unknowns each option still carries.",
    "validate.evaluate.score-options.d1": "Check every score has evidence and the weights weren't changed after scoring.",
    "validate.prototype.run-spike.s1": "From the evaluation and spike plan, pick the unknown that could most change the decision, and restate its hypothesis and success signal.",
    "validate.prototype.run-spike.s2": "Scaffold the smallest throwaway prototype that tests it — clearly marked as a spike — runnable in our test environment.",
    "validate.prototype.run-spike.s3": "From the results I paste, write the spike report: question, approach, result with data, read against the signal set in advance, remaining unknowns, and what it changes.",
    "validate.prototype.run-spike.d1": "Prepare the verdict for the tech lead: did the hypothesis hold, and what does that mean for the options?",
    "validate.architecture.sketch-options.s1": "From the spike results and evaluation, list the options that survived and why the others dropped out.",
    "validate.architecture.sketch-options.s2": "Sketch each surviving option at C4 container level — containers, what each does, and the arrows between them with protocols — in the same notation. Give me Mermaid too.",
    "validate.architecture.sketch-options.s3": "For each option, show how it meets each top quality-attribute scenario, its top three risks, its run cost drivers and a rough effort band.",
    "validate.architecture.sketch-options.d1": "Check the options are genuinely different and viable — no straw men — before the tech lead reviews them.",

    /* 1.5 Feasibility & the Technical Decision */
    "decide.feasibility.rate-feasibility.s1": "For each architecture option, collect the spike results that support it and the unknowns that remain.",
    "decide.feasibility.rate-feasibility.s2": "Rate each option's feasibility high / medium / low, citing the evidence, and name the quality attributes at risk.",
    "decide.feasibility.rate-feasibility.s3": "List the skills and capacity each option needs versus what the team has, and write each rating's conditions as checkable, dated facts.",
    "decide.feasibility.rate-feasibility.d1": "Prepare the feasibility call for the tech lead: which options are feasible, and on what conditions.",
    "decide.estimate.estimate-options.s1": "Break each feasible option into work items small enough to picture — integration, logic, UI, tests, deployment, monitoring.",
    "decide.estimate.estimate-options.s2": "Estimate each item as low / likely / high days with its basis, add monthly run and support cost, and flag the widest ranges.",
    "decide.estimate.estimate-options.s3": "Run a pre-mortem: 'it's six months later and this failed — why?' Turn the answers into risk-register rows with likelihood, impact, owner and mitigation.",
    "decide.estimate.estimate-options.d1": "Summarise effort, run cost and top risks per option for the tech lead, and flag anything beyond normal appetite.",
    "decide.compare.recommend.s1": "Put the options side by side on the same rows: quality targets met, feasibility, effort range, run cost, top risk, reversibility.",
    "decide.compare.recommend.s2": "For each option, write what choosing it gives up compared with the others.",
    "decide.compare.recommend.s3": "Write the recommendation: one option, why, what it trades away, how reversible it is, and the conditions it depends on.",
    "decide.compare.recommend.d1": "Argue against my recommendation as a sceptical tech lead would, so I can strengthen it or change it.",
    "decide.record.record-adr.s1": "Write ADR-001 from my comparison: title, status, context, decision, options considered (each with why it lost), consequences (good and bad) and conditions.",
    "decide.record.record-adr.s2": "Link every claim in the ADR to its evidence — spike, estimate, risk, baseline — and list anything unlinked.",
    "decide.record.record-adr.d1": "Prepare the decision review: the ADR summary and the questions the tech lead is likely to ask.",
    "decide.record.record-adr.s3": "Assemble the handoff pack for PLAN: one paragraph per part (ADR, problem statement, options, estimates, risks, system context, metrics) with links.",
    "decide.record.record-adr.s4": "Write the learning-log entries from this discovery: what surprised us, what we'd do differently, and the change we'll make next time — each with an owner.",

    /* Feature mode — continuous technical discovery */
    "continuous.s1": "From our hypothesis list and the upcoming backlog, pick the technical unknown most likely to hurt delivery in the next two sprints, and restate it as a hypothesis.",
    "continuous.s2": "Plan a spike for it: the smallest test, a timebox of a day or less, and the success signal — written before we start.",
    "continuous.s3": "Scaffold the throwaway spike, then turn my results into a spike report read against the signal.",
    "continuous.d1": "Prepare the decision on the spike result.",
    "continuous.s4": "Write or update the ADR for what the spike decided: context, decision, consequences.",
    "continuous.s5": "Write the enabler story with acceptance criteria (Given / When / Then) and link the spike and ADR.",
    "continuous.d2": "Check the story against our Definition of Ready, item by item.",
  };
  /* steps with no artifact of their own: what the agent hands back */
  ACT.promptOut = {};
})();
