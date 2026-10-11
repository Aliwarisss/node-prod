/* Gamification — earned from the real work of the program, never from clicking around:
 * - XP for every lesson, day and stage, every task handed in and approved (more for a better grade, right first time,
 *   a perfect score, a fix that lands), every day you show up, and practice reps.
 * - Levels on a curve sized to the month; each band of levels carries a title, and every stage you clear adds one.
 * - Badges, some in bronze · silver · gold tiers.
 * - Rewards: titles to wear, avatar frames (by level, and special ones for streaks, perfect work, stages and wins),
 *   and a shining title for last week's top three.
 * - Seasons: each calendar week is a season — its top three are crowned, its winner earns Champion of the week.
 * - A skill tree: the rubric's skills as branches that grow with your grades, with practice reps for weak ones.
 * Plain functions over ProgramStats, so the server and the client compute the same thing. */
import type { Prefs } from "./progress";
import type { ProgramStats, XpEvent } from "./stats";

/* ---------- seasons: calendar weeks, Monday 00:00 UTC ---------- */
export function weekStart(d: Date | string | number) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate() - day));
}
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const weekXp = (xp: XpEvent[], start: Date) => xp.filter((e) => { const t = e.at ? new Date(e.at).getTime() : 0; return t >= start.getTime() && t < start.getTime() + WEEK_MS; }).reduce((a, e) => a + e.xp, 0);

export type Season = { wins: number; podiums: number; lastWeek: { rank: number; xp: number } | null };
export type SeasonBoard = { start: string; end: string; top: { id: string; name: string; xp: number }[] };
export type Seasons = { current: { start: string; end: string; daysLeft: number }; last: SeasonBoard | null; history: SeasonBoard[]; byUser: Record<string, Season> };
/* every finished week's top three (among those on the leaderboard), and each trainee's wins and podiums */
export function seasonsOf(people: { id: string; name: string; hidden: boolean; xp: XpEvent[] }[], now = Date.now()): Seasons {
  const current = weekStart(now);
  const ranked = people.filter((p) => !p.hidden);
  const first = ranked.flatMap((p) => p.xp.map((e) => e.at)).filter(Boolean).sort()[0];
  const history: SeasonBoard[] = [];
  const byUser: Record<string, Season> = Object.fromEntries(people.map((p) => [p.id, { wins: 0, podiums: 0, lastWeek: null }]));
  if (first) {
    for (let w = weekStart(first); w < current; w = new Date(w.getTime() + WEEK_MS)) {
      const top = ranked.map((p) => ({ id: p.id, name: p.name, xp: weekXp(p.xp, w) })).filter((x) => x.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 3);
      if (!top.length) continue;
      history.push({ start: w.toISOString(), end: new Date(w.getTime() + WEEK_MS).toISOString(), top });
      top.forEach((x, i) => { byUser[x.id].podiums++; if (i === 0) byUser[x.id].wins++; });
    }
  }
  const lastStart = new Date(current.getTime() - WEEK_MS).toISOString();
  const last = history.find((h) => h.start === lastStart) ?? null;
  last?.top.forEach((x, i) => { byUser[x.id].lastWeek = { rank: i + 1, xp: x.xp }; });
  return { current: { start: current.toISOString(), end: new Date(current.getTime() + WEEK_MS).toISOString(), daysLeft: Math.max(0, Math.ceil((current.getTime() + WEEK_MS - now) / 86_400_000)) }, last, history: history.reverse(), byUser };
}

/* ---------- levels ---------- */
export const levelXp = (level: number) => 60 * (level - 1) ** 2; // XP needed to reach a level: 0, 60, 240, 540, 960…
export function levelOf(xp: number) {
  let level = 1;
  while (xp >= levelXp(level + 1)) level++;
  const from = levelXp(level), to = levelXp(level + 1);
  return { level, from, to, into: xp - from, need: to - from, pct: Math.round(((xp - from) / (to - from)) * 100) };
}

