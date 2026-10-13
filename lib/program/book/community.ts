import type { ReelItem } from "./reel";

/* What people add to the vlog, and how it changes what plays. Pure: runs on the server for the first paint and again
 * in the browser whenever someone votes, picks an option or adds a link. */
export type LinkCategory = "alternate" | "translation" | "addition";
export type CommunityLink = {
  id: string;
  slot: string; // clip:<id>:<start> or sub:<sectionId> (alternates and translations)
  anchor: string; // a piece's key (additions)
  category: LinkCategory;
  lang: string;
  kind: "video" | "article" | "other";
  url: string;
  videoId?: string;
  start?: number;
  end?: number;
  title: string;
  note?: string;
  channel?: string;
  by: string;
  byId: string;
  at: string;
  score: number;
  mine: number; // my vote: 1, -1 or 0
};
export type CuratedVotes = Record<string, { score: number; mine: number }>; // by slot
export type SlotOption = {
  id: string; // curated:<slot> or the link id
  curated: boolean;
  category?: LinkCategory;
  lang: string;
  title: string;
  by: string;
  source?: string;
  note?: string;
  video: { id: string; start: number; end: number };
  score: number;
  mine: number;
  at?: string;
  chosen?: boolean;
};

export const LANGS: Record<string, string> = { en: "English", ur: "Urdu", hi: "Hindi", ar: "Arabic", bn: "Bengali", pa: "Punjabi", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", tr: "Turkish", id: "Indonesian", zh: "Chinese" };
const HIDE_BELOW = -3; // a link voted this far down stops appearing

/* rank: the score decides; a translation in the viewer's language wins a tie, then the curated clip */
const rank = (o: SlotOption, lang: string) => o.score + (o.category === "translation" && o.lang === lang ? 0.5 : 0) + (o.curated ? 0.25 : 0);

export function applyCommunity(base: ReelItem[], links: CommunityLink[], curated: CuratedVotes, viewerLang: string, picks: Record<string, string> = {}): ReelItem[] {
  const live = links.filter((l) => l.score > HIDE_BELOW);
  const out: ReelItem[] = [];
  const asOption = (l: CommunityLink): SlotOption | null => (l.kind === "video" && l.videoId && l.end && l.end > (l.start ?? 0)
    ? { id: l.id, curated: false, category: l.category, lang: l.lang, title: l.title, by: l.by, source: l.channel, note: l.note, video: { id: l.videoId, start: l.start ?? 0, end: l.end }, score: l.score, mine: l.mine, at: l.at }
    : null);
  const choose = (slot: string, options: SlotOption[]) => {
    const sorted = [...options].sort((a, b) => rank(b, viewerLang) - rank(a, viewerLang));
    const pick = sorted.find((o) => o.id === picks[slot]) ?? sorted[0];
    return { sorted: sorted.map((o) => ({ ...o, chosen: o === pick })), pick };
  };
  for (const it of base) {
    if (it.kind === "video" && it.slot && it.video) {
      const cv = curated[it.slot] ?? { score: 0, mine: 0 };
      const own: SlotOption = { id: `curated:${it.slot}`, curated: true, lang: "en", title: it.title, by: it.by ?? "", source: it.source, note: it.text, video: { id: it.video.id, start: it.video.start, end: it.video.end }, score: cv.score, mine: cv.mine };
      const alts = live.filter((l) => l.slot === it.slot && l.category !== "addition").map(asOption).filter((o): o is SlotOption => !!o);
      const { sorted, pick } = choose(it.slot, [own, ...alts]);
      out.push(pick.curated ? { ...it, options: sorted } : { ...it, title: pick.title, by: pick.by, source: pick.source ?? "", text: pick.note || it.text, video: { ...pick.video, talk: pick.title }, dur: pick.video.end - pick.video.start, options: sorted, community: { id: pick.id, by: pick.by, category: pick.category, lang: pick.lang } });
    } else if (it.kind === "slot" && it.slot) {
      const alts = live.filter((l) => l.slot === it.slot && l.category !== "addition").map(asOption).filter((o): o is SlotOption => !!o);
      if (alts.length) {
        const { sorted, pick } = choose(it.slot, alts);
        out.push({ ...it, kind: "video", title: pick.title, by: pick.by, source: pick.source ?? "", text: pick.note, video: { ...pick.video, talk: pick.title }, dur: pick.video.end - pick.video.start, options: sorted, community: { id: pick.id, by: pick.by, category: pick.category, lang: pick.lang } });
      } else out.push(it); // kept, with no time, so a link can still be added here
    } else out.push(it);
    /* additions placed after this piece */
    for (const l of live.filter((x) => x.category === "addition" && x.anchor === it.key && x.score >= 0).sort((a, b) => b.score - a.score)) {
      const o = asOption(l);
      const base2 = { topic: it.topic, topicTitle: it.topicTitle, section: it.section, slot: undefined, community: { id: l.id, by: l.by, category: l.category, lang: l.lang } };
      if (o) out.push({ ...base2, key: `c-${l.id}`, kind: "video", title: l.title, by: l.by, source: l.channel ?? "", text: l.note, video: { ...o.video, talk: l.title }, dur: o.video.end - o.video.start, options: [{ ...o, chosen: true }] });
      else out.push({ ...base2, key: `c-${l.id}`, kind: "article", title: l.title, by: l.by, source: new URL(l.url).hostname.replace(/^www\./, ""), text: l.note, url: l.url, dur: 16 });
    }
  }
  return out;
}

/* "1:02:03", "12:34" or "95" → seconds */
export function parseClock(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return null;
  return t.split(":").reduce((a, x) => a * 60 + Number(x), 0);
}
/* a YouTube link → its id and, if present, its t= start */
export function youTubeOf(u: string): { id: string; t?: number } | null {
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = x.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") id = x.searchParams.get("v") ?? x.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/)?.[2] ?? null;
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const tt = x.searchParams.get("t") ?? x.searchParams.get("start");
    const t = tt ? (tt.match(/^(\d+)s?$/) ? Number(tt.replace("s", "")) : ((Number(tt.match(/(\d+)h/)?.[1] ?? 0) * 3600) + (Number(tt.match(/(\d+)m/)?.[1] ?? 0) * 60) + Number(tt.match(/(\d+)s/)?.[1] ?? 0))) : undefined;
    return { id, t };
  } catch { return null; }
}
