import type { SlotOption, LinkCategory } from "./community";
import type { Block, Book, BookChapter, BookSection } from "./types";

/* The vlog's running order, built from the book's full outline. It walks the chapter as the book does — the introduction,
 * each topic, the closing — and inside every subtopic follows the book's own structure:
 *   • an opening card: the subtopic, its standfirst and the questions it answers,
 *   • "in short",
 *   • a card for every heading of the section (why it matters, key ideas, how to do it, the case, working with your agent,
 *     common mistakes, when it goes off the path, before you move on …), built from what that part of the book says —
 *     its steps, mistakes and fixes, tables, lists, terms — so the programme carries the book's depth, not a summary,
 *   • and, after the key ideas, the talk clips that serve it (each clip once, under the subtopic it is first listed for,
 *     at most eight minutes); where there are none, the articles that serve it.
 * Cards stay on screen for a reading time worked out from their words; clips run from their start to their end. */
export type ReelItem = {
  key: string;
  kind: "title" | "sub" | "book" | "video" | "article" | "slot"; // a slot: a subtopic with no clip yet (no time until someone fills it)
  topic: string; // "1.2", or a named part ("Introduction", "Closing")
  topicTitle: string;
  section?: { id: string; code: string; title: string };
  title: string;
  label?: string; // what the card is (a heading of the section, "In short" …)
  by?: string;
  source?: string;
  text?: string;
  bullets?: string[];
  url?: string;
  video?: { id: string; start: number; end: number; talk: string };
  dur: number; // seconds on the timeline
  slot?: string; // where alternates and translations attach: clip:<id>:<start> or sub:<sectionId>
  options?: SlotOption[]; // after community links are applied: every option for this slot, best first
  community?: { id: string; by: string; category?: LinkCategory; lang: string }; // when what plays was added by someone
};