/* ---------- titles: by level, and by the stages you clear ---------- */
export type Title = { id: string; label: string; how: string; earned: boolean; kind: "level" | "stage" };
const LEVEL_TITLES: [number, string][] = [[1, "Newcomer"], [3, "Apprentice"], [6, "Practitioner"], [10, "Analyst"], [14, "Specialist"], [18, "Lead"], [22, "Principal"], [26, "Architect"]];
const STAGE_TITLES: Record<string, string> = { kickoff: "Starter", discover: "Discoverer", plan: "Planner", design: "Designer", build: "Builder", verify: "Verifier", release: "Release captain", operate: "Operator", evolve: "Evolver", capstone: "Graduate" };

/* ---------- rewards: avatar frames — by level, and special ones you earn ---------- */
export type Frame = { id: string; name: string; ring: string; how: string; unlocked: boolean; level?: number; animated?: boolean; special?: boolean };
const LEVEL_FRAMES: { level: number; id: string; name: string; ring: string }[] = [
  { level: 1, id: "plain", name: "Plain", ring: "transparent" },
  { level: 5, id: "teal", name: "Teal ring", ring: "#4fd1c5" },
  { level: 10, id: "indigo", name: "Indigo ring", ring: "#6d48d8" },
  { level: 15, id: "gold", name: "Gold ring", ring: "#f5b400" },
  { level: 20, id: "aurora", name: "Aurora", ring: "conic-gradient(from 0deg, #e91e63, #6d48d8, #4fd1c5, #f5b400, #e91e63)" },
  { level: 25, id: "platinum", name: "Platinum", ring: "conic-gradient(from 0deg, #e5e7eb, #94a3b8, #f8fafc, #94a3b8, #e5e7eb)" },
];
type Ctx = { s: ProgramStats; level: number; season: Season | null };
const SPECIAL_FRAMES: { id: string; name: string; ring: string; how: string; animated?: boolean; test: (c: Ctx) => boolean }[] = [
  { id: "flame", name: "Flame", ring: "conic-gradient(from 200deg, #ff9a3c, #ea580c, #e91e63, #ff9a3c)", how: "Keep a 7-day streak", test: (c) => c.s.overall.streak >= 7 },
  { id: "perfect", name: "Perfect", ring: "conic-gradient(from 0deg, #fff3c4, #d4a017, #fff3c4, #d4a017, #fff3c4)", how: "Score 100% five times", test: (c) => c.s.counts.perfect >= 5 },
  { id: "pioneer", name: "Pioneer", ring: "conic-gradient(from 90deg, #4fd1c5, #6d48d8, #4fd1c5)", how: "Clear three stages", test: (c) => c.s.stages.filter((x) => x.id !== "kickoff" && x.status === "done").length >= 3 },
  { id: "champion", name: "Champion", ring: "conic-gradient(from 0deg, #f5b400, #fff3c4, #e91e63, #f5b400)", how: "Win a week (Champion of the week)", test: (c) => (c.season?.wins ?? 0) > 0 },
  { id: "podium", name: "Podium shimmer", ring: "conic-gradient(from 0deg, #4fd1c5, #f5b400, #e91e63, #6d48d8, #4fd1c5)", how: "Finish last week in the top three — yours while it lasts", animated: true, test: (c) => !!c.season?.lastWeek && c.season.lastWeek.rank <= 3 },
];
export function framesOf(c: Ctx): Frame[] {
  return [
    ...LEVEL_FRAMES.map((f) => ({ id: f.id, name: f.name, ring: f.ring, level: f.level, how: f.level === 1 ? "Everyone has it" : `Reach level ${f.level}`, unlocked: c.level >= f.level })),
    ...SPECIAL_FRAMES.map((f) => ({ id: f.id, name: f.name, ring: f.ring, how: f.how, animated: f.animated, special: true, unlocked: f.test(c) })),
  ];
}

