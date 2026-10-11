import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { ProgramProgressModel } from "@/lib/models/program-progress";
import { ReplyModel, ThreadModel } from "@/lib/models/board";
import { PracticeRepModel } from "@/lib/models/practice-rep";
import { SubmissionModel } from "@/lib/models/submission";
import { UserModel } from "@/lib/models/user";

import { deliverablesOf } from "./deliverables";
import { ACT_COLORS, dataVersion, daySummaries, getDay, getLens, getTemplate, TOTAL_DAYS } from "./index";
import { currentDay, getProgress, isDayOpen, type Progress } from "./progress";
import { projectById } from "./projects";
import { rubricOf } from "./rubrics";
import { lessonOf } from "./submissions";

/* A trainee's progress through the program, measured three ways — and rolled up overall, by stage (act) and by day:
 * - completion: lessons and days done, tasks (deliverables) handed in and approved;
 * - quality: rubric grades from the reviewers (average, pass rate, first-time pass), and how well the trainee's own
 *   score matches the reviewer's (calibration);
 * - skills: the rubric criteria grouped by what they test (artifact quality, lenses, evidence, traceability…);
 * plus activity (active days, streak) and what needs attention (work sent back, work in review). */

export type Count = { done: number; total: number };
export type Tasks = { total: number; submitted: number; approved: number; changes: number; inReview: number };
export type GradeSum = { pct: number; graded: number; passed: number } | null;
export type DayStat = {
  day: number; title: string; actId: string; open: boolean; complete: boolean; current: boolean;
  lessons: Count; tasks: Tasks; grade: GradeSum; selfPct: number | null;
  lessonRows: { fid: string; code: string; title: string; done: boolean; tasks: Tasks; grade: GradeSum }[];
};
export type StageStat = { id: string; n: string; name: string; color: string; gate: string; days: number[]; daysDone: number; lessons: Count; tasks: Tasks; grade: GradeSum; status: "done" | "active" | "upcoming" };
export type SkillStat = { key: string; label: string; icon: string; avg: number; pct: number; scored: number };
export type Activity = { at: string; kind: "submitted" | "changes" | "approved"; artifact: string; day: number; role: string; gradePct: number | null; pass: boolean | null };
/* XP: what the trainee earned, when — the gamification layer (levels, badges, ranking) is built on it */
export type XpEvent = { at: string; xp: number; kind: "lesson" | "day" | "stage" | "handin" | "approved" | "firsttime" | "perfect" | "rework" | "active" | "practice" | "answer"; label: string };
/* the start of a season — a calendar week, Monday 00:00 UTC */
export function weekStart(d: Date | string | number) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate() - day));
}
export type Rep = { skill: string; correct: number; total: number; xp: number; at: string };
export const XP = { lesson: 50, day: 100, stage: 300, handin: 10, approved: 20, gradeBonus: 10, firsttime: 15, perfect: 25, rework: 10, active: 5, answer: 15 } as const;
/* an answer of theirs that the asker (or a mentor) accepted on the board */
export type Answer = { title: string; at: string };
/* every accepted answer on the board, by who wrote it */
async function acceptedAnswers(userId?: string): Promise<(Answer & { authorId: string })[]> {
  const threads = await ThreadModel.find({ answerId: { $ne: "" } }, { answerId: 1, title: 1, authorId: 1, updatedAt: 1 }).lean();
  if (!threads.length) return [];
  const replies = await ReplyModel.find({ _id: { $in: threads.map((t) => t.answerId).filter((id) => isValidObjectId(id)) }, ...(userId ? { authorId: userId } : {}) }, { authorId: 1 }).lean();
  return replies
    .map((r) => ({ r, t: threads.find((x) => x.answerId === String(r._id))! }))
    .filter(({ r, t }) => r.authorId !== t.authorId) // answering your own question doesn't count
    .map(({ r, t }) => ({ authorId: r.authorId, title: t.title, at: (t as { updatedAt?: Date }).updatedAt ? new Date((t as { updatedAt?: Date }).updatedAt!).toISOString() : "" }));
}
export type Attention = { fid: string; key: string; day: number; artifact: string; role: string; comment: string; kind: "changes" | "submitted" };
export type ProgramStats = {
  project: { client: string; name: string; color: string; icon: string } | null;
  current: number;
  overall: {
    completion: number; lessons: Count; days: Count; tasks: Tasks; grade: GradeSum;
    firstTimePass: number | null; calibration: number | null; best: number | null; perfect: number; activeDays: number; streak: number; startedAt: string | null; lastActive: string | null;
  };
  stages: StageStat[];
  days: DayStat[];
  skills: SkillStat[];
  recent: Activity[];
  attention: Attention[];
  xp: XpEvent[];
  counts: { firstTime: number; perfect: number; reworkWins: number; graded: number; answers: number };
  /* practice reps per skill, and the streak's shield (one missed day a week doesn't break it) */
  practice: Record<string, { reps: number; correct: number; total: number; last: string | null }>;
  shield: { usedThisWeek: boolean; savedDays: number };
};

