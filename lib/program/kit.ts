/* The agent kit — the book's kit files for each act (stage), built by scripts/build-agent-kit.cjs into
 * lib/program/kit-data. Server code only.
 * - A stage's kit unlocks when the trainee reaches the stage: its first day is open (admins see every kit).
 * - Every file knows which units of the book it serves (a step, workflow, subprocess…); those map onto the program's
 *   days and lessons, so a lesson can show the command, skills, reviewers, rubric and template for each of its tasks. */
import fs from "node:fs";
import path from "node:path";

import { daySummaries, getDay, type Lesson } from "./index";
import { isDayOpen } from "./progress";

const DIR = path.join(process.cwd(), "lib", "program", "kit-data");

export type KitLayer = { id: string; name: string; icon: string; what: string; tools: string };
export type KitScale = { id: string; name: string; icon: string; who: string };
type RawFile = { path: string; layer: string; title: string; units: string[]; body: string };
type RawKit = { act: string; files: RawFile[]; variants: Record<string, Record<string, string>> };
type RawIndex = { acts: { id: string; files: number; layers: Record<string, number> }[]; layers: KitLayer[]; scales: KitScale[] };

export type KitUse = { day: number; fid: string; code: string; title: string };
export type KitFileMeta = { path: string; layer: string; title: string; uses: string[]; shared: boolean }; // uses: the fids of the lessons it serves
export type KitStage = { id: string; n: string; name: string; color: string; firstDay: number; days: number[]; files: number; layers: Record<string, number>; unlocked: boolean };
export type KitRef = { path: string; layer: string; title: string };

const cache = new Map<string, unknown>();
function read<T>(file: string): T {
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")));
  return cache.get(file) as T;
}
export const kitIndex = () => read<RawIndex>("index.json");
const kitOf = (act: string): RawKit | null => (kitIndex().acts.some((a) => a.id === act) ? read<RawKit>(`${act}.json`) : null);

/* every program lesson, by fid — so a unit of the book maps onto a day and a lesson */
function lessonMap() {
  const key = "__lessons";
  if (!cache.has(key)) {
    const m: KitUse[] = [];
    for (const s of daySummaries()) {
      const d = getDay(s.day);
      for (const p of d?.processes ?? []) for (const l of p.lessons) m.push({ day: s.day, fid: l.fid, code: l.code, title: l.title });
    }
    cache.set(key, m);
  }
  return cache.get(key) as KitUse[];
}
function usesOf(units: string[]): KitUse[] {
  const out = new Map<string, KitUse>();
  /* a step, workflow or subprocess maps to its lesson; a process to the lessons inside it; the stage itself to none */
  for (const u of units) {
    if (!u.includes(".")) continue;
    for (const l of lessonMap()) if (u === l.fid || u.startsWith(`${l.fid}.`) || l.fid.startsWith(`${u}.`)) out.set(l.fid, l);
  }
  return [...out.values()].sort((a, b) => a.day - b.day || a.code.localeCompare(b.code, undefined, { numeric: true }));
}

/* the stages with their kits, and whether each is open to this trainee */
const ACT_COLORS: Record<string, string> = { discover: "#6d48d8", plan: "#6d48d8", design: "#6d48d8", build: "#007373", verify: "#007373", release: "#007373", operate: "#a87b00", evolve: "#a87b00" };
export function kitStages(completedDays: number[], isAdmin: boolean): KitStage[] {
  const idx = kitIndex();
  return idx.acts.map((a) => {
    const days = daySummaries().filter((d) => d.act.id === a.id);
    const first = days[0]?.day ?? 0;
    return { id: a.id, n: days[0]?.act.n ?? "", name: days[0]?.act.name ?? a.id, color: ACT_COLORS[a.id] ?? "#6d48d8", firstDay: first, days: days.map((d) => d.day), files: a.files, layers: a.layers, unlocked: isDayOpen(first, completedDays, isAdmin) };
  });
}

