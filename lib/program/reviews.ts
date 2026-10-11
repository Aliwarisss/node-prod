import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel } from "@/lib/models/user";

import { deliverablesOf } from "./deliverables";
import { getLens, getTemplate } from "./index";
import { projectById } from "./projects";
import { rubricOf, type Criterion } from "./rubrics";
import { lessonOf, toView, type SubmissionView } from "./submissions";

/* What an admin needs to review a deliverable as the role it's reported to: the trainee, their project, the work, the
   rubric to grade it on (what good looks like, the workflow's criteria and checks, what each lens asks at this step, the
   standard criteria — for a decision: the question, its branches and the recommendation) with the trainee's own score,
   and the lesson's gate criteria to verify. */
export type VerifyItem = { text: string; source: string };
export type ReviewItem = SubmissionView & {
  trainee: { name: string; email: string };
  project: { client: string; name: string; color: string; icon: string } | null;
  day: number;
  lessonTitle: string;
  lessonCode: string;
  artifact: string;
  step: string;
  by: string;
  toRole: string;
  templateTitle: string;
  verify: VerifyItem[];
  rubric: Criterion[];
};

const list = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);

export async function listReviews(): Promise<ReviewItem[]> {
  await connectToDatabase();
  const rows = await SubmissionModel.find({ status: { $in: ["submitted", "changes", "approved"] } }).sort({ submittedAt: -1 }).limit(400).lean();
  const ids = [...new Set(rows.map((r) => r.userId))].filter((id) => isValidObjectId(id));
  const users = await UserModel.find({ _id: { $in: ids } }, { name: 1, email: 1 }).lean();
  const who = Object.fromEntries(users.map((u) => [String(u._id), { name: u.name || u.email || "Trainee", email: u.email ?? "" }]));
  return rows.map((r) => {
    const lesson = lessonOf(r.day, r.fid);
    const ctl = ((lesson?.contract ?? {}).controls ?? {}) as Record<string, unknown>;
    const t = getTemplate(r.template ?? "");
    const p = projectById(r.projectId);
    const all = lesson ? deliverablesOf(lesson) : [];
    const d = all.find((x) => x.key === r.key);
    const rubric = lesson && d ? rubricOf(lesson, d, all, { template: getTemplate, lens: getLens }) : [];
    const verify: VerifyItem[] = [];
    for (const c of [...list(ctl.criteria), ...(lesson?.criteria ?? [])]) if (c && !verify.some((v) => v.text === c)) verify.push({ text: c, source: "Gate criteria" });
    return {
      ...toView(r as never),
      trainee: who[r.userId] ?? { name: "Trainee", email: "" },
      project: p ? { client: p.client, name: p.name, color: p.color, icon: p.icon } : null,
      day: r.day,
      lessonTitle: r.lessonTitle || lesson?.title || "",
      lessonCode: lesson?.code ?? "",
      artifact: r.artifact,
      step: r.step ?? "",
      by: r.by ?? "",
      toRole: r.toRole,
      templateTitle: t ? String((t.tpl as { title?: string } | null)?.title ?? t.id).replace(/\s*[—-]?\s*\{[^}]*\}/g, "").trim() : "",
      verify,
      rubric,
    };
  });
}
