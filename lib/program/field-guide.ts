/* The NODE contract, field by field — what each field is, why it's there, when you reach for it, and how to write a good one.
 * Keyed "section.field" (some names repeat across sections: knowledge.tools vs execution.tools, lenses.evidence vs artifacts.evidence).
 * Used by the lesson's guided walk-through; the lesson's own value for the field is shown alongside. */

export type FieldGuide = { what: string; why: string; when: string; how: string; example?: string };

export const FIELD_GUIDE: Record<string, FieldGuide> = {
  /* ---------- 1 · Definition ---------- */
  "definition.purpose": {
    what: "One or two sentences on why this unit of work exists — the problem it removes or the value it creates.",
    why: "Everything else in the contract is judged against it. If a step, a check or a document doesn’t serve the purpose, it’s waste.",
    when: "Write it first, before any steps. Re-read it whenever the work starts to drift or someone asks “why are we doing this?”.",
    how: "Start with a verb, name who benefits, and keep it about value, not activity. “Anchor discovery to an accountable sponsor” — not “hold a meeting”.",
  },
  "definition.outcome": {
    what: "The change in the world once the unit is finished — the state that’s true afterwards that wasn’t before.",
    why: "Activity can look busy without changing anything. The outcome is how you know the work actually landed.",
    when: "Right after the purpose; check against it when you decide whether the unit is really done.",
    how: "Describe an end state you could observe, not a task: “A named, committed sponsor and a recorded trigger”.",
  },
  "definition.jtbd": {
    what: "The Job To Be Done — the progress the people doing (or receiving) this work are trying to make, in their words.",
    why: "It keeps the unit centred on a real need. Steps that don’t help the job get done are candidates to drop.",
    when: "When framing the unit and whenever you design a document or step for someone else to use.",
    how: "Use the form “When …, I want to …, so I can …”. Keep it about the person’s situation and goal, not your solution.",
  },
  "definition.entry": {
    what: "The conditions that must be true before work on this unit may start.",
    why: "Starting without them means building on sand — you’ll redo the work once the missing input shows up.",
    when: "At the moment you’re about to begin: check every entry condition, and don’t start if one is missing.",
    how: "List concrete, checkable facts (“Opportunity raised by any source”, “Sponsor named”), not feelings like “team ready”.",
  },
  "definition.exit": {
    what: "The conditions that must be true for the unit to count as complete.",
    why: "Without a clear exit, work either never ends or ends too early. It’s also what the next unit relies on.",
    when: "Agree it up front; use it as the finish line and as the checklist at the gate.",
    how: "Write verifiable statements — each one someone else could confirm with evidence: “Sponsor confirmed in writing”.",
  },

  /* ---------- 2 · Flow ---------- */
  "flow.normal": {
    what: "The default sequence of steps the work follows when nothing unusual happens.",
    why: "It gives everyone the same mental model of the work and is the backbone the workflow map is drawn from.",
    when: "When planning the unit and when onboarding someone into it. It’s the path you follow on a normal day.",
    how: "List the steps in order, each starting with a verb, each producing something. Keep it to the few steps that matter.",
  },
  "flow.parallel": {
    what: "Work inside the unit that can safely run at the same time.",
    why: "Running independent steps side by side shortens the unit without adding risk.",
    when: "When planning who does what, and when the timebox is tight.",
    how: "Name the steps that don’t depend on each other’s outputs. If one needs the other’s result, it isn’t parallel.",
  },
  "flow.dependencies": {
    what: "The inputs, people, teams and systems this unit waits on.",
    why: "Most delays come from waiting. Naming dependencies lets you chase them early instead of discovering them late.",
    when: "Before you start, and whenever the work stalls — the cause is usually here.",
    how: "Name each dependency specifically (who or what, and what you need from it), not “other teams”.",
  },
  "flow.stateTransitions": {
    what: "The states the work moves through and what moves it from one to the next.",
    why: "States make progress visible — anyone can see where the work is without asking.",
    when: "When tracking the unit on a board or in a tool, and in status updates.",
    how: "Write them as a chain, “Raised → Scoping → Context mapped → Brief reviewed”, each a state you could label a card with.",
  },

  /* ---------- 3 · Cases ---------- */
  "cases.happyPath": {
    what: "The scenario where everything goes as expected.",
    why: "It’s the reference case: you design for it first and measure every other case against it.",
    when: "First, when designing the unit; then as the baseline you compare surprises to.",
    how: "Describe the ideal run in a sentence, with the conditions that make it ideal: “Clear sponsor, available strategy, accessible stakeholders”.",
  },
  "cases.alternates": {
    what: "Other valid ways to reach the same outcome.",
    why: "Real work rarely runs one way. Naming alternates stops people treating a legitimate variation as a failure.",
    when: "When the happy path’s conditions don’t hold but the outcome is still reachable.",
    how: "For each alternate, say what triggers it and how the route differs: “Sponsor already known → skip discovery of sponsor”.",
  },
  "cases.edgeCases": {
    what: "Boundary situations that are rare or extreme but must still work.",
    why: "Edge cases are where things quietly break. Naming them means they get tested and handled on purpose.",
    when: "When reviewing a design, writing checks, or when “that would never happen” is said out loud.",
    how: "Name the boundary and the expected behaviour: “Two sponsors claim the work → pick one accountable, record the other as consulted”.",
  },
  "cases.exceptions": {
    what: "Foreseeable deviations that have a defined way of being handled.",
    why: "Deciding the handling in advance turns a crisis into a routine.",
    when: "When something goes off-plan in a way you predicted — follow the handling instead of improvising.",
    how: "Pair each exception with its response: “No sponsor after two attempts → escalate to the portfolio owner”.",
  },
  "cases.failures": {
    what: "Breakdowns where the unit can’t continue as designed and needs recovery.",
    why: "Knowing how things fail — and how to recover — protects the people and the work downstream.",
    when: "When the unit can’t reach its exit, or a check shows it was reached falsely.",
    how: "State the failure, its signal, and the recovery: “Strategy can’t be found → park and record what’s missing”.",
  },

  /* ---------- 4 · Routing ---------- */
  "routing.forward": {
    what: "Where the work goes when the exit conditions are met — the normal handoff.",
    why: "A clear forward route means finished work moves on immediately instead of sitting in a queue.",
    when: "At the gate, once every exit condition is true.",
    how: "Name the receiving unit or person and what they get: “Context brief → Frame the idea”.",
  },
  "routing.alternate": {
    what: "A different but valid route out of the unit.",
    why: "Some results legitimately go elsewhere — reuse, a fast lane, another team. Naming it avoids forcing them down the wrong path.",
    when: "When the gate outcome is “yes, but not the usual way”.",
    how: "Say the trigger and the destination: “Repeat initiative → reuse and fast-track to planning”.",
  },
  "routing.rework": {
    what: "Sending the work back to an earlier step to fix it.",
    why: "Rework is normal — making it an explicit route keeps it visible, bounded and learnable instead of hidden.",
    when: "When a check or the gate finds something wrong that can be corrected.",
    how: "Name where it goes back to and why: “Brief challenged at review → back to stakeholder mapping”.",
  },
  "routing.escalation": {
    what: "Raising the work to someone with more authority.",
    why: "Some calls can’t be made at this level. Escalating on purpose is faster than stalling.",
    when: "When a decision is beyond your authority, or the unit is blocked past its timebox.",
    how: "Name who it goes to and what triggers it: “No sponsor after two attempts → portfolio owner”.",
  },
  "routing.stop": {
    what: "Ending the work deliberately — stopping or parking it — and recording why.",
    why: "Stopping the wrong work early is a success, not a failure. Recording why keeps the learning.",
    when: "When the work no longer makes sense: out of strategy, no value, or no sponsor.",
    how: "State the stop condition and what gets recorded: “Outside strategy → decline with reason, log the learning”.",
  },

  /* ---------- 5 · Controls ---------- */
  "controls.criteria": {
    what: "The definition of “good enough” — the standard the result is judged against.",
    why: "Without criteria, quality is opinion. With them, anyone can say whether the work passes.",
    when: "Agree them before the work; use them at the gate.",
    how: "Make each one checkable: “Each stakeholder has a role and influence rating”, not “stakeholders understood”.",
  },
  "controls.checks": {
    what: "Verifications done during the work, not just at the end.",
    why: "Catching problems mid-way is far cheaper than finding them at the gate.",
    when: "At the points in the flow where a mistake would otherwise carry forward.",
    how: "Name what is checked and against what: “Stakeholder map validated with sponsor”.",
  },
  "controls.gates": {
    what: "The decision points that allow the work to move on — or block it.",
    why: "Gates protect everything downstream from unfinished or wrong work.",
    when: "At the end of the unit (and at any inner decision point).",
    how: "Name the gate, who decides, and on what basis — the criteria above.",
  },
  "controls.rules": {
    what: "Hard constraints that must never be broken.",
    why: "Rules guard against the outcomes that would be unacceptable — legal, safety, ethical, or trust-breaking.",
    when: "All the time. If a rule would be broken, stop and escalate.",
    how: "Write them as absolutes: “Never record personal data without consent”. Keep the list short.",
  },
  "controls.policies": {
    what: "Organisational guidance the unit follows — the “how we do things here”.",
    why: "Policies keep work consistent across teams and auditable later.",
    when: "When choosing how to do a step, and when someone asks whether something is allowed.",
    how: "Reference the policy by name and say how it applies here.",
  },

  /* ---------- 6 · Knowledge ---------- */
  "knowledge.frameworks": {
    what: "Established structures for thinking about the problem (e.g. a strategy or architecture framework).",
    why: "They save you inventing structure from scratch and make your work recognisable to others.",
    when: "When you need to organise a messy problem or explain it to others.",
    how: "Name the framework and the part of it you use — not the whole thing.",
  },
  "knowledge.standards": {
    what: "Formal standards that apply (ISO, IEEE, industry or regulatory).",
    why: "Following a standard makes the work credible and often compliant by default.",
    when: "When the work must stand up to audit, regulation or a customer’s requirements.",
    how: "Cite the standard and the clause or idea you apply: “ISO 31000 — establishing context”.",
  },
  "knowledge.patterns": {
    what: "Proven solutions to recurring problems.",
    why: "Patterns carry other people’s hard-won lessons — and their names make discussion faster.",
    when: "When the problem in front of you looks like one others have solved.",
    how: "Name the pattern and why it fits this situation.",
  },
  "knowledge.practices": {
    what: "Habitual ways of working that are known to help.",
    why: "Good practices make quality repeatable without heavy process.",
    when: "Day to day, while doing the steps.",
    how: "Name the practice and the step it applies to.",
  },
  "knowledge.principles": {
    what: "Guiding truths to fall back on when no rule tells you what to do.",
    why: "Principles let people make good calls in situations nobody planned for.",
    when: "When you face a judgement call or a trade-off.",
    how: "State the principle in one line and how it tilts decisions here.",
  },
  "knowledge.methods": {
    what: "Step-by-step approaches for producing a result (e.g. a discovery or analysis method).",
    why: "Methods make a result reproducible — someone else could follow the same route.",
    when: "When a step needs a structured approach rather than improvisation.",
    how: "Name the method and the step it drives.",
  },
  "knowledge.techniques": {
    what: "Specific tools of the trade used inside a step (e.g. Five Whys, a power–interest grid).",
    why: "The right technique turns a vague step into a concrete, quick one.",
    when: "Inside a step, when you need to get an answer out of people or data.",
    how: "Name the technique and what it produces: “Five Whys on the trigger → root reason”.",
  },
  "knowledge.tools": {
    what: "The software and instruments that support the knowledge work.",
    why: "Agreed tools make outputs shareable and keep the trace in one place.",
    when: "When choosing where the work and its documents will live.",
    how: "Name the tool and what it’s used for here.",
  },

  /* ---------- 7 · Lenses ---------- */
  "lenses.applicable": {
    what: "The viewpoints (business, user, security, legal, operations…) relevant to this unit.",
    why: "Each lens sees risks the others miss. Listing them prevents blind spots.",
    when: "When planning the unit and when reviewing its output.",
    how: "Pick only lenses that genuinely have something at stake here.",
  },
  "lenses.required": {
    what: "The lenses that must be engaged — their review isn’t optional.",
    why: "Some perspectives (e.g. legal, security) carry consequences too costly to skip.",
    when: "Before the gate: their sign-off or input is part of passing.",
    how: "Name the lens and what engagement means: a review, a sign-off, a consult.",
  },
  "lenses.concerns": {
    what: "What each lens worries about in this unit.",
    why: "Knowing the worries up front lets you address them in the work instead of in a late review.",
    when: "When designing the steps and when preparing for review.",
    how: "One line per concern, tied to its lens: “Security — sponsor data shared too widely”.",
  },
  "lenses.constraints": {
    what: "The limits each lens imposes on the work.",
    why: "Constraints shape the solution space early, saving redesign later.",
    when: "When choosing how to do the work.",
    how: "State the limit and its source: “Legal — no commitments before approval”.",
  },
  "lenses.evidence": {
    what: "What each lens needs to see to be satisfied.",
    why: "It tells you exactly what to produce for review — no guessing, no over-producing.",
    when: "When planning outputs and before the gate.",
    how: "Name the artefact or proof each lens expects.",
  },
  "lenses.decisions": {
    what: "The decisions each lens has a say in.",
    why: "Making decision rights explicit avoids both overreach and surprises.",
    when: "Whenever a decision touches that lens’s area.",
    how: "List the decision and the lens with a voice in it.",
  },

  /* ---------- 8 · Execution ---------- */
  "execution.agents": {
    what: "Who or what performs the work — people, AI agents and automations.",
    why: "Being explicit about agents makes it clear what an AI may draft and what a person must do or decide.",
    when: "When assigning work and when setting up your agent for a step.",
    how: "Name each performer and its part: “Discovery agent drafts the brief; the lead reviews”.",
  },
  "execution.roles": {
    what: "Accountabilities, usually as RACI — Responsible, Accountable, Consulted, Informed.",
    why: "Exactly one person is accountable. RACI ends “I thought you were doing it”.",
    when: "At the start, and whenever ownership is unclear.",
    how: "One line per role: “A — Sponsor”, “R — Discovery lead”. One A only.",
  },
  "execution.tools": {
    what: "The systems used to do and record the work.",
    why: "Shared tools keep the work visible and the trace intact.",
    when: "When setting up the unit.",
    how: "Name the system and what lives in it.",
  },
  "execution.authority": {
    what: "Who may approve, override, escalate or stop the work.",
    why: "When things go wrong, everyone needs to know who can make the call — fast.",
    when: "At the gate, on escalation, and whenever a rule might be broken.",
    how: "Name the person or role for each power: “Sponsor confirms scope; portfolio owner resolves conflicts”.",
  },

  /* ---------- 9 · Artifacts ---------- */
  "artifacts.inputs": {
    what: "What the unit consumes from upstream.",
    why: "If an input is missing or poor, the output will be too. Naming them makes the dependency checkable.",
    when: "Before starting — check you have each input.",
    how: "Name each document or data set by its standard name.",
  },
  "artifacts.outputs": {
    what: "What the unit produces for downstream.",
    why: "Outputs are the tangible result of the work and what the next unit builds on.",
    when: "Plan them first; produce them during the steps; hand them on at the gate.",
    how: "Name each artefact with its template, so anyone produces the same shape.",
  },
  "artifacts.evidence": {
    what: "Proof that the controls ran and the decisions are justified.",
    why: "Evidence lets someone who wasn’t there trust the result — and audit it later.",
    when: "Collected as you go; presented at the gate.",
    how: "Name what proves each control: a signed note, a review record, a test result.",
  },

  /* ---------- 10 · Continuity ---------- */
  "continuity.handoff": {
    what: "What is handed to whom when the unit completes.",
    why: "Work dies in handoffs. A named handoff means nothing falls through the gap.",
    when: "At the gate, as the last act of the unit.",
    how: "Say what, to whom, and in what state: “Context brief and stakeholder map → framing lead”.",
  },
  "continuity.traceability": {
    what: "The IDs this unit creates or carries forward so the work can be traced end to end.",
    why: "Traceability connects a business need to the code and back — vital for change, audit and learning.",
    when: "Whenever you create an artefact, link it to the IDs it came from.",
    how: "Name the ID scheme and what it links: “OPP-### links to brief and stakeholder map”.",
  },
  "continuity.timebox": {
    what: "The typical duration and effort for the unit in a real team.",
    why: "A timebox stops work expanding forever and makes slippage visible early.",
    when: "When planning, and as a trigger: past the timebox, review or escalate.",
    how: "Give a realistic range: “1–3 days, 4–8 hours of effort”.",
  },
  "continuity.measures": {
    what: "How the performance of the unit is measured.",
    why: "What gets measured gets improved — and shows whether the unit is worth its cost.",
    when: "Set up when planning; reviewed after each run.",
    how: "Pick a few measurable signals: lead time, rework rate, first-time pass at the gate.",
  },
  "continuity.learning": {
    what: "What is captured to improve the unit next time, and where it’s kept.",
    why: "Without captured learning, every team repeats the same mistakes.",
    when: "At the end of the unit — and whenever something surprising happens.",
    how: "Say what to capture and where: “Sponsor issues → retro log, reviewed monthly”.",
  },
};