/* ---------- badges ---------- */
export type BadgeDef = { id: string; name: string; icon: string; color: string; desc: string; tiers?: [number, number, number]; unit?: string; value: (s: ProgramStats, season: Season | null) => number };
export const TIER_NAMES = ["", "Bronze", "Silver", "Gold"] as const;
export const TIER_COLORS = ["#cbd5e1", "#b0723d", "#94a3b8", "#d4a017"] as const;
export const BADGES: BadgeDef[] = [
  { id: "kickoff", name: "Kicked off", icon: "flag", color: "#d81b60", desc: "Finish Day 0 and pick your project", value: (s) => (s.days.some((d) => d.day === 0 && d.complete) ? 1 : 0) },
  { id: "first-handin", name: "First hand-in", icon: "send", color: "#0284c7", desc: "Hand in a task to its role", value: (s) => (s.xp.some((x) => x.kind === "handin") ? 1 : 0) },
  { id: "first-approval", name: "First approval", icon: "verified", color: "#007373", desc: "Get a task approved", value: (s) => (s.overall.tasks.approved > 0 ? 1 : 0) },
  { id: "lessons", name: "Learner", icon: "menu_book", color: "#6d48d8", desc: "Lessons completed", tiers: [10, 50, 150], unit: "lessons", value: (s) => s.overall.lessons.done },
  { id: "approved", name: "Delivered", icon: "assignment_turned_in", color: "#0f766e", desc: "Tasks approved", tiers: [10, 50, 200], unit: "approved", value: (s) => s.overall.tasks.approved },
  { id: "firsttime", name: "Right first time", icon: "bolt", color: "#6d48d8", desc: "Approved without being sent back", tiers: [3, 15, 50], unit: "first-time passes", value: (s) => s.counts.firstTime },
  { id: "perfect", name: "Perfectionist", icon: "workspace_premium", color: "#c49000", desc: "100% on a rubric", tiers: [1, 5, 20], unit: "perfect scores", value: (s) => s.counts.perfect },
  { id: "rework", name: "Comeback", icon: "replay", color: "#e91e63", desc: "Fix work that was sent back, and get it approved", tiers: [1, 5, 15], unit: "fixes", value: (s) => s.counts.reworkWins },
  { id: "streak", name: "On a roll", icon: "local_fire_department", color: "#ea580c", desc: "Days in a row", tiers: [3, 7, 14], unit: "day streak", value: (s) => s.overall.streak },
  { id: "practice", name: "Drill sergeant", icon: "fitness_center", color: "#0891b2", desc: "Practice reps on your skill tree", tiers: [5, 25, 100], unit: "reps", value: (s) => Object.values(s.practice).reduce((a, p) => a + p.reps, 0) },
  { id: "helper", name: "Helper", icon: "volunteer_activism", color: "#0f766e", desc: "Answers you gave on the board that were accepted", tiers: [1, 5, 15], unit: "accepted answers", value: (s) => s.counts.answers ?? 0 },
  { id: "champion", name: "Champion of the week", icon: "emoji_events", color: "#d4a017", desc: "Top the weekly leaderboard", tiers: [1, 3, 5], unit: "weeks won", value: (_s, season) => season?.wins ?? 0 },
  { id: "honest", name: "Honest scorer", icon: "balance", color: "#475569", desc: "Your self-scores within 5 points of the reviewer’s (3+ graded)", value: (s) => (s.overall.calibration != null && Math.abs(s.overall.calibration) <= 5 && s.counts.graded >= 3 ? 1 : 0) },
  { id: "lens", name: "Lens master", icon: "visibility", color: "#0284c7", desc: "90%+ on the lens criteria (10+ scored)", value: (s) => { const k = s.skills.find((x) => x.key === "lenses"); return k && k.scored >= 10 && k.pct >= 90 ? 1 : 0; } },
  { id: "evidence", name: "Evidence-based", icon: "fact_check", color: "#007373", desc: "90%+ on evidence & assumptions (10+ scored)", value: (s) => { const k = s.skills.find((x) => x.key === "evidence"); return k && k.scored >= 10 && k.pct >= 90 ? 1 : 0; } },
  { id: "graduate", name: "Graduate", icon: "school", color: "#d81b60", desc: "Finish all 30 days", value: (s) => (s.overall.days.done >= s.overall.days.total ? 1 : 0) },
];
/* one badge per stage cleared */
const stageBadges = (s: ProgramStats): BadgeDef[] => s.stages.filter((st) => st.id !== "kickoff").map((st) => ({ id: `stage-${st.id}`, name: `${st.name} cleared`, icon: "military_tech", color: st.color, desc: `Finish every day of Stage ${st.n}`, value: (x) => (x.stages.find((y) => y.id === st.id)?.status === "done" ? 1 : 0) }));

