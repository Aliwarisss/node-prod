import { connectToDatabase } from "@/lib/mongodb";
import { SubmissionModel, type SubmissionStatus } from "@/lib/models/submission";
import { WorkspaceDocModel } from "@/lib/models/workspace-doc";

import { getDay, type Lesson } from "./index";

/* A trainee's deliverables and workspace documents, as plain data for the client */
export type GradeView = { total: number; max: number; pct: number; pass: boolean };
export type SubmissionEvent = { kind: "submitted" | "changes" | "approved"; by: string; role: string; comment: string; checks: string[]; scores: Record<string, number> | null; grade: GradeView | null; at: string };
export type Upload = { id: string; name: string; type: string; size: number } | null;
export type SubmissionView = { id: string; fid: string; key: string; kind: string; status: SubmissionStatus; content: string; version: number; ticks: string[]; selfScores: Record<string, number>; grade: GradeView | null; upload: Upload; submittedAt: string | null; history: SubmissionEvent[] };
export type WorkspaceDocView = { ref: string; title: string; fmt: string; data: unknown; text: string; upload: Upload; updatedAt: string | null };

type RawUpload = { id?: string | null; name?: string | null; mime?: string | null; size?: number | null } | null | undefined;
const up = (u: RawUpload): Upload => (u && u.id ? { id: u.id, name: u.name ?? "file", type: u.mime ?? "", size: u.size ?? 0 } : null);

type Raw = { _id: unknown; fid: string; key: string; kind?: string | null; status: string; content?: string | null; version?: number | null; ticks?: string[] | null; selfScores?: Record<string, number> | null; grade?: GradeView | null; upload?: RawUpload; submittedAt?: Date | null; history?: { kind: string; by?: string | null; role?: string | null; comment?: string | null; checks?: string[] | null; scores?: Record<string, number> | null; grade?: GradeView | null; at?: Date | null }[] };
export const toView = (s: Raw): SubmissionView => ({
  id: String(s._id),
  fid: s.fid,
  key: s.key,
  kind: s.kind ?? "artifact",
  status: s.status as SubmissionStatus,
  content: s.content ?? "",
  version: s.version ?? 0,
  ticks: s.ticks ?? [],
  selfScores: s.selfScores ?? {},
  grade: s.grade ?? null,
  upload: up(s.upload),
  submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : null,
  history: (s.history ?? []).map((h) => ({ kind: h.kind as SubmissionEvent["kind"], by: h.by ?? "", role: h.role ?? "", comment: h.comment ?? "", checks: h.checks ?? [], scores: h.scores ?? null, grade: h.grade ?? null, at: h.at ? new Date(h.at).toISOString() : "" })),
});

type RawDoc = { ref: string; title?: string | null; fmt?: string | null; data?: unknown; text?: string | null; upload?: RawUpload; updatedAt?: Date | null };
export const toDocView = (d: RawDoc): WorkspaceDocView => ({ ref: d.ref, title: d.title ?? "", fmt: d.fmt ?? "doc", data: d.data ?? null, text: d.text ?? "", upload: up(d.upload), updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null });

/* keyed "fid|key" */
export async function getSubmissions(userId: string, day: number): Promise<Record<string, SubmissionView>> {
  await connectToDatabase();
  const rows = await SubmissionModel.find({ userId, day }).lean();
  return Object.fromEntries(rows.map((r) => [`${r.fid}|${r.key}`, toView(r as unknown as Raw)]));
}

/* the trainee's workspace documents (all, or just these refs), keyed by ref */
export async function getWorkspaceDocs(userId: string, refs?: string[]): Promise<Record<string, WorkspaceDocView>> {
  await connectToDatabase();
  const rows = await WorkspaceDocModel.find(refs ? { userId, ref: { $in: refs } } : { userId }).sort({ updatedAt: -1 }).lean();
  return Object.fromEntries(rows.map((r) => [r.ref, toDocView(r as unknown as RawDoc)]));
}

export function lessonOf(day: number, fid: string): Lesson | null {
  return getDay(day)?.processes.flatMap((p) => p.lessons).find((l) => l.fid === fid) ?? null;
}

/* a deliverable counts as handed in once it's been submitted (and stays so while approved) */
export const HANDED_IN: SubmissionStatus[] = ["submitted", "approved"];
