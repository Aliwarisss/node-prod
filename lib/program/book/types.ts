/* A book: chapters of sections, each section a run of blocks — prose, lists, callouts and figures. Figures either
 * reuse the program's own data (a lesson's workflow map, a knowledge diagram, an artifact page) or are drawn for the
 * book (a why-ladder, a 2×2, bars, ranges, a box-and-arrow flow, the trace chain). Pure data: safe on client and server.
 * Inline text may use **bold**. */

export type Figure =
  | { kind: "workflow"; fid: string } // the lesson's workflow, as its flow map
  | { kind: "knowledge"; name: string } // a knowledge item's diagram (by its name in knowledge.json)
  | { kind: "template"; id: string } // an artifact, as the real page
  | { kind: "trace"; from?: string; to?: string } // the act's trace chain (REQ → … → ADR), optionally a stretch of it
  | { kind: "ladder"; rungs: string[]; top: string; bottom: string } // a why-chain, from the ask down to the condition
  | { kind: "split"; left: { title: string; items: string[]; tone?: "fact" | "guess" | "bad" | "good" }; right: { title: string; items: string[]; tone?: "fact" | "guess" | "bad" | "good" } }
  | { kind: "bars"; unit?: string; rows: { label: string; value: number; max: number; note?: string; tone?: "bad" | "good" | "neutral" }[] }
  | { kind: "matrix"; x: string; y: string; points: { label: string; x: number; y: number }[]; hot?: "tl" | "tr"; hotLabel?: string } // both axes 0–1; hot = the corner to act on first (default top right)
  | { kind: "flow"; steps: { label: string; sub?: string; tone?: "human" | "system" | "new" | "risk" }[] } // boxes left to right
  | { kind: "ranges"; unit: string; rows: { label: string; low: number; likely?: number; high: number }[] } // likely only when the source gives one
  | { kind: "days" } // the five days of Discover, each with its question
  /* drawn from a section's own text — every label, number and link must come from the prose around it */
  | { kind: "cycle"; center?: string; steps: { label: string; text?: string }[] } // a loop that repeats (last step returns to the first)
  | { kind: "tree"; root: string; children: { label: string; text?: string; children?: { label: string; text?: string }[] }[] } // a breakdown
  | { kind: "context"; center: { label: string; sub?: string }; around: { label: string; sub?: string; type: "person" | "system" | "external" | "store"; link?: string; dir?: "in" | "out" | "both"; text?: string }[] } // a system and what touches it
  | { kind: "lanes"; lanes: string[]; steps: { lane: number; label: string; sub?: string; flag?: "manual" | "wait" | "error" | "ok" }[] } // who does what, in order
  | { kind: "fishbone"; effect: string; bones: { label: string; causes: string[] }[] } // causes grouped by category, pointing at one effect
  | { kind: "scorecard"; criteria: { label: string; weight: number }[]; options: { label: string; scores: number[] }[]; scale?: number; note?: string } // weighted scoring; weights adjustable
  | { kind: "timeline"; unit: string; items: { label: string; start: number; length: number; tone?: "human" | "system" | "new" | "risk" }[]; marks?: { at: number; label: string }[] } // timeboxes on a scale
  | { kind: "funnel"; stages: { label: string; count?: number; items?: string[] }[] } // narrowing down
  | { kind: "hub"; center: string; items: { label: string; icon: string; text: string }[] } // a concept and its parts, as an illustration
  | { kind: "stack"; layers: { label: string; sub?: string; items?: string[] }[] } // layers, top to bottom
  | { kind: "delta"; rows: { label: string; before: number; after: number; unit: string; better: "lower" | "higher" }[]; beforeLabel?: string; afterLabel?: string } // today → target
  | { kind: "decide"; start: string; nodes: { id: string; q?: string; result?: string; tone?: "good" | "bad" | "neutral"; yes?: string; no?: string }[] } // a decision tree to walk
  | { kind: "anatomy"; parts: { text: string; label?: string; note?: string }[] }; // a sentence or template, with its parts named