export type Badge = { id: string; name: string; icon: string; color: string; desc: string; tier: number; tiers?: [number, number, number]; value: number; next: number | null; unit?: string; earned: boolean; stage?: boolean };
function badgesOf(s: ProgramStats, season: Season | null): Badge[] {
  return [...BADGES.map((b) => ({ b, stage: false })), ...stageBadges(s).map((b) => ({ b, stage: true }))].map(({ b, stage }) => {
    const v = b.value(s, season);
    const tier = b.tiers ? b.tiers.filter((t) => v >= t).length : v > 0 ? 1 : 0;
    const next = b.tiers ? b.tiers.find((t) => v < t) ?? null : null;
    return { id: b.id, name: b.name, icon: b.icon, color: b.color, desc: b.desc, tier, tiers: b.tiers, value: v, next, unit: b.unit, earned: tier > 0, stage };
  });
}

/* ---------- the skill tree: the rubric's skills as branches, grown by your grades ---------- */
export const SKILL_NODES = [
  { name: "Seed", need: "Any score or practice", test: (b: { scored: number; pct: number; reps: number }) => b.scored >= 1 || b.reps >= 1 },
  { name: "Sprout", need: "3 criteria scored, 50%+", test: (b: { scored: number; pct: number }) => b.scored >= 3 && b.pct >= 50 },
  { name: "Branch", need: "8 scored, 70%+", test: (b: { scored: number; pct: number }) => b.scored >= 8 && b.pct >= 70 },
  { name: "Bloom", need: "15 scored, 80%+", test: (b: { scored: number; pct: number }) => b.scored >= 15 && b.pct >= 80 },
  { name: "Mastery", need: "30 scored, 90%+", test: (b: { scored: number; pct: number }) => b.scored >= 30 && b.pct >= 90 },
] as const;
export type Branch = { key: string; label: string; icon: string; scored: number; pct: number; avg: number; level: number; next: string | null; reps: number; accuracy: number | null; weak: boolean };
export function skillTree(s: ProgramStats, skills: { key: string; label: string; icon: string }[]): { branches: Branch[]; level: number; max: number } {
  const branches = skills.map((k) => {
    const sc = s.skills.find((x) => x.key === k.key);
    const p = s.practice[k.key];
    const b = { scored: sc?.scored ?? 0, pct: sc?.pct ?? 0, reps: p?.reps ?? 0 };
    let level = 0;
    for (const n of SKILL_NODES) { if (n.test(b)) level++; else break; }
    const accuracy = p && p.total ? Math.round((p.correct / p.total) * 100) : null;
    return { key: k.key, label: k.label, icon: k.icon, scored: b.scored, pct: b.pct, avg: sc?.avg ?? 0, level, next: SKILL_NODES[level]?.need ?? null, reps: b.reps, accuracy, weak: b.scored === 0 ? b.reps === 0 : b.pct < 70 };
  });
  return { branches, level: branches.reduce((a, b) => a + b.level, 0), max: branches.length * SKILL_NODES.length };
}

