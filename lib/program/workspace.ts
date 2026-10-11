import { SubmissionModel } from "@/lib/models/submission";
import { getKnowledge, getTemplate, type Template } from "@/lib/program";
import { boardTemplate } from "@/lib/program/boards";
import { getWorkspaceDocs } from "@/lib/program/submissions";

const RANK: Record<string, number> = { changes: 4, submitted: 3, approved: 2, draft: 1 };

/* A trainee's submissions: every living document they keep through the month, with where it stands in review
   (the most pressing status across its hand-ins) and the lessons that used it */
export async function workspaceItems(userId: string) {
  const [docs, subs] = await Promise.all([
    getWorkspaceDocs(userId),
    SubmissionModel.find({ userId }, { template: 1, fid: 1, key: 1, status: 1, day: 1, lessonTitle: 1 }).lean(),
  ]);
  const templates: Record<string, Template> = {};
  const items = Object.values(docs).map((d) => {
    const k = d.ref.startsWith("knowledge:") ? getKnowledge(d.ref.slice(10)) : null;
    const t = d.ref.startsWith("lesson:") ? null : k ? boardTemplate(k, d.ref.slice(10)) : getTemplate(d.ref);
    if (t) templates[t.id] = t;
    const mine = subs.filter((s) => (t ? s.template === t.id : d.ref === `lesson:${s.fid}|${s.key}`));
    const status = mine.map((s) => s.status).sort((a, b) => (RANK[b] ?? 0) - (RANK[a] ?? 0))[0] ?? "";
    return { ...d, template: t, status, used: mine.map((s) => ({ day: s.day, lesson: s.lessonTitle ?? "" })) };
  });
  return { items, templates };
}
