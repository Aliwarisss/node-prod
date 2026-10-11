import type { Lesson } from "./index";

/* What a lesson asks the trainee to hand in, and to whom.
 * - Each document a workflow step produces is a deliverable, reported to the role that receives it: the next step's
 *   owner when the work is handed straight on (a pitch to the sponsor who decides on it), otherwise the lesson's
 *   accountable (A) role, otherwise its authority.
 * - Each decision step is a decision request: the trainee prepares the brief, the decider (an admin) makes the call.
 * - Lessons without a book workflow hand in their written work to the program mentor.
 * Every one of those roles is played by Node's admins. `ref` is the workspace document it's built in: the template
 * (so a log or register carries on across steps and lessons), or a lesson-only document. */

export type Deliverable = { key: string; kind: "artifact" | "decision" | "work"; artifact: string; template: string | null; ref: string; by: string; to: string; step: string; stepId: string; workflowId: string };

const roleName = (r: string) => r.replace(/^[ARCI]\s*[—-]\s*/, "").split(/[,;(]/)[0].trim();

/* how a task connects: what it starts from (the previous task's output, or the workflow's own inputs) and where its
   output goes next (the next task, or — at the end of the workflow — the lesson's handoff) */
export type TaskLinks = { input: { label: string; key?: string }[]; next: { label: string; key?: string } | null };
export function linksOf(lesson: Lesson, d: Deliverable, all: Deliverable[]): TaskLinks {
  const flow = all.filter((x) => x.workflowId === d.workflowId);
  const i = flow.findIndex((x) => x.key === d.key);
  const prev = i > 0 ? flow[i - 1] : null, after = i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
  const w = lesson.workflows.find((x) => x.id === d.workflowId);
  const wc = (w?.contract ?? {}) as Record<string, unknown>;
  const arts = ((lesson.contract ?? {}).artifacts ?? {}) as Record<string, unknown>;
  const cont = ((lesson.contract ?? {}).continuity ?? {}) as Record<string, unknown>;
  const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
  const input = prev ? [{ label: prev.kind === "decision" ? `${prev.artifact.replace(/^Decision · /, "")} — the decision` : prev.artifact, key: prev.key }] : (list(wc.inputs).length ? list(wc.inputs) : list(arts.inputs)).map((label) => ({ label }));
  const next = after ? { label: after.kind === "decision" ? `the decision: ${after.artifact.replace(/^Decision · /, "")}` : after.artifact, key: after.key } : cont.handoff ? { label: String(cont.handoff) } : null;
  return { input, next };
}

export function deliverablesOf(lesson: Lesson): Deliverable[] {
  const ex = ((lesson.contract ?? {}).execution ?? {}) as Record<string, unknown>;
  const roles = Array.isArray(ex.roles) ? (ex.roles as string[]) : [];
  const accountable = roles.find((r) => /^A\s*[—-]/.test(r));
  const authority = typeof ex.authority === "string" ? ex.authority.split(/[;.]/)[0] : "";
  const fallback = accountable ? roleName(accountable) : authority ? roleName(authority.replace(/\s+(confirms|approves|decides|resolves|signs).*$/i, "")) : "Mentor";

  const out: Deliverable[] = [];
  const seen = new Set<string>();
  for (const w of lesson.workflows) {
    w.steps.forEach((s, i) => {
      if (s.decision) {
        const prev = w.steps[i - 1];
        out.push({ key: `${w.id}.${s.id}`, kind: "decision", artifact: `Decision · ${s.title}`, template: null, ref: `lesson:${lesson.fid}|${w.id}.${s.id}`, by: prev?.actor || "Discovery lead", to: roleName(s.actor) || fallback, step: s.title, stepId: s.id, workflowId: w.id });
        return;
      }
      if (!s.out || seen.has(s.out)) return;
      seen.add(s.out);
      const after = w.steps[i + 1];
      const next = after && after.actor && after.actor !== s.actor ? after : null;
      out.push({ key: `${w.id}.${s.id}`, kind: "artifact", artifact: s.out, template: s.template, ref: s.template || `lesson:${lesson.fid}|${w.id}.${s.id}`, by: s.actor, to: next ? roleName(next.actor) : fallback, step: s.title, stepId: s.id, workflowId: w.id });
    });
  }
  if (!out.length) out.push({ key: "work", kind: "work", artifact: "Your work", template: null, ref: `lesson:${lesson.fid}|work`, by: "You", to: "Mentor", step: lesson.title, stepId: "", workflowId: "" });
  return out;
}
