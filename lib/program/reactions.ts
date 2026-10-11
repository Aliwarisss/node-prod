/* Client reactions — when a reviewer approves or sends back work, the person in the client's team who plays that role
   reacts to it, in their own voice: a sponsor cares about value and time, a portfolio owner about the process, a mentor
   coaches. The words are picked from the event, so the same event always gets the same reaction. Pure — client-safe. */
import type { Project } from "./projects";

export type Reaction = { person: string; role: string; initials: string; color: string; text: string; kind: "approved" | "changes" };

/* the client person playing a workflow role in this project ("Candidate sponsor" → the project's Sponsor) */
export function personFor(project: Project | null, role: string) {
  if (/mentor/i.test(role)) return "Your Node mentor";
  if (!project) return "";
  const r = role.toLowerCase();
  return project.people.find((p) => r.includes(p.role.toLowerCase()) || p.role.toLowerCase().includes(r))?.name ?? "";
}

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
const pick = <T,>(xs: T[], seed: string) => xs[hash(seed) % xs.length];
const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const COLORS = ["#a16207", "#9333ea", "#0f766e", "#c2410c", "#0284c7", "#be185d"];

type Voice = "sponsor" | "portfolio" | "tech" | "mentor" | "other";
const voiceOf = (role: string): Voice => (/sponsor/i.test(role) ? "sponsor" : /portfolio|pmo/i.test(role) ? "portfolio" : /tech lead|architect|engineer/i.test(role) ? "tech" : /mentor/i.test(role) ? "mentor" : "other");

const APPROVED: Record<Voice, string[]> = {
  sponsor: [
    "This is what I needed. {client} can move on this — thank you.",
    "Clear, and I can see the value. I’ll back it.",
    "Good. I can take this to the leadership meeting as it is.",
    "That answers my questions. Let’s keep the momentum.",
  ],
  portfolio: [
    "Logged and accepted — it fits the portfolio rules.",
    "Clean work. I can put this straight into the review pack.",
    "Approved. This is the standard I want from every team.",
    "Traceable and complete — easy to approve.",
  ],
  tech: [
    "Good — every claim has a source. I can build on this.",
    "Clear and checkable. This is how I want discovery written.",
    "Approved. You looked at the real system, not the wiki — that shows.",
    "Solid. The open questions are the right ones.",
  ],
  mentor: [
    "Nice work — you followed the template and backed your claims.",
    "Good progress. This is what “done” looks like here.",
    "Approved. Keep doing exactly this on the next one.",
  ],
  other: [
    "Thanks — this helps us a lot on the ground.",
    "This makes sense to us. Approved.",
    "Good. The team can work with this.",
  ],
};
const PERFECT: Record<Voice, string[]> = {
  sponsor: ["Honestly, the best piece of work I’ve seen on this so far.", "Outstanding. I’m sharing this with the board as an example."],
  portfolio: ["Flawless — I’m using this as the template for other teams.", "Perfect score. Nothing to add."],
  tech: ["That’s exactly what I’d want from a senior engineer.", "Perfect — nothing guessed, everything sourced."],
  mentor: ["Full marks. That’s a model answer.", "Perfect — every criterion met. Well done."],
  other: ["Spot on. Exactly what we needed.", "Perfect — we couldn’t have asked for more."],
};
const CHANGES: Record<Voice, string[]> = {
  sponsor: ["I can’t sign this off yet — {comment}", "Not there yet. {comment}", "Before I commit budget: {comment}"],
  portfolio: ["This won’t pass the portfolio review as it is. {comment}", "Close, but {lcomment}", "I need one more pass: {comment}"],
  tech: ["I can’t build on this yet — {comment}", "Show me the evidence: {comment}", "Close. {comment}"],
  mentor: ["Good effort — one thing to fix: {comment}", "Almost. {comment} Then send it back.", "Let’s tighten this: {comment}"],
  other: ["We’re not sure this works for us yet. {comment}", "Can you take another look? {comment}"],
};

export function reactionOf(o: { project: Project | null; role: string; kind: "approved" | "changes"; artifact: string; pct?: number | null; comment?: string; seed: string }): Reaction {
  const person = personFor(o.project, o.role) || `the ${o.role}`;
  const voice = voiceOf(o.role);
  const client = o.project?.client ?? "the client";
  const comment = (o.comment ?? "").trim().replace(/\s+$/, "") || "it needs another pass against the rubric.";
  const lines = o.kind === "changes" ? CHANGES[voice] : o.pct === 100 ? PERFECT[voice] : APPROVED[voice];
  const text = pick(lines, o.seed).replace("{client}", client).replace("{comment}", comment).replace("{lcomment}", lc(comment));
  const name = person.split(",")[0];
  const initials = /mentor/i.test(person) ? "NM" : name.replace(/^(Dr\.|Mr\.|Ms\.)\s+/, "").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return { person, role: o.role, initials, color: COLORS[hash(person) % COLORS.length], text, kind: o.kind };
}