const MAX_CLIP = 8 * 60;
const plain = (s: string) => s.replace(/\*\*?/g, "").replace(/\s+/g, " ").trim();
const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n)).replace(/[,;:—-]+$/, "")}…`);
const sentences = (s: string, n: number) => { const p = plain(s).split(/(?<=[.!?])\s+/); let out = ""; for (const x of p) { if ((out + " " + x).length > n && out) break; out = out ? `${out} ${x}` : x; } return clip(out, n + 40); };
/* reading time: about three words a second, never rushed, never stuck */
const readTime = (title: string, text?: string, bullets?: string[]) => Math.round(Math.min(32, Math.max(9, [title, text ?? "", ...(bullets ?? [])].join(" ").split(/\s+/).length / 3 + 3)));

/* what a stretch of blocks says, as a few lines */
function linesOf(blocks: Block[]): { text?: string; bullets?: string[] } {
  const p = blocks.find((b): b is Extract<Block, { t: "p" }> => b.t === "p");
  const text = p ? sentences(p.text, 260) : undefined;
  for (const b of blocks) {
    switch (b.t) {
      case "steps": return { text, bullets: b.items.slice(0, 6).map((x, i) => `${i + 1}. ${plain(x.title)}`) };
      case "pitfalls": return { text, bullets: b.items.slice(0, 5).map((x) => `${clip(plain(x.trap), 90)} → ${clip(plain(x.fix), 90)}`) };
      case "checklist": return { text, bullets: b.items.slice(0, 6).map((x) => clip(plain(x), 120)) };
      case "good": return { text, bullets: b.items.slice(0, 6).map((x) => clip(plain(x), 120)) };
      case "list": return { text, bullets: b.items.slice(0, 6).map((x) => clip(plain(x), 120)) };
      case "terms": return { text, bullets: b.items.slice(0, 5).map((x) => `${x.term} — ${clip(plain(x.def), 100)}`) };
      case "table": return { text, bullets: b.rows.slice(0, 5).map((r) => r.slice(0, 2).map((c) => clip(plain(c), 70)).join(" — ")) };
      case "contrast": return { text, bullets: [`✗ ${clip(plain(b.bad.text), 130)}`, `✓ ${clip(plain(b.good.text), 130)}`] };
      case "callout": if (b.tone === "key" || b.tone === "case") return { text: text ?? sentences(b.text, 260), bullets: text ? [clip(plain(b.text), 160)] : undefined }; break;
      default: break;
    }
  }
  if (!text) { const c = blocks.find((b): b is Extract<Block, { t: "callout" }> => b.t === "callout"); if (c) return { text: sentences(c.text, 260) }; }
  return { text };
}

/* a section, split at its headings */
function groupsOf(blocks: Block[]) {
  const head: Block[] = [];
  const groups: { title: string; blocks: Block[] }[] = [];
  for (const b of blocks) {
    if (b.t === "h") groups.push({ title: b.text, blocks: [] });
    else (groups.length ? groups[groups.length - 1].blocks : head).push(b);
  }
  return { head, groups };
}

export function buildReel(book: Book, words: { introduction: string; closing: string; inShort: string; topic: (n: string) => string } = { introduction: "Introduction", closing: "Closing", inShort: "In short", topic: (n) => `Topic ${n}` }): ReelItem[] {
  const num = book.number ?? "1";
  const used = new Set<string>();
  const items: ReelItem[] = [];
  const parts = book.chapters.filter((c) => c.day || c.id === "opening" || c.id === "closing");
  for (const c of parts) {
    const topic = c.day ? `${num}.${c.day}` : c.id === "opening" ? words.introduction : words.closing;
    const qs = book.questions?.[c.id] ?? [];
    /* the part's title card, then what its opening page says */
    items.push({ key: `t-${c.id}`, kind: "title", topic, topicTitle: c.title, title: c.title, label: c.day ? words.topic(topic) : topic, text: c.question, dur: 8 });
    const intro = linesOf(c.intro);
    if (intro.text) items.push({ key: `i-${c.id}`, kind: "book", topic, topicTitle: c.title, title: c.title, label: c.kicker, text: intro.text, bullets: intro.bullets, dur: readTime(c.title, intro.text, intro.bullets) });
    for (const s of c.sections) section(items, book, c, s, topic, qs.filter((q) => q.at === s.id).map((q) => q.q), used, words.inShort);
  }
  return items;
}

function section(items: ReelItem[], book: Book, c: BookChapter, s: BookSection, topic: string, questions: string[], used: Set<string>, inShortWord: string) {
  const sec = { id: s.id, code: s.code ?? "", title: s.title };
  const base = { topic, topicTitle: c.title, section: sec };
  const { head, groups } = groupsOf(s.blocks);
  const lead = head.find((b): b is Extract<Block, { t: "lead" }> => b.t === "lead");
  const tldr = head.find((b): b is Extract<Block, { t: "tldr" }> => b.t === "tldr");
  /* opening: the subtopic, its standfirst, the questions it answers */
  const openText = lead ? plain(lead.text) : undefined;
  items.push({ ...base, key: `s-${s.id}`, kind: "sub", title: s.title, text: openText, bullets: questions, dur: readTime(s.title, openText, questions) });
  if (tldr) items.push({ ...base, key: `s-${s.id}-short`, kind: "book", title: inShortWord, label: inShortWord, bullets: tldr.items.map(plain), dur: readTime(inShortWord, undefined, tldr.items.map(plain)) });

  /* the talk clips that serve it — or, if none, its articles */
  const media = (): ReelItem[] => {
    const clips = (book.talks ?? []).flatMap((t) => t.parts.map((p) => ({ t, p }))).filter(({ t, p }) => p.for[0] === s.id && !used.has(`${t.id}:${p.start}`));
    if (clips.length) return clips.map(({ t, p }) => {
      used.add(`${t.id}:${p.start}`);
      const end = Math.min(p.end, p.start + MAX_CLIP);
      return { ...base, key: `v-${t.id}-${p.start}`, slot: `clip:${t.id}:${p.start}`, kind: "video" as const, title: p.title, by: t.by, source: `${t.title}${t.year ? ` · ${t.year}` : ""}`, text: p.what, video: { id: t.id, start: p.start, end, talk: t.title }, dur: end - p.start };
    });
    /* no clip yet: a slot someone can fill with a video, then the articles */
    const slot: ReelItem = { ...base, key: `slot-${s.id}`, slot: `sub:${s.id}`, kind: "slot", title: s.title, dur: 0 };
    return [slot, ...(book.reading ?? []).filter((r) => (r.kind === "article" || r.kind === "blog") && r.for.includes(s.id)).slice(0, 2)
      .map((r) => ({ ...base, key: `a-${s.id}-${r.url}`, kind: "article" as const, title: r.title, by: r.by, source: `${r.source}${r.year ? ` · ${r.year}` : ""}`, text: r.why, url: r.url, dur: 16 }))];
  };

  /* every heading of the section, in the book's order; the media go after the key ideas (the third heading) */
  const after = Math.min(2, groups.length - 1);
  let placed = false;
  groups.forEach((g, gi) => {
    const { text, bullets } = linesOf(g.blocks);
    if (text || bullets?.length) items.push({ ...base, key: `h-${s.id}-${gi}`, kind: "book", title: g.title, label: g.title, text, bullets, dur: readTime(g.title, text, bullets) });
    if (gi === after && !placed) { items.push(...media()); placed = true; }
  });
  if (!placed) items.push(...media());
}
