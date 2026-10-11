/* The leaderboard — every trainee who's started, ranked by XP (all time, or this week's season). Anyone can step out of
   it: others then don't see them, but they still see their own place. Admins see everyone. Server code. */
import { gameOf, rankRows, seasonsOf, type Game, type RankRow, type Season, type Seasons } from "./gamification";
import { allTraineeStats, type TraineeStats } from "./stats";

const visibleTo = (per: TraineeStats[], viewer: string, isAdmin: boolean) => per.filter((p) => isAdmin || p.id === viewer || !p.prefs?.hideRank);
const seasonsFor = (per: TraineeStats[]) => seasonsOf(per.filter((p) => p.started).map((p) => ({ id: p.id, name: p.name, hidden: !!p.prefs?.hideRank, xp: p.stats.xp })));

export async function leaderboard(viewer: string, isAdmin: boolean): Promise<{ all: RankRow[]; week: RankRow[]; seasons: Seasons }> {
  const { per } = await allTraineeStats();
  const seasons = seasonsFor(per);
  const people = visibleTo(per, viewer, isAdmin);
  return { all: rankRows(people, "xp", seasons), week: rankRows(people, "week", seasons), seasons: { ...seasons, byUser: {} } };
}

/* one trainee's place and their season record, as they (or an admin) would see it */
export async function rankOf(userId: string, isAdmin = false): Promise<{ rank: number; of: number } | null> {
  return (await standing(userId, isAdmin)).rank;
}
export async function standing(userId: string, isAdmin = false): Promise<{ rank: { rank: number; of: number } | null; season: Season | null }> {
  const { per } = await allTraineeStats();
  const seasons = seasonsFor(per);
  const rows = rankRows(visibleTo(per, userId, isAdmin), "xp", seasons);
  const me = rows.find((r) => r.id === userId);
  return { rank: me ? { rank: me.rank, of: rows.length } : null, season: seasons.byUser[userId] ?? null };
}

/* a trainee's public card, if the viewer may see it */
export async function publicTrainee(id: string, viewer: string, isAdmin: boolean): Promise<{ trainee: TraineeStats; hidden: boolean; rank: RankRow | null; of: number; game: Game } | null> {
  const { per } = await allTraineeStats();
  const t = per.find((p) => p.id === id);
  if (!t) return null;
  const seasons = seasonsFor(per);
  const hidden = !!t.prefs?.hideRank && id !== viewer && !isAdmin;
  const rows = rankRows(visibleTo(per, viewer, isAdmin), "xp", seasons);
  return { trainee: t, hidden, rank: rows.find((r) => r.id === id) ?? null, of: rows.length, game: gameOf(t.stats, t.prefs, seasons.byUser[id] ?? null) };
}