/* what each rubric criterion tests, by where it comes from */
export const SKILLS: { key: string; label: string; icon: string; test: (source: string) => boolean }[] = [
  { key: "quality", label: "Artifact quality", icon: "workspace_premium", test: (s) => s === "Artifact quality" },
  { key: "workflow", label: "Workflow criteria & checks", icon: "account_tree", test: (s) => / criteria$/.test(s) || s === "Workflow check" },
  { key: "lenses", label: "Seeing through the lenses", icon: "visibility", test: (s) => / lens$/.test(s) },
  { key: "decisions", label: "Decision briefs", icon: "gavel", test: (s) => s === "Decision brief" || s === "Workflow branch" },
  { key: "template", label: "Using the template", icon: "dashboard_customize", test: (s) => s === "Template" },
  { key: "trace", label: "Traceability", icon: "link", test: (s) => s === "Traceability" },
  { key: "evidence", label: "Evidence & assumptions", icon: "fact_check", test: (s) => s === "Ground rules" },
];

const emptyTasks = (): Tasks => ({ total: 0, submitted: 0, approved: 0, changes: 0, inReview: 0 });
const addTasks = (a: Tasks, b: Tasks): Tasks => ({ total: a.total + b.total, submitted: a.submitted + b.submitted, approved: a.approved + b.approved, changes: a.changes + b.changes, inReview: a.inReview + b.inReview });
const sumGrades = (xs: { pct: number; pass: boolean }[]): GradeSum => (xs.length ? { pct: Math.round(xs.reduce((a, x) => a + x.pct, 0) / xs.length), graded: xs.length, passed: xs.filter((x) => x.pass).length } : null);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
/* a task's name — a lesson's own written work is named after the lesson */
const nameOf = (s: { artifact: string; lessonTitle?: string | null; key: string }) => (s.key === "work" && s.lessonTitle ? `${s.lessonTitle} — your work` : s.artifact);

type Sub = { fid: string; key: string; day: number; status: string; version?: number | null; artifact: string; lessonTitle?: string | null; toRole: string; grade?: { pct: number; pass: boolean } | null; selfScores?: Record<string, number> | null; history?: { kind: string; comment?: string | null; scores?: Record<string, number> | null; grade?: { pct: number; pass: boolean } | null; at?: Date | null }[]; createdAt?: Date };

/* only what the stats need from a submission — not the work itself (content, data), which can be large */
const SUB_FIELDS = { userId: 1, fid: 1, key: 1, day: 1, status: 1, version: 1, artifact: 1, lessonTitle: 1, toRole: 1, grade: 1, selfScores: 1, "history.kind": 1, "history.comment": 1, "history.scores": 1, "history.grade": 1, "history.at": 1 };