export type Block =
  /* text */
  | { t: "lead"; text: string } // the standfirst: one or two sentences under the title, larger
  | { t: "tldr"; items: string[] } // "In short" — 3–5 lines summarising the section
  | { t: "p"; text: string }
  | { t: "h"; text: string } // a heading (H2) — listed in "On this page"
  | { t: "h3"; text: string } // a sub-heading
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "quote"; text: string; by?: string }
  | { t: "pull"; text: string } // a pull quote: one line worth remembering, set large
  | { t: "note"; text: string } // a side note: an aside next to the text
  /* structures */
  | { t: "steps"; items: { title: string; text: string; tip?: string }[] } // a numbered procedure
  | { t: "table"; caption?: string; head: string[]; rows: string[][] }
  | { t: "contrast"; label?: string; bad: { title?: string; text: string }; good: { title?: string; text: string } } // weak vs strong
  | { t: "terms"; items: { term: string; def: string }[] } // key terms
  | { t: "pitfalls"; items: { trap: string; fix: string }[] } // common mistakes, each with its fix
  | { t: "prompt"; title?: string; text: string } // a prompt to copy for your agent
  | { t: "checklist"; title?: string; items: string[] } // ticks the reader can set (remembered)
  | { t: "callout"; tone: "key" | "warn" | "tip" | "agent" | "case"; title?: string; text: string }
  | { t: "figure"; fig: Figure; caption: string }
  | { t: "good"; items: string[] } // what good looks like
  | { t: "try"; text: string } // the exercise
  | { t: "reading"; kind: ReadingKind }
  | { t: "talks" }; // the book's talks, cut into parts by topic, with a player (from book.talks) // the book's curated reading of this kind (from book.reading)

export type BookSection = { id: string; code?: string; title: string; fid?: string; minutes: number; blocks: Block[] };
export type BookChapter = { id: string; n: string; title: string; day?: number; kicker: string; question?: string; intro: Block[]; sections: BookSection[] };
/* the who / what / when / where / why / how questions a chapter answers, keyed by chapter id — each tied to the
 * section ("at", a section id) that answers it */
export type WHQuestion = { q: string; at: string };
export type ChapterQuestions = Record<string, WHQuestion[]>;
export type BookLang = "en" | "ur";
/* curated reading from the web: each item checked to exist, with why it's worth reading and the subtopics it serves */
export type ReadingKind = "article" | "blog" | "video" | "learn" | "repo";
/* talks cut into parts: each part is a stretch of a YouTube video (seconds), what's said in it, and the subtopics it serves */
export type TalkPart = { start: number; end: number; title: string; what: string; for: string[] };
export type Talk = { id: string; title: string; by: string; source: string; year?: string; length: number; parts: TalkPart[] };
export type ReadingItem = { kind: ReadingKind; title: string; by: string; source: string; year?: string; url: string; why: string; for: string[]; meta?: string };
export type Book = { id: string; number?: string; title: string; subtitle: string; act: string; lang?: BookLang; chapters: BookChapter[]; questions?: ChapterQuestions; reading?: ReadingItem[]; talks?: Talk[] };

/* the book's glossary: every term defined in a "terms" block (first definition wins), with the page that defines it */
export type GlossaryEntry = { term: string; def: string; at: string; chapter: string };
export function glossaryOf(book: Book): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const c of book.chapters) {
    const runs: [string, Block[]][] = [["ch-" + c.id, c.intro], ...c.sections.map((s) => [s.id, s.blocks] as [string, Block[]])];
    for (const [at, blocks] of runs) for (const b of blocks) if (b.t === "terms") for (const x of b.items) {
      const k = x.term.toLowerCase();
      if (!seen.has(k)) seen.set(k, { term: x.term, def: x.def, at, chapter: c.title });
    }
  }
  return [...seen.values()].sort((a, b) => a.term.localeCompare(b.term));
}

/* the figures a book needs from the program's data — so the page sends only those */
export function figuresOf(book: Book) {
  const fids = new Set<string>(), knowledge = new Set<string>(), templates = new Set<string>();
  for (const c of book.chapters) for (const b of [...c.intro, ...c.sections.flatMap((s) => s.blocks)]) {
    if (b.t !== "figure") continue;
    if (b.fig.kind === "workflow") fids.add(b.fig.fid);
    if (b.fig.kind === "knowledge") knowledge.add(b.fig.name);
    if (b.fig.kind === "template") templates.add(b.fig.id);
  }
  return { fids: [...fids], knowledge: [...knowledge], templates: [...templates] };
}
