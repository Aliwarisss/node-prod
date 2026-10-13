import type { ChapterQuestions } from "../types";

/* The questions each chapter answers — who, what, when, where, why, how — each tied to the section that answers it.
 * The reader ticks a question off once you've read its section, so a chapter shows how much of it you can now answer. */
export const discoverQuestions: ChapterQuestions = {
  opening: [
    { q: "What is Discover for, and what does it produce?", at: "what" },
    { q: "Why does Discover come before any design or build?", at: "what" },
    { q: "When does the act end, and with what decision?", at: "what" },
    { q: "Who is Northwind, and what are they asking for?", at: "case" },
    { q: "How should you read this book alongside the lessons?", at: "read" },
  ],
  "day-1": [
    { q: "What exactly is the client asking for, in one line?", at: "discover.context.brief" },
    { q: "How do you turn a brief into capabilities, inputs and outputs?", at: "discover.context.brief" },
    { q: "Where does the current system really start and end?", at: "discover.context.system" },
    { q: "How do you judge code health without opinions?", at: "discover.context.system" },
    { q: "Where is data created, copied and re-typed?", at: "discover.context.integrations" },
    { q: "Why is a test call worth more than the documentation?", at: "discover.context.integrations" },
    { q: "What is the difference between a constraint and an assumption?", at: "discover.context.constraints" },
    { q: "Who confirms the hard constraints, and how?", at: "discover.context.constraints" },
  ],
  "day-2": [
    { q: "Why must the problem be separated from the proposed solution?", at: "discover.frame.separate" },
    { q: "How do you ladder down from a solution to the real condition?", at: "discover.frame.separate" },
    { q: "What makes a hypothesis one that can be proved wrong?", at: "discover.frame.unknowns" },
    { q: "How do you rank unknowns so the scariest is tested first?", at: "discover.frame.unknowns" },
    { q: "What turns “fast” or “reliable” into a target?", at: "discover.frame.quality" },
    { q: "Who agrees the targets — the tech lead or the client?", at: "discover.frame.quality" },
    { q: "When is a spike the right test, and when is it not?", at: "discover.frame.spikes" },
    { q: "How long should a spike run, and what data may it use?", at: "discover.frame.spikes" },
  ],
  "day-3": [
    { q: "Where should you reproduce today’s flow — and where never?", at: "discover.problem.reproduce" },
    { q: "What does a good trace record at every step?", at: "discover.problem.reproduce" },
    { q: "Why measure the baseline before anything changes?", at: "discover.problem.baseline" },
    { q: "Why report medians and p95 rather than averages?", at: "discover.problem.baseline" },
    { q: "How do you find a root cause without blaming a person?", at: "discover.problem.causes" },
    { q: "Which causes do you keep, and how do you rank them?", at: "discover.problem.causes" },
    { q: "What are the five clauses of a technical problem statement?", at: "discover.problem.statement" },
    { q: "Why must the statement name no technology?", at: "discover.problem.statement" },
  ],
  "day-4": [
    { q: "What routes should every option scan cover — including doing nothing?", at: "discover.validate.scan" },
    { q: "Why are hard constraints checked before anything else?", at: "discover.validate.scan" },
    { q: "When must the scoring weights be fixed, and why?", at: "discover.validate.evaluate" },
    { q: "How do you score an option on evidence, not reputation?", at: "discover.validate.evaluate" },
    { q: "Which unknown deserves the prototype?", at: "discover.validate.prototype" },
    { q: "What happens to prototype code afterwards?", at: "discover.validate.prototype" },
    { q: "How do you sketch options so they can be compared fairly?", at: "discover.validate.architecture" },
  ],
  "day-5": [
    { q: "How do you rate feasibility, and what backs each rating?", at: "discover.decide.feasibility" },
    { q: "Why is an unknown never rated as low risk?", at: "discover.decide.feasibility" },
    { q: "Why estimate in low / likely / high, never one number?", at: "discover.decide.estimate" },
    { q: "Who hears about risks above the tech lead’s appetite?", at: "discover.decide.estimate" },
    { q: "What does each option give up, and how do you say so?", at: "discover.decide.compare" },
    { q: "Which option wins a close call?", at: "discover.decide.compare" },
    { q: "What goes into the ADR, and who accepts it?", at: "discover.decide.record" },
    { q: "What does PLAN receive when Discover ends?", at: "discover.decide.record" },
  ],
  closing: [
    { q: "What exactly do you hand to PLAN?", at: "handoff" },
    { q: "How do you know Discover is really finished?", at: "handoff" },
  ],
};