/* the program's shape: every day's lessons and the tasks each one asks for — built once per build of the data */
let shapeCache: { at: number; shape: ReturnType<typeof buildShape> } | null = null;
function programShape() {
  const at = dataVersion();
  if (!shapeCache || shapeCache.at !== at) shapeCache = { at, shape: buildShape() };
  return shapeCache.shape;
}
function buildShape() {
  return Array.from({ length: TOTAL_DAYS + 1 }, (_, n) => {
    const d = getDay(n);
    return d ? { day: d, lessons: d.processes.flatMap((p) => p.lessons).map((l) => ({ lesson: l, tasks: deliverablesOf(l) })) } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
}

type RawRep = { userId: string; skill: string; correct: number; total: number; xp?: number | null; createdAt?: Date };
const toRep = (r: RawRep): Rep => ({ skill: r.skill, correct: r.correct, total: r.total, xp: r.xp ?? 0, at: r.createdAt ? new Date(r.createdAt).toISOString() : "" });

export async function programStats(userId: string): Promise<ProgramStats> {
  await connectToDatabase();
  const [progress, subs, reps, answers] = await Promise.all([
    getProgress(userId),
    SubmissionModel.find({ userId }, SUB_FIELDS).lean() as unknown as Promise<Sub[]>,
    PracticeRepModel.find({ userId }).lean() as unknown as Promise<RawRep[]>,
    acceptedAnswers(userId).catch(() => []),
  ]);
  return build(progress, subs, progress.startedAt ? new Date(progress.startedAt) : null, reps.map(toRep), answers);
}

function build(progress: Progress, subs: Sub[], startedAt: Date | null, reps: Rep[] = [], answers: Answer[] = []): ProgramStats {
  const shape = programShape();
  const byKey = new Map(subs.map((s) => [`${s.fid}|${s.key}`, s]));
  const current = currentDay(progress.completedDays);
  const tasksOf = (fid: string, keys: string[]): Tasks => {
    const t = emptyTasks();
    t.total = keys.length;
    for (const k of keys) {
      const s = byKey.get(`${fid}|${k}`);
      if (!s) continue;
      if (s.status === "submitted") { t.submitted++; t.inReview++; }
      if (s.status === "approved") { t.submitted++; t.approved++; }
      if (s.status === "changes") t.changes++;
    }
    return t;
  };
  const gradesOf = (fid: string, keys: string[]) => keys.map((k) => byKey.get(`${fid}|${k}`)?.grade).filter((g): g is { pct: number; pass: boolean } => !!g && typeof g.pct === "number");

  /* by day */
  const days: DayStat[] = shape.map(({ day: d, lessons }) => {
    const lessonRows = lessons.map(({ lesson: l, tasks }) => {
      const keys = tasks.map((x) => x.key);
      return { fid: l.fid, code: l.code, title: l.title, done: !!progress.lessons[l.fid]?.done, tasks: tasksOf(l.fid, keys), grade: sumGrades(gradesOf(l.fid, keys)) };
    });
    const all = lessons.flatMap(({ lesson: l, tasks }) => gradesOf(l.fid, tasks.map((x) => x.key)));
    const selfs = subs.filter((s) => s.day === d.day).map((s) => [...(s.history ?? [])].reverse().find((h) => h.kind === "submitted" && h.grade)?.grade?.pct).filter((x): x is number => typeof x === "number");
    return {
      day: d.day, title: d.title, actId: d.act.id, open: isDayOpen(d.day, progress.completedDays), complete: progress.completedDays.includes(d.day), current: d.day === current,
      lessons: { done: lessonRows.filter((x) => x.done).length, total: lessonRows.length },
      tasks: lessonRows.reduce((a, x) => addTasks(a, x.tasks), emptyTasks()),
      grade: sumGrades(all),
      selfPct: selfs.length ? Math.round(selfs.reduce((a, x) => a + x, 0) / selfs.length) : null,
      lessonRows,
    };
  });

  /* by stage */
  const stages: StageStat[] = [];
  for (const s of daySummaries()) {
    let st = stages.find((x) => x.id === s.act.id);
    if (!st) { st = { id: s.act.id, n: s.act.n, name: s.act.name, color: ACT_COLORS[s.act.id] ?? "#6d48d8", gate: s.act.gate, days: [], daysDone: 0, lessons: { done: 0, total: 0 }, tasks: emptyTasks(), grade: null, status: "upcoming" }; stages.push(st); }
    const ds = days.find((x) => x.day === s.day);
    if (!ds) continue;
    st.days.push(s.day);
    if (ds.complete) st.daysDone++;
    st.lessons = { done: st.lessons.done + ds.lessons.done, total: st.lessons.total + ds.lessons.total };
    st.tasks = addTasks(st.tasks, ds.tasks);
  }
  for (const st of stages) {
    st.grade = sumGrades(subs.filter((s) => st.days.includes(s.day) && s.grade && typeof s.grade.pct === "number").map((s) => s.grade!));
    st.status = st.daysDone === st.days.length ? "done" : st.days.includes(current) || st.daysDone > 0 ? "active" : "upcoming";
  }

  /* skills: the reviewer's latest scores, grouped by what each criterion tests */
  const bucket = new Map<string, number[]>();
  for (const s of subs) {
    const review = [...(s.history ?? [])].reverse().find((h) => h.kind !== "submitted" && h.scores);
    if (!review?.scores) continue;
    const lesson = lessonOf(s.day, s.fid);
    const all = lesson ? deliverablesOf(lesson) : [];
    const d = all.find((x) => x.key === s.key);
    if (!lesson || !d) continue;
    for (const c of rubricOf(lesson, d, all, { template: getTemplate, lens: getLens })) {
      const v = review.scores[c.id];
      if (v === undefined) continue;
      const sk = SKILLS.find((k) => k.test(c.source));
      if (sk) bucket.set(sk.key, [...(bucket.get(sk.key) ?? []), v]);
    }
  }
  const skills: SkillStat[] = SKILLS.map((k) => {
    const v = bucket.get(k.key) ?? [];
    const avg = v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0;
    return { key: k.key, label: k.label, icon: k.icon, avg: Math.round(avg * 100) / 100, pct: Math.round((avg / 2) * 100), scored: v.length };
  }).filter((k) => k.scored > 0);

  /* quality */
  const graded = subs.filter((s) => s.grade && typeof s.grade.pct === "number");
  const approved = subs.filter((s) => s.status === "approved");
  const firstTimePass = approved.length ? Math.round((approved.filter((s) => (s.version ?? 1) <= 1).length / approved.length) * 100) : null;
  /* calibration: the trainee's self-score on a version against the reviewer's grade of it — + means they over-score */
  const gaps: number[] = [];
  for (const s of subs) {
    const h = s.history ?? [];
    h.forEach((e, i) => {
      if (e.kind === "submitted" || !e.grade) return;
      const self = [...h.slice(0, i)].reverse().find((x) => x.kind === "submitted" && x.grade);
      if (self?.grade) gaps.push(self.grade.pct - e.grade.pct);
    });
  }

  /* activity */
  const stamps: Date[] = [];
  for (const l of Object.values(progress.lessons)) if (l.updatedAt) stamps.push(new Date(l.updatedAt));
  for (const s of subs) for (const h of s.history ?? []) if (h.kind === "submitted" && h.at) stamps.push(new Date(h.at));
  for (const r of reps) if (r.at) stamps.push(new Date(r.at));
  const active = new Set(stamps.map(dayKey));
  /* the streak: days in a row — one missed day a week is shielded (it doesn't count, but doesn't break it either) */
  let streak = 0, savedDays = 0, usedThisWeek = false;
  const shieldUsed = new Set<string>();
  const thisWeek = weekStart(new Date()).toISOString();
  const cursor = new Date();
  if (!active.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1); // today isn't over yet
  for (let guard = 0; guard < 400; guard++) {
    if (active.has(dayKey(cursor))) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); continue; }
    const wk = weekStart(cursor).toISOString();
    const before = new Date(cursor); before.setUTCDate(before.getUTCDate() - 1);
    if (streak > 0 && !shieldUsed.has(wk) && active.has(dayKey(before))) { shieldUsed.add(wk); savedDays++; if (wk === thisWeek) usedThisWeek = true; cursor.setUTCDate(cursor.getUTCDate() - 1); continue; }
    break;
  }
  const last = stamps.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const recent: Activity[] = subs.flatMap((s) => (s.history ?? []).map((h) => ({ at: h.at ? new Date(h.at).toISOString() : "", kind: h.kind as Activity["kind"], artifact: nameOf(s), day: s.day, role: s.toRole, gradePct: h.grade?.pct ?? null, pass: h.grade ? !!h.grade.pass : null }))).filter((x) => x.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14);
  const attention: Attention[] = subs.filter((s) => s.status === "changes" || s.status === "submitted").sort((a, b) => (a.status === b.status ? a.day - b.day : a.status === "changes" ? -1 : 1)).map((s) => ({ fid: s.fid, key: s.key, day: s.day, artifact: nameOf(s), role: s.toRole, comment: [...(s.history ?? [])].reverse().find((h) => h.kind === "changes")?.comment ?? "", kind: s.status as Attention["kind"] }));

  /* XP — every event dated, so it can be counted all-time and for the week */
  const xp: XpEvent[] = [];
  const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : "");
  const lessonAt = (fid: string) => progress.lessons[fid]?.updatedAt ?? "";
  const dayAt = new Map<number, string>();
  for (const d of days) {
    for (const l of d.lessonRows) if (l.done) xp.push({ at: lessonAt(l.fid), xp: XP.lesson, kind: "lesson", label: `Lesson ${l.code} ${l.title}` });
    if (d.complete) {
      const at = d.lessonRows.map((l) => lessonAt(l.fid)).filter(Boolean).sort().pop() ?? "";
      dayAt.set(d.day, at);
      xp.push({ at, xp: XP.day, kind: "day", label: `Day ${d.day} complete` });
    }
  }
  for (const st of stages) if (st.status === "done") xp.push({ at: st.days.map((n) => dayAt.get(n) ?? "").sort().pop() ?? "", xp: XP.stage, kind: "stage", label: `Stage ${st.n} ${st.name} cleared` });
  let firstTime = 0, perfectN = 0, reworkWins = 0;
  for (const s of subs) {
    const h = s.history ?? [];
    const first = h.find((e) => e.kind === "submitted");
    if (first) xp.push({ at: iso(first.at), xp: XP.handin, kind: "handin", label: `Handed in ${nameOf(s)}` });
    const ok = h.find((e) => e.kind === "approved");
    if (ok) {
      const pct = ok.grade?.pct ?? 0;
      xp.push({ at: iso(ok.at), xp: XP.approved + Math.round((pct / 100) * XP.gradeBonus), kind: "approved", label: `${nameOf(s)} approved${ok.grade ? ` · ${pct}%` : ""}` });
      const sentBack = h.some((e) => e.kind === "changes");
      if (!sentBack) { firstTime++; xp.push({ at: iso(ok.at), xp: XP.firsttime, kind: "firsttime", label: `Right first time · ${nameOf(s)}` }); }
      else { reworkWins++; xp.push({ at: iso(ok.at), xp: XP.rework, kind: "rework", label: `Fixed and approved · ${nameOf(s)}` }); }
      if (pct === 100) { perfectN++; xp.push({ at: iso(ok.at), xp: XP.perfect, kind: "perfect", label: `Perfect score · ${nameOf(s)}` }); }
    }
  }
  for (const d of active) xp.push({ at: `${d}T12:00:00.000Z`, xp: XP.active, kind: "active", label: "Active day" });
  for (const a of answers) xp.push({ at: a.at, xp: XP.answer, kind: "answer", label: `Helpful answer · “${a.title}”` });
  for (const r of reps) if (r.xp) xp.push({ at: r.at, xp: r.xp, kind: "practice", label: `Practice rep · ${SKILLS.find((k) => k.key === r.skill)?.label ?? r.skill} · ${r.correct}/${r.total}` });
  const practice: ProgramStats["practice"] = {};
  for (const r of reps) {
    const cur = practice[r.skill] ?? { reps: 0, correct: 0, total: 0, last: null };
    practice[r.skill] = { reps: cur.reps + 1, correct: cur.correct + r.correct, total: cur.total + r.total, last: !cur.last || r.at > cur.last ? r.at : cur.last };
  }
  xp.sort((a, b) => b.at.localeCompare(a.at));

  const lessons = days.reduce((a, d) => ({ done: a.done + d.lessons.done, total: a.total + d.lessons.total }), { done: 0, total: 0 });
  const p = projectById(progress.projectId);
  return {
    project: p ? { client: p.client, name: p.name, color: p.color, icon: p.icon } : null,
    current,
    overall: {
      completion: lessons.total ? Math.round((lessons.done / lessons.total) * 100) : 0,
      lessons,
      days: { done: progress.completedDays.length, total: days.length },
      tasks: days.reduce((a, d) => addTasks(a, d.tasks), emptyTasks()),
      grade: sumGrades(graded.map((s) => s.grade!)),
      firstTimePass,
      calibration: gaps.length ? Math.round(gaps.reduce((a, x) => a + x, 0) / gaps.length) : null,
      best: graded.length ? Math.max(...graded.map((s) => s.grade!.pct)) : null,
      perfect: graded.filter((s) => s.grade!.pct === 100).length,
      activeDays: active.size,
      streak,
      startedAt: startedAt ? new Date(startedAt).toISOString() : null,
      lastActive: last ? last.toISOString() : null,
    },
    stages, days, skills, recent, attention,
    xp,
    counts: { firstTime, perfect: perfectN, reworkWins, graded: graded.length, answers: answers.length },
    practice,
    shield: { usedThisWeek, savedDays },
  };
}