/* ---------- a trainee's game ---------- */
export type Game = {
  xp: number; week: number; level: ReturnType<typeof levelOf>;
  title: string; titleFx: "shine" | null; titles: Title[]; frame: Frame; frames: Frame[]; nextFrame: Frame | null;
  badges: Badge[]; earned: number; featured: Badge[]; recent: XpEvent[]; hideRank: boolean; season: Season | null;
  streak: number; shield: { usedThisWeek: boolean; savedDays: number };
};
export function gameOf(s: ProgramStats, prefs?: Prefs | null, season: Season | null = null, now = Date.now()): Game {
  const xp = s.xp.reduce((a, e) => a + e.xp, 0);
  const week = weekXp(s.xp, weekStart(now));
  const level = levelOf(xp);
  const titles: Title[] = [
    ...LEVEL_TITLES.map(([lv, label]) => ({ id: `level-${lv}`, label, how: lv === 1 ? "Where everyone starts" : `Reach level ${lv}`, earned: level.level >= lv, kind: "level" as const })),
    ...s.stages.map((st) => ({ id: `stage-${st.id}`, label: STAGE_TITLES[st.id] ?? st.name, how: st.id === "kickoff" ? "Finish Day 0" : `Clear Stage ${st.n} · ${st.name}`, earned: st.status === "done", kind: "stage" as const })),
  ];
  const auto = [...LEVEL_TITLES].reverse().find(([lv]) => level.level >= lv)?.[1] ?? "Newcomer";
  const title = titles.filter((t) => t.earned).find((t) => t.id === prefs?.title)?.label ?? auto;
  const frames = framesOf({ s, level: level.level, season });
  const bestLevel = [...frames].filter((f) => !f.special && f.unlocked).pop() ?? frames[0];
  const frame = frames.find((f) => f.id === prefs?.frame && f.unlocked) ?? bestLevel;
  const nextFrame = frames.find((f) => !f.special && !f.unlocked) ?? null;
  const badges = badgesOf(s, season);
  const earned = badges.filter((b) => b.earned);
  const featured = (prefs?.featured?.length ? prefs.featured.map((id) => earned.find((b) => b.id === id)).filter((b): b is Badge => !!b) : [...earned].sort((a, b) => b.tier - a.tier)).slice(0, 3);
  const titleFx = season?.lastWeek && season.lastWeek.rank <= 3 ? "shine" : null;
  return { xp, week, level, title, titleFx, titles, frame, frames, nextFrame, badges, earned: earned.length, featured, recent: s.xp.slice(0, 12), hideRank: !!prefs?.hideRank, season, streak: s.overall.streak, shield: s.shield };
}

/* ---------- the ranking ---------- */
export type RankRow = { rank: number; id: string; name: string; title: string; titleFx: "shine" | null; level: number; xp: number; week: number; badges: number; featured: { id: string; icon: string; color: string; name: string; tier: number }[]; stage: string; day: number; frame: Frame; hidden: boolean; wins: number };
export function rankRows(people: { id: string; name: string; started: boolean; prefs?: Prefs | null; stats: ProgramStats }[], by: "xp" | "week" = "xp", seasons?: Seasons | null): RankRow[] {
  return people
    .filter((p) => p.started)
    .map((p) => {
      const g = gameOf(p.stats, p.prefs, seasons?.byUser[p.id] ?? null);
      const st = p.stats.stages.find((x) => x.status === "active") ?? [...p.stats.stages].reverse().find((x) => x.status === "done");
      return { rank: 0, id: p.id, name: p.name, title: g.title, titleFx: g.titleFx, level: g.level.level, xp: g.xp, week: g.week, badges: g.earned, featured: g.featured.map((b) => ({ id: b.id, icon: b.icon, color: b.color, name: b.name, tier: b.tier })), stage: st?.name ?? "", day: p.stats.current, frame: g.frame, hidden: g.hideRank, wins: g.season?.wins ?? 0 };
    })
    .sort((a, b) => (by === "week" ? b.week - a.week || b.xp - a.xp : b.xp - a.xp || b.week - a.week))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