/* a stage's files, without their bodies */
export function kitFiles(act: string): KitFileMeta[] {
  const key = `__meta:${act}`;
  if (!cache.has(key)) {
    const k = kitOf(act);
    cache.set(key, (k?.files ?? []).map((f) => { const uses = usesOf(f.units); return { path: f.path, layer: f.layer, title: f.title, uses: uses.map((u) => u.fid), shared: !f.path.includes("/") || !uses.length }; }));
  }
  return cache.get(key) as KitFileMeta[];
}

/* one file's text, at a scale */
export function kitFile(act: string, filePath: string, scale = "solo"): { path: string; title: string; layer: string; body: string } | null {
  const k = kitOf(act);
  const f = k?.files.find((x) => x.path === filePath);
  if (!k || !f) return null;
  return { path: f.path, title: f.title, layer: f.layer, body: k.variants[scale]?.[f.path] ?? f.body };
}

/* every file of a stage (or just those for one lesson, plus the shared ones), at a scale — for the zip */
export function kitBundle(act: string, scale = "solo", lessonFid?: string) {
  const k = kitOf(act);
  if (!k) return [];
  const meta = kitFiles(act);
  return k.files
    .filter((f, i) => !lessonFid || meta[i].shared || meta[i].uses.includes(lessonFid))
    .map((f) => ({ path: f.path, body: k.variants[scale]?.[f.path] ?? f.body }));
}

/* what a lesson shows of the kit: its stage's kit (locked until the stage is reached), each task's files, the lesson's own */
export type LessonKit = { act: string; stage: string; firstDay: number; unlocked: boolean; steps: Record<string, KitRef[]>; lesson: KitRef[]; shared: KitRef[] };
export function lessonKits(lessons: Lesson[], completedDays: number[], isAdmin: boolean): Record<string, LessonKit> {
  const stages = kitStages(completedDays, isAdmin);
  const out: Record<string, LessonKit> = {};
  for (const l of lessons) {
    /* the kick-off's "Set up your kit" lesson previews the first stage's kit — its shared, root files */
    const act = l.fid.startsWith("kickoff.") ? (/kit/i.test(l.title) ? stages[0]?.id : undefined) : l.fid.split(".")[0];
    const st = stages.find((s) => s.id === act);
    if (!act || !st) continue;
    const k = kitForLesson(l);
    const shared = kitFiles(act).filter((f) => !f.path.includes("/")).map((f) => ({ path: f.path, layer: f.layer, title: f.title }));
    out[l.fid] = { act, stage: st.name, firstDay: st.firstDay, unlocked: st.unlocked, steps: k?.steps ?? {}, lesson: k?.lesson ?? [], shared };
  }
  return out;
}

/* for a lesson: the kit files of each of its workflow steps (keyed "<workflow>.<step>"), and the lesson-wide ones */
export function kitForLesson(lesson: Lesson): { act: string; steps: Record<string, KitRef[]>; lesson: KitRef[] } | null {
  const act = lesson.fid.split(".")[0];
  const k = kitOf(act);
  if (!k) return null;
  const steps: Record<string, KitRef[]> = {};
  const whole: KitRef[] = [];
  const ref = (f: RawFile): KitRef => ({ path: f.path, layer: f.layer, title: f.title });
  for (const f of k.files) {
    for (const w of lesson.workflows) {
      for (const s of w.steps) if (f.units.includes(`${lesson.fid}.${w.id}.${s.id}`)) (steps[`${w.id}.${s.id}`] ??= []).push(ref(f));
      if (f.units.includes(`${lesson.fid}.${w.id}`) && f.layer === "workflows") whole.push(ref(f));
    }
    if (f.units.includes(lesson.fid) && (f.layer === "commands" || f.layer === "workflows") && !whole.some((x) => x.path === f.path)) whole.push(ref(f));
  }
  return { act, steps, lesson: whole };
}

/* ---------- a small zip (stored, no compression) — no library needed ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zip(files: { path: string; body: string }[]): Buffer {
  const parts: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.path, "utf8"), data = Buffer.from(f.body, "utf8"), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, name, data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10);
    c.writeUInt32LE(0, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24);
    c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(size, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...central, end]);
}