/* ---------- the cohort, for admins: every trainee's progress, rolled up by day and stage ---------- */
export type CohortStats = {
  trainees: number; started: number; finished: number;
  avgCompletion: number; grade: GradeSum; firstTimePass: number | null; inReview: number; sentBack: number;
  days: { day: number; title: string; actId: string; reached: number; completed: number; grade: GradeSum }[];
  stages: { id: string; n: string; name: string; color: string; completed: number; grade: GradeSum }[];
  skills: SkillStat[];
  people: { id: string; name: string; email: string; current: number; completion: number; grade: GradeSum; changes: number; inReview: number; lastActive: string | null; project: string }[];
};

/* every trainee's stats at once — for the cohort view and the leaderboard (three queries, run together) */
export type TraineeStats = { id: string; name: string; email: string; started: boolean; prefs: Progress["prefs"]; stats: ProgramStats };
let allCache: { at: number; data: Promise<{ per: TraineeStats[]; subs: (Sub & { userId: string })[] }> } | null = null;
const ALL_TTL = 20_000; // the cohort changes slowly; 20 s is fresh enough for rankings
export function allTraineeStats(fresh = false) {
  if (fresh || !allCache || Date.now() - allCache.at > ALL_TTL) {
    const data = loadAllTraineeStats();
    allCache = { at: Date.now(), data };
    data.catch(() => { allCache = null; });
  }
  return allCache.data;
}
async function loadAllTraineeStats(): Promise<{ per: TraineeStats[]; subs: (Sub & { userId: string })[] }> {
  await connectToDatabase();
  const [users, allProgress, allSubs, allReps, allAnswers] = await Promise.all([
    UserModel.find({ role: { $ne: "admin" } }, { name: 1, email: 1 }).lean(),
    ProgramProgressModel.find({}, { userId: 1, completedDays: 1, projectId: 1, createdAt: 1, title: 1, featured: 1, hideRank: 1, frame: 1, "lessons.fid": 1, "lessons.done": 1, "lessons.updatedAt": 1 }).lean(),
    SubmissionModel.find({}, SUB_FIELDS).lean() as unknown as Promise<(Sub & { userId: string })[]>,
    PracticeRepModel.find({}).lean() as unknown as Promise<RawRep[]>,
    acceptedAnswers().catch(() => []),
  ]);
  const ids = new Set(users.map((u) => String(u._id)).filter((id) => isValidObjectId(id)));
  const progresses = allProgress.filter((p) => ids.has(p.userId));
  const subs = allSubs.filter((s) => ids.has(s.userId));
  const per = users.map((u) => {
    const id = String(u._id);
    const doc = progresses.find((p) => p.userId === id) as (typeof progresses)[number] & { title?: string; featured?: string[]; hideRank?: boolean; frame?: string } | undefined;
    const progress: Progress = {
      lessons: Object.fromEntries((doc?.lessons ?? []).map((l) => [l.fid, { done: !!l.done, work: "", updatedAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : null }])),
      completedDays: [...new Set(doc?.completedDays ?? [])],
      projectId: doc?.projectId ?? "",
      prefs: { title: doc?.title ?? "", featured: doc?.featured ?? [], hideRank: !!doc?.hideRank, frame: doc?.frame ?? "" },
    };
    return { id, name: u.name || u.email || "Trainee", email: u.email ?? "", started: !!doc, prefs: progress.prefs, stats: build(progress, subs.filter((s) => s.userId === id), (doc as { createdAt?: Date } | null)?.createdAt ?? null, allReps.filter((r) => r.userId === id).map(toRep), allAnswers.filter((a) => a.authorId === id)) };
  });
  return { per, subs };
}

export async function cohortStats(): Promise<CohortStats> {
  const { per: all, subs } = await allTraineeStats();
  const per = all.map((x) => ({ ...x, u: { name: x.name, email: x.email } }));
  const users = per;
  const started = per.filter((x) => x.started);
  const allGrades = subs.filter((s) => s.grade && typeof s.grade.pct === "number").map((s) => s.grade!);
  const approved = subs.filter((s) => s.status === "approved");
  const first = per[0]?.stats;
  const skillKeys = new Map<string, { label: string; icon: string; sum: number; n: number }>();
  for (const x of per) for (const k of x.stats.skills) {
    const cur = skillKeys.get(k.key) ?? { label: k.label, icon: k.icon, sum: 0, n: 0 };
    cur.sum += k.avg * k.scored; cur.n += k.scored; skillKeys.set(k.key, cur);
  }
  return {
    trainees: users.length,
    started: started.length,
    finished: per.filter((x) => x.stats.overall.days.done >= x.stats.overall.days.total).length,
    avgCompletion: started.length ? Math.round(started.reduce((a, x) => a + x.stats.overall.completion, 0) / started.length) : 0,
    grade: sumGrades(allGrades),
    firstTimePass: approved.length ? Math.round((approved.filter((s) => (s.version ?? 1) <= 1).length / approved.length) * 100) : null,
    inReview: subs.filter((s) => s.status === "submitted").length,
    sentBack: subs.filter((s) => s.status === "changes").length,
    days: (first?.days ?? []).map((d) => ({
      day: d.day, title: d.title, actId: d.actId,
      reached: started.filter((x) => x.stats.current >= d.day).length,
      completed: started.filter((x) => x.stats.days.find((y) => y.day === d.day)?.complete).length,
      grade: sumGrades(subs.filter((s) => s.day === d.day && s.grade && typeof s.grade.pct === "number").map((s) => s.grade!)),
    })),
    stages: (first?.stages ?? []).map((st) => ({
      id: st.id, n: st.n, name: st.name, color: st.color,
      completed: started.filter((x) => x.stats.stages.find((y) => y.id === st.id)?.status === "done").length,
      grade: sumGrades(subs.filter((s) => st.days.includes(s.day) && s.grade && typeof s.grade.pct === "number").map((s) => s.grade!)),
    })),
    skills: [...skillKeys.entries()].map(([key, v]) => { const avg = v.n ? v.sum / v.n : 0; return { key, label: v.label, icon: v.icon, avg: Math.round(avg * 100) / 100, pct: Math.round((avg / 2) * 100), scored: v.n }; }),
    people: per.map((x) => ({
      id: x.id, name: x.u.name || x.u.email || "Trainee", email: x.u.email ?? "", current: x.stats.current, completion: x.stats.overall.completion, grade: x.stats.overall.grade,
      changes: x.stats.overall.tasks.changes, inReview: x.stats.overall.tasks.inReview, lastActive: x.stats.overall.lastActive, project: x.stats.project?.client ?? "",
    })).sort((a, b) => b.completion - a.completion),
  };
}
