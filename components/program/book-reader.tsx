"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { HIGHLIGHT_COLORS, HIGHLIGHT_HEX, type BookMark, type HighlightColor } from "@/lib/program/book/mark-types";
import { glossaryOf, type Block, type Book, type BookChapter, type BookLang, type BookSection, type GlossaryEntry } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { COL, COL_PX, Inline, Paras, PlainInline, ReaderCtx, WIDE, label, prose, slug, type ReaderCtxValue } from "./book-context";
import { ChapterMap, ChecklistBlock, ContrastBlock, FigureView, PitfallsBlock, StepsBlock, TableBlock, TermsBlock, type BookFigures } from "./book-figures";
import { BookIndex } from "./book-index";
import { ReadingCards } from "./book-reading";
import { TalksView } from "./book-talks";
import { VlogRefs, type VlogRef } from "./book-vlog-refs";
import { applyCommunity, type CommunityLink, type CuratedVotes } from "@/lib/program/book/community";
import { buildReel } from "@/lib/program/book/reel";
import { BOOK_UI, LANG_COOKIE, LANG_LABEL, type BookUI } from "./book-ui";

export type { BookFigures };

/* The book reader — article pages. One page at a time (a chapter's opening, then its sections), set like a long-form
 * article: a quiet header, a left-aligned reading column with figures and tables breaking out wider, and on the right
 * the page's outline, the chapter's questions (ticked off as you read the sections that answer them) and the book's
 * contents. Select text to highlight it or add a note; bookmark a page; hover an underlined term for its meaning.
 * ← / → turn pages; #<section id> opens a section; it remembers where you stopped, what you've read and your ticks. */
type Page = { chapter: BookChapter; ci: number; section: BookSection | null; si: number; index?: boolean };

/* the book opens on its index; then the chapter's introduction, each topic (its opening, then its subtopics), the closing */
const pagesOf = (book: Book): Page[] => [
  { chapter: book.chapters[0], ci: -1, section: null, si: -1, index: true },
  ...book.chapters.flatMap((chapter, ci) => [{ chapter, ci, section: null, si: -1 }, ...chapter.sections.map((section, si) => ({ chapter, ci, section, si }))]),
];
const NO_BLOCKS: Block[] = [];
const keyOf = (p: Page) => (p.index ? "index" : p.section ? p.section.id : `ch-${p.chapter.id}`);
/* a topic's number within the chapter (1.1 … 1.5); the introduction and closing are named, not numbered */
const topicNo = (book: Book, c: BookChapter) => (c.day ? `${book.number ?? "1"}.${c.day}` : "");
const wordsOf = (blocks: Block[]) => JSON.stringify(blocks).replace(/"(t|fig|kind|id|fid|name)":"[^"]*"/g, "").split(/\s+/).length;
const store = (book: string) => ({
  get: (k: string) => { try { return window.localStorage.getItem(`node:book:${book}:${k}`); } catch { return null; } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(`node:book:${book}:${k}`, v); } catch { /* no storage */ } },
});

/* ---------- the glossary: which term is underlined where ---------- */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function glossRe(entries: GlossaryEntry[]) {
  if (!entries.length) return null;
  const alts = entries.map((e) => e.term).sort((a, b) => b.length - a.length).map(esc);
  return new RegExp(`(?<![A-Za-z0-9])(${alts.join("|")})(?:s|es)?(?![A-Za-z0-9])`, "gi");
}
const NO_GLOSS = new Set(["h", "h3", "terms", "prompt", "figure"]);
const DATA_KEYS = new Set(["t", "kind", "tone", "id", "fid", "name", "from", "to", "code"]);
function piecesOf(b: Block): string[] {
  const out: string[] = [];
  const walk = (x: unknown, k?: string) => {
    if (typeof x === "string") { if (!k || !DATA_KEYS.has(k)) out.push(...x.split(/\n\n+/)); }
    else if (Array.isArray(x)) x.forEach((v) => walk(v));
    else if (x && typeof x === "object") for (const [kk, v] of Object.entries(x)) walk(v, kk);
  };
  walk(b);
  return out;
}
/* the first time each term appears on a page: term → the piece of text it is underlined in */
function claimsOf(blocks: Block[], re: RegExp | null) {
  const claim = new Map<string, string>();
  if (!re) return claim;
  for (const b of blocks) {
    if (NO_GLOSS.has(b.t)) continue;
    for (const piece of piecesOf(b)) for (const m of piece.replace(/\*/g, "").matchAll(re)) {
      const k = m[1].toLowerCase();
      if (!claim.has(k)) claim.set(k, piece);
    }
  }
  return claim;
}

/* ---------- highlights: anchoring a quote in a block's text ---------- */
function pointIndex(root: Node, node: Node, offset: number) {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}
function rangeAt(root: Node, start: number, end: number): Range | null {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const r = document.createRange();
  let pos = 0, started = false, n: Node | null;
  while ((n = w.nextNode())) {
    const len = (n as Text).data.length;
    if (!started && start < pos + len) { r.setStart(n, start - pos); started = true; }
    if (started && end <= pos + len) { r.setEnd(n, end - pos); return r; }
    pos += len;
  }
  return null;
}
function rangeOfMark(root: Element, quote: string, occ: number) {
  const full = root.textContent ?? "";
  let i = full.indexOf(quote);
  for (let n = 0; n < occ && i !== -1; n++) i = full.indexOf(quote, i + 1);
  return i === -1 ? null : rangeAt(root, i, i + quote.length);
}
type Anchor = { block: number; quote: string; occ: number; rect: DOMRect };
function anchorOf(sel: Selection | null, body: HTMLElement): Anchor | null {
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  const el = (n: Node) => (n.nodeType === 1 ? (n as Element) : n.parentElement);
  const a = el(r.startContainer)?.closest("[data-b]"), b = el(r.endContainer)?.closest("[data-b]");
  if (!a || a !== b || !body.contains(a)) return null;
  if (el(r.commonAncestorContainer)?.closest("[data-nohl]")) return null;
  const full = a.textContent ?? "";
  let s = pointIndex(a, r.startContainer, r.startOffset), e = pointIndex(a, r.endContainer, r.endOffset);
  while (s < e && /\s/.test(full[s])) s++;
  while (e > s && /\s/.test(full[e - 1])) e--;
  /* whole words only: a highlight never cuts a word in half */
  const word = /[\p{L}\p{N}’'-]/u;
  while (s > 0 && word.test(full[s - 1]) && word.test(full[s])) s--;
  while (e < full.length && word.test(full[e]) && word.test(full[e - 1])) e++;
  const quote = full.slice(s, e);
  if (quote.length < 2) return null;
  let occ = 0;
  for (let i = full.indexOf(quote); i !== -1 && i < s; i = full.indexOf(quote, i + 1)) occ++;
  return { block: Number(a.getAttribute("data-b")), quote, occ, rect: r.getBoundingClientRect() };
}
type HighlightsApi = { set: (k: string, v: unknown) => void; delete: (k: string) => void };
const highlights = (): HighlightsApi | null => (typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as unknown as { highlights: HighlightsApi }).highlights : null);
const makeHighlight = (ranges: Range[]) => new (window as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight(...ranges);

/* the reader's language choice, for the next book page they open */
function rememberLang(l: BookLang) {
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error ?? "failed");
  return j as T;
}

type Panel =
  | { mode: "new"; anchor: Anchor; note: string; color: HighlightColor; writing: boolean }
  | { mode: "edit"; id: string; x: number; y: number; note: string; color: HighlightColor };

export function BookReader({ book, figures, color, marks: initialMarks, langs }: { book: Book; figures: BookFigures; color: string; marks: BookMark[]; langs: BookLang[] }) {
  const lang: BookLang = book.lang ?? "en";
  const ui = BOOK_UI[lang];
  const router = useRouter();
  const pathname = usePathname();
  const pages = useMemo(() => pagesOf(book), [book]);
  const [at, setAt] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [toc, setToc] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [lastAt, setLastAt] = useState("");
  const [onHeading, setOnHeading] = useState("");
  const [marks, setMarks] = useState<BookMark[]>(initialMarks);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pins, setPins] = useState<{ id: string; top: number; left: number }[]>([]);
  const [tip, setTip] = useState<{ k: string; x: number; y: number; below: boolean } | null>(null);
  const [flash, setFlash] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const ranges = useRef(new Map<string, Range>());
  const wantMark = useRef<string | null>(null);
  const tipTimer = useRef(0);
  const page = pages[at];
  const pageKey = keyOf(page);
  const blocks = page.index ? NO_BLOCKS : page.section ? page.section.blocks : page.chapter.intro;

  /* the vlog's clips, as the vlog plays them now — everyone's votes applied — with where each sits in its programme */
  const [vlog, setVlog] = useState<{ links: CommunityLink[]; curated: CuratedVotes } | null>(null);
  useEffect(() => {
    if (!book.talks?.length) return;
    let alive = true;
    void fetch(`/api/vlog/${book.id}`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive && j) setVlog(j); }).catch(() => {});
    return () => { alive = false; };
  }, [book.id, book.talks?.length]);
  const vlogRefs = useMemo(() => {
    const by = new Map<string, VlogRef[]>();
    if (!book.talks?.length) return by;
    const items = applyCommunity(buildReel(book), vlog?.links ?? [], vlog?.curated ?? {}, lang).filter((x) => x.dur > 0);
    let at = 0;
    for (const it of items) {
      if (it.kind === "video" && it.video && it.section) { const l = by.get(it.section.id) ?? []; l.push({ ...it, at }); by.set(it.section.id, l); }
      at += it.dur;
    }
    return by;
  }, [book, vlog, lang]);

  const { defs, re } = useMemo(() => { const g = glossaryOf(book); return { defs: new Map(g.map((x) => [x.term.toLowerCase(), x])), re: glossRe(g) }; }, [book]);
  const claim = useMemo(() => claimsOf(blocks, re), [blocks, re]);

  /* open where the link points, else where you stopped */
  useEffect(() => {
    const s = store(book.id);
    const id = window.requestAnimationFrame(() => {
      const want = decodeURIComponent(window.location.hash.slice(1));
      const i = pages.findIndex((p) => keyOf(p) === want);
      if (i > 0) setAt(i);
      setLastAt(s.get("at") ?? "");
      wantMark.current = new URLSearchParams(window.location.search).get("mark");
      try { setRead(JSON.parse(s.get("read") ?? "[]")); setTicks(JSON.parse(s.get("ticks") ?? "{}")); } catch { /* fresh */ }
    });
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const markRead = (id: string) => setRead((r) => {
    if (r.includes(id)) return r;
    const next = [...r, id];
    store(book.id).set("read", JSON.stringify(next));
    return next;
  });
  const go = (i: number) => {
    const n = Math.max(0, Math.min(pages.length - 1, i));
    if (page.section && n > at) markRead(page.section.id);
    setAt(n); setToc(false); setOnHeading(""); setPanel(null); setTip(null);
    if (!pages[n].index) { store(book.id).set("at", keyOf(pages[n])); setLastAt(keyOf(pages[n])); }
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search.replace(/[?&]mark=[^&]*/, "")}#${keyOf(pages[n])}`);
    top.current?.scrollIntoView({ block: "start" });
  };
  const goTo = (key: string) => { const i = pages.findIndex((p) => keyOf(p) === key); if (i >= 0) go(i); };
  const tick = useCallback((k: string) => setTicks((t) => { const next = { ...t, [k]: !t[k] }; store(book.id).set("ticks", JSON.stringify(next)); return next; }), [book.id]);
  const say = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(""), 2600); };

  const switchLang = (l: BookLang) => {
    if (l === lang) return;
    rememberLang(l);
    router.replace(`${pathname}?lang=${l}${window.location.hash}`, { scroll: false });
  };

  /* a link to another section while the book is open */
  useEffect(() => {
    const onHash = () => {
      const i = pages.findIndex((p) => keyOf(p) === decodeURIComponent(window.location.hash.slice(1)));
      if (i >= 0 && i !== at) { setAt(i); store(book.id).set("at", keyOf(pages[i])); top.current?.scrollIntoView({ block: "start" }); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPanel(null); setTip(null); setAskOpen(false); return; }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* the outline follows your reading; the bar shows how far down the page you are; reaching the end reads the page */
  useEffect(() => {
    const sectionId = page.section?.id;
    let hs: HTMLElement[] | null = null, done = false;
    const update = () => {
      const el = body.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)));
      /* only the three progress marks are touched: a variable on the page root would restyle every node below it */
      document.querySelectorAll<HTMLElement | SVGElement>("[data-read]").forEach((m) => m.style.setProperty("--read", String(p)));
      if (!done && sectionId && r.bottom < window.innerHeight + 40) { done = true; markRead(sectionId); }
      hs ??= [...el.querySelectorAll<HTMLElement>("h2[id]")];
      /* headings are in page order: the last one above the line is the current one */
      let current = "";
      for (const h of hs) { if (h.getBoundingClientRect().top < window.innerHeight * 0.3) current = h.id; else break; }
      setOnHeading(current);
    };
    /* at most once a frame, however fast the wheel turns */
    let frame = window.requestAnimationFrame(update);
    const onScroll = () => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll, { capture: true }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  /* paint this page's highlights, and pin a marker beside each one with a note */
  const pageMarks = marks.filter((m) => m.kind === "highlight" && m.page === pageKey && m.lang === lang);
  const paintKey = pageMarks.map((m) => `${m.id}:${m.color}:${m.note ? 1 : 0}`).join("|");
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const paint = () => {
      const found = new Map<string, Range>();
      const groups = Object.fromEntries(HIGHLIGHT_COLORS.map((c) => [c, [] as Range[]])) as Record<HighlightColor, Range[]>;
      for (const m of pageMarks) {
        const root = el.querySelector(`[data-b="${m.block}"]`);
        const r = root ? rangeOfMark(root, m.quote, m.occ) : null;
        if (r) { found.set(m.id, r); groups[m.color].push(r); }
      }
      ranges.current = found;
      const reg = highlights();
      if (reg) for (const c of HIGHLIGHT_COLORS) reg.set(`bk-${c}`, makeHighlight(groups[c]));
      const box = el.getBoundingClientRect();
      const wide = box.width >= COL_PX + 70;
      const margin = (box.width + Math.min(COL_PX, box.width)) / 2 + 14;
      setPins(pageMarks.filter((m) => m.note && found.has(m.id)).map((m) => {
        const rects = found.get(m.id)!.getClientRects();
        const first = rects[0], last = rects[rects.length - 1];
        return wide ? { id: m.id, top: first.top - box.top, left: margin } : { id: m.id, top: last.top - box.top - 6, left: Math.min(box.width - 20, last.right - box.left + 2) };
      }));
      if (wantMark.current && found.has(wantMark.current)) {
        found.get(wantMark.current)!.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
        wantMark.current = null;
      }
    };
    const id = window.requestAnimationFrame(paint);
    let t = 0;
    const onResize = () => { window.clearTimeout(t); t = window.setTimeout(paint, 150); };
    window.addEventListener("resize", onResize);
    return () => { window.cancelAnimationFrame(id); window.clearTimeout(t); window.removeEventListener("resize", onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, paintKey, lang]);
  useEffect(() => () => { const reg = highlights(); if (reg) for (const c of HIGHLIGHT_COLORS) reg.delete(`bk-${c}`); }, []);

  /* select text → the highlight bar */
  useEffect(() => {
    let t = 0;
    const onSel = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const el = body.current;
        if (!el) return;
        setPanel((p) => {
          if (p && (p.mode === "edit" || p.writing)) return p;
          const a = anchorOf(window.getSelection(), el);
          return a ? { mode: "new", anchor: a, note: "", color: "yellow", writing: false } : null;
        });
      }, 280);
    };
    /* the bar follows the selection as the page scrolls */
    let frame = 0;
    const onScroll = () => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(() => setPanel((p) => {
      if (!p || p.mode !== "new" || p.writing || !body.current) return p;
      const a = anchorOf(window.getSelection(), body.current);
      return a ? { ...p, anchor: a } : null;
    })); };
    document.addEventListener("selectionchange", onSel);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => { window.clearTimeout(t); window.cancelAnimationFrame(frame); document.removeEventListener("selectionchange", onSel); window.removeEventListener("scroll", onScroll, { capture: true }); };
  }, []);

  const saveNew = async (p: Extract<Panel, { mode: "new" }>, color: HighlightColor, note: string) => {
    setPanel(null);
    window.getSelection()?.removeAllRanges();
    try {
      const { mark } = await api<{ mark: BookMark }>("/api/book/marks", { method: "POST", body: JSON.stringify({ kind: "highlight", book: book.id, lang, page: pageKey, color, note, quote: p.anchor.quote, block: p.anchor.block, occ: p.anchor.occ }) });
      setMarks((m) => [...m, mark]);
    } catch (e) { say(e instanceof Error && e.message !== "failed" ? e.message : ui.failed); }
  };
  const saveEdit = async (id: string, change: { note?: string; color?: HighlightColor }) => {
    setMarks((m) => m.map((x) => (x.id === id ? { ...x, ...change } : x)));
    try { await api(`/api/book/marks/${id}`, { method: "PATCH", body: JSON.stringify(change) }); } catch { say(ui.failed); }
  };
  const removeMark = async (id: string) => {
    const before = marks;
    setMarks((m) => m.filter((x) => x.id !== id));
    setPanel(null);
    try { await api(`/api/book/marks/${id}`, { method: "DELETE" }); } catch { setMarks(before); say(ui.failed); }
  };
  const bookmark = marks.find((m) => m.kind === "bookmark" && m.page === pageKey);
  const toggleBookmark = async () => {
    if (bookmark) return removeMark(bookmark.id);
    try {
      const { mark } = await api<{ mark: BookMark }>("/api/book/marks", { method: "POST", body: JSON.stringify({ kind: "bookmark", book: book.id, lang, page: pageKey }) });
      setMarks((m) => [...m.filter((x) => x.id !== mark.id), mark]);
      say(ui.bookmarked);
    } catch { say(ui.failed); }
  };
  const openMark = (id: string, x: number, y: number) => {
    const m = marks.find((v) => v.id === id);
    if (m) setPanel({ mode: "edit", id, x, y, note: m.note, color: m.color });
  };
  /* a click on highlighted text opens it */
  const onBodyClick = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    for (const [id, r] of ranges.current) {
      for (const rect of r.getClientRects()) {
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) { openMark(id, e.clientX, rect.bottom); return; }
      }
    }
  };

  /* a term: show its meaning */
  const showTip = (t: EventTarget | null) => {
    const el = t instanceof Element ? t.closest<HTMLElement>("[data-term]") : null;
    if (!el) return;
    window.clearTimeout(tipTimer.current);
    const r = el.getBoundingClientRect();
    const below = r.top < 220;
    setTip({ k: el.dataset.term!, x: Math.max(16, Math.min(window.innerWidth - 336, r.left + r.width / 2 - 160)), y: below ? r.bottom + 8 : r.top - 8, below });
  };
  const hideTip = () => { window.clearTimeout(tipTimer.current); tipTimer.current = window.setTimeout(() => setTip(null), 180); };

  const { sections, titleOf } = useMemo(() => { const s = book.chapters.flatMap((c) => c.sections); return { sections: s, titleOf: new Map(s.map((x) => [x.id, x.title])) }; }, [book]);
  const done = sections.filter((s) => read.includes(s.id)).length;
  const prev = pages[at - 1], next = pages[at + 1];
  const figPrefix = topicNo(book, page.chapter) || (page.chapter.id === "foundations" ? "P" : page.chapter.id === "essence" ? "E" : page.chapter.id === "opening" ? `${book.number ?? "1"}.0` : `${book.number ?? "1"}.C`);
  const { figNums, hNums, outline, rows } = useMemo(() => {
    let nf = 0, nh = 0;
    const figNums = blocks.map((b) => (b.t === "figure" ? `${figPrefix}.${++nf}` : ""));
    const hNums = blocks.map((b) => (b.t === "h" ? String(++nh).padStart(2, "0") : ""));
    const outline = blocks.flatMap((b) => (b.t === "h" ? [{ id: slug(b.text), text: b.text }] : []));
    /* a paragraph long enough to sit beside a compact figure shares a row with it; sides alternate */
    const rows: ({ kind: "one"; i: number } | { kind: "pair"; t: number; f: number; flip: boolean })[] = [];
    for (let i = 0, pairs = 0; i < blocks.length; i++) {
      const b = blocks[i], nx = blocks[i + 1];
      if (b.t === "p" && b.text.length > 240 && nx?.t === "figure" && SIDE.has(nx.fig.kind)) { rows.push({ kind: "pair", t: i, f: i + 1, flip: pairs++ % 2 === 1 }); i++; }
      else rows.push({ kind: "one", i });
    }
    return { figNums, hNums, outline, rows };
  }, [blocks, figPrefix]);
  const headingNow = outline.find((h) => h.id === onHeading);
  const pageRefs = page.section ? vlogRefs.get(page.section.id) ?? [] : [];
  const refAt = (() => { let n = 0; return blocks.findIndex((b) => b.t === "h" && ++n === 4); })();
  const refsBlock = pageRefs.length ? <VlogRefs key={`refs-${pageKey}`} refs={pageRefs} vlogPath={`/dashboard/vlog/${book.id}`} /> : null;
  const minutes = page.section?.minutes ?? Math.max(1, Math.round(wordsOf(blocks) / 220));
  const lessonHref = page.chapter.day ? `/dashboard/roadmap/day/${page.chapter.day}` : null;
  const qs = page.index ? [] : book.questions?.[page.chapter.id] ?? [];
  const labelOf = (c: BookChapter) => (c.day ? ui.topic(topicNo(book, c)) : c.id === "closing" ? ui.closing : c.id === "foundations" ? ui.prerequisites : c.id === "essence" ? ui.essence : c.id === "reading" ? ui.furtherReading : c.id === "watch" ? ui.watch : ui.introduction);
  const answered = qs.filter((q) => read.includes(q.at)).length;
  const pageQs = page.section ? qs.filter((q) => q.at === page.section!.id) : [];
  const bookmarked = new Set(marks.filter((m) => m.kind === "bookmark").map((m) => m.page));

  const contents = (
    <nav aria-label={`${book.title} — ${ui.contents}`} className="grid gap-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">{ui.contents}</span>
        <span className="text-[11px] text-black/40">{ui.readOf(done, sections.length)}</span>
      </span>
      <span className="h-[3px] overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / sections.length) * 100}%`, background: color }} /></span>
      <button type="button" onClick={() => go(0)} aria-current={page.index ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold transition-colors", page.index ? "text-[var(--primary)]" : "text-black/60 hover:text-[var(--primary)]")}><MaterialSymbol className="text-[16px]" name="toc" />{ui.index} · {ui.chapter(book.number ?? "1")} {book.title}</button>
      <ol className="grid gap-0.5">
        {book.chapters.map((c, ci) => {
          const opener = pages.findIndex((p) => p.ci === ci && !p.section);
          const here = page.ci === ci;
          return (
            <li key={c.id}>
              <button type="button" onClick={() => go(opener)} aria-current={here && !page.section ? "page" : undefined} className={cn("flex w-full items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors", here ? "text-[var(--primary)]" : "text-black/55 hover:text-[var(--primary)]")}>
                <span className="w-7 shrink-0 font-mono text-[11px] text-black/35">{topicNo(book, c) || c.n.replace(/^\d+$/, "·")}</span>
                <span className={cn("min-w-0 flex-1 leading-snug", here && "font-semibold")}>{c.title}</span>
                {bookmarked.has(`ch-${c.id}`) ? <MaterialSymbol className="shrink-0 text-[14px]" name="bookmark" filled style={{ color }} /> : null}
              </button>
              {here && c.sections.length ? (
                <ol className="mb-1 ml-[36px] grid border-l border-black/[0.08]">
                  {c.sections.map((s, si) => {
                    const i = pages.findIndex((p) => p.ci === ci && p.si === si);
                    const on = page.section?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button type="button" onClick={() => go(i)} aria-current={on ? "page" : undefined} className={cn("-ml-px flex w-full items-start gap-1.5 border-l-2 py-1 pl-3 pr-1 text-left text-[12.5px] leading-snug transition-colors", on ? "font-semibold text-[var(--primary)]" : "border-transparent text-black/50 hover:text-[var(--primary)]")} style={on ? { borderColor: color } : undefined}>
                          <span className="min-w-0 flex-1">{s.title}</span>
                          {bookmarked.has(s.id) ? <MaterialSymbol className="mt-px shrink-0 text-[14px]" name="bookmark" filled style={{ color }} /> : null}
                          {read.includes(s.id) ? <MaterialSymbol className="mt-px shrink-0 text-[14px] text-[#0f766e]" name="check" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const questionList = (compact: boolean) => (
    <ol className={cn("grid", compact ? "gap-1" : "gap-0")}>
      {qs.map((q, qi) => {
        const ok = read.includes(q.at), here = page.section?.id === q.at;
        return (
          <li key={qi}>
            <button type="button" onClick={() => goTo(q.at)} className={cn("group flex w-full items-start gap-2.5 text-left transition-colors", compact ? "rounded-md px-1 py-1 text-[12.5px] leading-snug" : "border-b border-black/[0.06] py-3 text-[15px] leading-[1.5]", ok ? "text-black/45" : here ? "font-semibold text-[#0d1117]" : "text-[#24292f] hover:text-[var(--primary)]")}>
              <MaterialSymbol className={cn("mt-px shrink-0", compact ? "text-[15px]" : "text-[18px]")} name={ok ? "check_circle" : here ? "radio_button_partial" : "radio_button_unchecked"} filled={ok} style={{ color: ok ? "#0f766e" : here ? color : "rgba(0,0,0,.25)" }} />
              <span className="min-w-0 flex-1">
                {q.q}
                {!compact ? <span className="mt-0.5 block text-[12.5px] font-normal text-black/40">{ui.answeredIn}: {titleOf.get(q.at) ?? q.at}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const goToRef = useRef(goTo);
  useEffect(() => { goToRef.current = goTo; });
  const stableGoTo = useCallback((key: string) => goToRef.current(key), []);
  const ctx: ReaderCtxValue = useMemo(() => ({ ui, claim, re, color, ticks, onTick: tick, goTo: stableGoTo }), [ui, claim, re, color, ticks, tick, stableGoTo]);
  const term = tip ? defs.get(tip.k) ?? [...defs.values()].find((g) => tip.k.startsWith(g.term.toLowerCase())) : undefined;

  return (
    <ReaderCtx.Provider value={ctx}>
      <div ref={top} className="grid scroll-mt-28 grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[190px_minmax(0,1fr)] 2xl:grid-cols-[190px_minmax(0,1fr)_240px]">
        {/* the left rail: this page's outline, following your reading */}
        <aside className="hidden xl:block">
          <nav aria-label={ui.onThisPage} className="sticky top-[calc(var(--nb,0px)+88px)] grid max-h-[calc(100vh-var(--nb,0px)-110px)] gap-3 overflow-y-auto pb-6 [scrollbar-width:thin]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">{ui.onThisPage}</span>
            <span className="h-[3px] overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-150" data-read style={{ width: "calc(var(--read, 0) * 100%)", background: color }} /></span>
            {outline.length ? (
              <ol className="grid border-l border-black/[0.08]">
                {outline.map((h, hi) => (
                  <li key={h.id}>
                    <a href={`#${pageKey}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ block: "start", behavior: "smooth" }); }} className={cn("-ml-px flex gap-2 border-l-2 py-1.5 pl-3 text-[12.5px] leading-snug transition-colors", onHeading === h.id ? "font-semibold text-[#0d1117]" : "border-transparent text-black/50 hover:text-[var(--primary)]")} style={onHeading === h.id ? { borderColor: color } : undefined}>
                      <span className="font-mono text-[10px] leading-[18px]" style={{ color: onHeading === h.id ? color : "rgba(0,0,0,.3)" }}>{String(hi + 1).padStart(2, "0")}</span>{h.text}
                    </a>
                  </li>
                ))}
              </ol>
            ) : page.index ? (
              <ol className="grid border-l border-black/[0.08]">
                {book.chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#idx-${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`idx-${c.id}`)?.scrollIntoView({ block: "start", behavior: "smooth" }); }} className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-3 text-[12.5px] leading-snug text-black/55 hover:text-[var(--primary)]">
                      <span className="w-6 shrink-0 font-mono text-[10px] leading-[18px] text-black/30">{topicNo(book, c) || c.n.replace(/^\d+$/, "·")}</span>{c.title}
                    </a>
                  </li>
                ))}
              </ol>
            ) : <span className="text-[12.5px] leading-snug text-black/50">{page.section ? page.section.title : page.chapter.title}</span>}
          </nav>
        </aside>
        <article lang={lang === "ur" ? "ur-Latn" : "en"} className="min-w-0 rounded-[20px] bg-white px-5 pb-12 pt-7 ring-1 ring-black/[0.05] sm:px-8 lg:px-12">
          {/* how far down the page */}
          <div className="sticky top-[calc(var(--nb,0px)+64px)] z-10 -mx-5 -mt-7 mb-7 h-[3px] bg-transparent sm:-mx-8 lg:-mx-12" aria-hidden><span className="block h-full rounded-full transition-[width] duration-150" data-read style={{ width: "calc(var(--read, 0) * 100%)", background: color }} /></div>

          {/* the head */}
          <header className={cn(COL, "grid gap-3.5", !page.index && "border-b border-black/[0.07] pb-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-black/45">
                <button type="button" onClick={() => go(0)} className="uppercase hover:text-black/70">{ui.chapter(book.number ?? "1")} · {book.title}</button>
                <MaterialSymbol className="text-[13px] text-black/25" name="chevron_right" />
                <span>{page.index ? ui.index : labelOf(page.chapter)}</span>
                {page.section?.code ? <><MaterialSymbol className="text-[13px] text-black/25" name="chevron_right" /><span style={{ color }}>{page.section.code}</span></> : null}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {langs.length > 1 ? (
                  <span role="group" aria-label={ui.language} className="flex rounded-full bg-black/[0.05] p-0.5">
                    {langs.map((l) => <button key={l} type="button" onClick={() => switchLang(l)} aria-pressed={l === lang} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors", l === lang ? "bg-white text-[#0d1117] shadow-sm" : "text-black/50 hover:text-black/80")}>{LANG_LABEL[l]}</button>)}
                  </span>
                ) : null}
                {qs.length ? (
                  <span className="relative">
                    <button type="button" onClick={() => setAskOpen((o) => !o)} aria-expanded={askOpen} aria-haspopup="dialog" className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors", askOpen ? "bg-black/[0.06] text-[#0d1117]" : "text-black/55 hover:bg-black/[0.05]")}>
                      <MaterialSymbol className="text-[16px]" name="help" style={{ color }} /><span className="hidden sm:inline">{lang === "ur" ? "Sawal" : "Questions"}</span>
                      <span className="rounded-full px-1.5 font-mono text-[10.5px] text-white" style={{ background: answered === qs.length ? "#0f766e" : color }}>{answered}/{qs.length}</span>
                      <MaterialSymbol className={cn("text-[16px] transition-transform", askOpen && "rotate-180")} name="expand_more" />
                    </button>
                    {askOpen ? (
                      <>
                        <span className="fixed inset-0 z-[40]" onClick={() => setAskOpen(false)} aria-hidden />
                        <div role="dialog" aria-label={ui.chapterQuestions} className="bk-in fixed inset-x-4 top-[calc(var(--nb,0px)+90px)] z-[41] grid sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[420px] gap-3 rounded-2xl bg-white p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,.18)] ring-1 ring-black/[0.08]">
                          {pageQs.length ? (
                            <div className="grid gap-1.5 rounded-xl bg-[#f6f7f9] p-3">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">{ui.thisPageAnswers}</span>
                              {pageQs.map((q, qi) => <span key={qi} className="flex items-start gap-2 text-[13.5px] leading-[1.45] text-[#24292f]"><MaterialSymbol className="mt-px shrink-0 text-[16px]" name={read.includes(q.at) ? "check_circle" : "help"} filled={read.includes(q.at)} style={{ color: read.includes(q.at) ? "#0f766e" : color }} />{q.q}</span>)}
                            </div>
                          ) : null}
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">{ui.chapterQuestions}</span>
                            <span className="text-[11.5px] text-black/45">{ui.answered(answered, qs.length)}</span>
                          </span>
                          <span className="h-[3px] overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(answered / qs.length) * 100}%`, background: "#0f766e" }} /></span>
                          <div className="max-h-[50vh] overflow-y-auto pr-1 [scrollbar-width:thin]" onClick={() => setAskOpen(false)}>{questionList(true)}</div>
                        </div>
                      </>
                    ) : null}
                  </span>
                ) : null}
                {page.index ? null : <button type="button" onClick={() => void toggleBookmark()} aria-pressed={!!bookmark} title={bookmark ? ui.bookmarked : ui.bookmark} aria-label={bookmark ? ui.bookmarked : ui.bookmark} className="flex size-8 items-center justify-center rounded-full text-black/55 hover:bg-black/[0.05]"><MaterialSymbol className="text-[19px]" name="bookmark" filled={!!bookmark} style={bookmark ? { color } : undefined} /></button>}
                <Link href={`/dashboard/book/${book.id}/notes`} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-black/55 hover:bg-black/[0.05]"><MaterialSymbol className="text-[16px]" name="edit_note" /><span className="hidden sm:inline">{ui.myNotes}</span></Link>
                <Link href={`/dashboard/book/${book.id}/glossary`} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-black/55 hover:bg-black/[0.05]"><MaterialSymbol className="text-[16px]" name="dictionary" /><span className="hidden sm:inline">{ui.glossary}</span></Link>
                <button type="button" onClick={() => setToc(true)} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-semibold text-black/60 hover:bg-black/[0.03] 2xl:hidden"><MaterialSymbol className="text-[16px]" name="toc" /><span className="hidden sm:inline">{ui.contents}</span></button>
              </span>
            </div>
            {page.index ? null : <>
            {!page.section ? <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color }}>{labelOf(page.chapter)}</span> : null}
            <h1 className="max-w-[920px] text-[clamp(28px,3vw,44px)] font-semibold leading-[1.12] tracking-[-0.022em] text-[#0d1117]">{page.section ? page.section.title : page.chapter.title}</h1>
            {!page.section && page.chapter.question ? <p className="text-[18px] leading-[1.5] text-black/55">{page.chapter.question}</p> : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-black/45">
              <span className="flex items-center gap-1"><MaterialSymbol className="text-[15px]" name="schedule" />{ui.minRead(minutes)}</span>
              {page.section ? <span>{labelOf(page.chapter)} · {page.chapter.title}</span> : page.chapter.sections.length ? <span>{ui.subtopics(page.chapter.sections.length)}</span> : null}
              {page.section?.fid && lessonHref ? <Link href={lessonHref} className="flex items-center gap-1 font-semibold underline-offset-4 hover:underline" style={{ color }}><MaterialSymbol className="text-[15px]" name="arrow_outward" />{ui.doLesson}</Link> : null}
            </div>
            </>}
          </header>

          {page.index ? (
            <div className="pt-7">
              <BookIndex book={book} ui={ui} color={color} read={read} bookmarked={bookmarked} lastAt={lastAt} onGo={goTo}
                titleOf={(k) => { const p = pages.find((x) => keyOf(x) === k); return p ? (p.section ? p.section.title : p.chapter.title) : null; }} />
            </div>
          ) : !page.section ? <div className="pt-7"><ChapterMap chapter={page.chapter} read={read} /></div> : null}

          {/* the text */}
          <div ref={body} className="@container relative grid gap-6 pt-8" onClick={onBodyClick} onMouseOver={(e) => showTip(e.target)} onMouseOut={(e) => { if (e.target instanceof Element && e.target.closest("[data-term]")) hideTip(); }} onFocus={(e) => showTip(e.target)} onBlur={hideTip}>
            {rows.map((r) => {
              const one = (i: number, paired = false) => (
                <div key={`${pageKey}-${i}`} data-b={i} className="contents">
                  <BlockView b={blocks[i]} k={`${pageKey}-${i}`} figures={figures} num={figNums[i] || hNums[i]} book={book} paired={paired} />
                </div>
              );
              if (r.kind === "one") return r.i === refAt && refsBlock ? <div key={`${pageKey}-refs`} className="contents">{refsBlock}{one(r.i)}</div> : one(r.i);
              return (
                <div key={`${pageKey}-pair-${r.t}`} className={cn(COL, "grid items-start gap-x-10 gap-y-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
                  <div className={cn("grid min-w-0 gap-5", r.flip && "@4xl:order-2")}>{one(r.t)}</div>
                  <div className="min-w-0 @4xl:sticky @4xl:top-[calc(var(--nb,0px)+96px)]">{one(r.f, true)}</div>
                </div>
              );
            })}

            {pins.map((p) => (
              <button key={p.id} type="button" data-nohl onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); openMark(p.id, r.left, r.bottom); }} aria-label={ui.note} className="absolute flex size-6 items-center justify-center rounded-full bg-white text-black/60 shadow-[0_1px_4px_rgba(0,0,0,.18)] ring-1 ring-black/[0.06] hover:text-black" style={{ top: p.top, left: p.left }}>
                <MaterialSymbol className="text-[14px]" name="sticky_note_2" filled />
              </button>
            ))}

            {/* a section with fewer headings: its clips go at the end */}
            {refAt < 0 ? refsBlock : null}

            {/* the reading this subtopic points to */}
            {page.section && book.reading?.some((r) => r.for.includes(page.section!.id)) ? (
              <section className={cn(COL, "mt-4 grid gap-2")} data-nohl>
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45"><MaterialSymbol className="text-[15px]" name="local_library" />{ui.readMore}</span>
                <ReadingCards book={book} compact items={book.reading.filter((r) => r.for.includes(page.section!.id))} />
              </section>
            ) : null}

            {/* a section closes on the questions it answered */}
            {pageQs.length ? (
              <section className={cn(COL, "mt-4 grid gap-2 rounded-2xl border px-5 py-4")} style={{ borderColor: `${color}33`, background: `${color}08` }} data-nohl>
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color }}><MaterialSymbol className="text-[15px]" name="task_alt" />{ui.nowYouCanAnswer}</span>
                {pageQs.map((q, qi) => <span key={qi} className="flex items-start gap-2 text-[15px] leading-[1.5] text-[#24292f]"><MaterialSymbol className="mt-0.5 shrink-0 text-[17px]" name={read.includes(q.at) ? "check_circle" : "radio_button_unchecked"} filled={read.includes(q.at)} style={{ color: read.includes(q.at) ? "#0f766e" : "rgba(0,0,0,.3)" }} />{q.q}</span>)}
                <span className="text-[12.5px] text-black/45">{ui.answered(answered, qs.length)}</span>
              </section>
            ) : null}

            {!page.section && qs.length ? (
              <section className={cn(COL, "mt-4 grid gap-1")} data-nohl>
                <span className="flex items-baseline justify-between gap-3 pb-1">
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/45">{ui.chapterQuestions}</span>
                  <span className="text-[12px] text-black/45">{ui.answered(answered, qs.length)}</span>
                </span>
                <span className="h-[3px] overflow-hidden rounded-full bg-black/[0.06]"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(answered / qs.length) * 100}%`, background: color }} /></span>
                {questionList(false)}
              </section>
            ) : null}

            {!page.index && !page.section && page.chapter.sections.length ? (
              <div className={cn(COL, "mt-2 grid")} data-nohl>
                <span className="pb-2 pt-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">{ui.inThisChapter}</span>
                {page.chapter.sections.map((s, si) => (
                  <button key={s.id} type="button" onClick={() => go(at + 1 + si)} className="group grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-black/[0.06] py-3.5 text-left">
                    <span className="font-mono text-[11.5px] text-black/35">{s.code ?? String(si + 1).padStart(2, "0")}</span>
                    <span className="grid gap-1">
                      <b className="text-[15.5px] font-semibold text-[#0d1117] transition-colors group-hover:underline group-hover:underline-offset-4">{s.title}</b>
                      {s.blocks.find((x) => x.t === "lead") ? <span className="text-[13.5px] leading-6 text-black/50">{(s.blocks.find((x) => x.t === "lead") as { text: string }).text.replace(/\*/g, "")}</span> : null}
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-black/40">{s.minutes} min{read.includes(s.id) ? <MaterialSymbol className="text-[16px] text-[#0f766e]" name="check_circle" filled /> : null}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {page.section ? <div className="mt-10"><ChapterMap chapter={page.chapter} read={read} here={page.section.id} /></div> : null}

          {/* turning the page */}
          <footer className={cn(WIDE, "mt-12 grid gap-3 border-t border-black/[0.07] pt-6 sm:grid-cols-2")}>
            {prev ? (
              <button type="button" onClick={() => go(at - 1)} className="group grid justify-items-start gap-1 rounded-2xl px-1 py-2 text-left">
                <span className="flex items-center gap-1 text-[12px] text-black/40"><MaterialSymbol className="text-[15px] transition-transform group-hover:-translate-x-0.5" name="arrow_back" />{ui.previous}</span>
                <span className="text-[15px] font-semibold text-[#0d1117] group-hover:underline group-hover:underline-offset-4">{prev.index ? ui.index : prev.section ? prev.section.title : prev.chapter.title}</span>
              </button>
            ) : <span />}
            {next ? (
              <button type="button" onClick={() => go(at + 1)} className="group grid justify-items-end gap-1 rounded-2xl px-1 py-2 text-right">
                <span className="flex items-center gap-1 text-[12px]" style={{ color }}>{next.section ? ui.next : labelOf(next.chapter)}<MaterialSymbol className="text-[15px] transition-transform group-hover:translate-x-0.5" name="arrow_forward" /></span>
                <span className="text-[15px] font-semibold text-[#0d1117] group-hover:underline group-hover:underline-offset-4">{next.section ? next.section.title : next.chapter.title}</span>
              </button>
            ) : <span className="self-center justify-self-end text-[13px] text-black/40">{ui.endOfBook}</span>}
          </footer>
        </article>

        {/* the right rail: the book's contents */}
        <aside className="hidden 2xl:block">
          <div className="sticky top-[calc(var(--nb,0px)+88px)] grid max-h-[calc(100vh-var(--nb,0px)-110px)] gap-7 overflow-y-auto pb-6 pr-1 [scrollbar-width:thin]">
            {contents}
          </div>
        </aside>
        <button type="button" data-nohl onClick={() => setToc(true)} aria-label={ui.contents} className="fixed bottom-5 right-5 z-[150] flex max-w-[min(360px,calc(100vw-40px))] items-center gap-2.5 rounded-full bg-[#0d1117] py-2 pl-2 pr-4 text-left text-white shadow-[0_10px_30px_rgba(0,0,0,.25)] transition-transform hover:-translate-y-0.5 2xl:hidden">
          <svg viewBox="0 0 36 36" className="size-8 shrink-0 -rotate-90" aria-hidden><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3.5" /><circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="94.2" data-read style={{ strokeDashoffset: "calc((1 - var(--read, 0)) * 94.2)" }} /></svg>
          <span className="grid min-w-0 leading-tight"><span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">{ui.contents}</span><span className="truncate text-[12.5px] font-semibold">{headingNow?.text ?? (page.index ? ui.index : page.section ? page.section.title : page.chapter.title)}</span></span>
        </button>
        {toc ? (
          <div className="fixed inset-0 z-[160] flex justify-end bg-black/30 backdrop-blur-sm 2xl:hidden" role="dialog" aria-modal="true" aria-label={ui.contents} onClick={() => setToc(false)}>
            <div className="grid h-full w-[min(340px,88vw)] content-start gap-7 overflow-y-auto bg-white p-5 pt-[calc(var(--nb,0px)+20px)]" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setToc(false)} aria-label="Close" className="ml-auto flex size-9 items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button>
              {outline.length ? (
                <nav aria-label={ui.onThisPage} className="grid gap-1.5 xl:hidden">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">{ui.onThisPage}</span>
                  {outline.map((h, hi) => <button key={h.id} type="button" onClick={() => { setToc(false); document.getElementById(h.id)?.scrollIntoView({ block: "start", behavior: "smooth" }); }} className={cn("flex items-baseline gap-2 rounded-md px-1 py-0.5 text-left text-[13px]", onHeading === h.id ? "font-semibold text-[#0d1117]" : "text-black/55")}><span className="font-mono text-[10.5px]" style={{ color }}>{String(hi + 1).padStart(2, "0")}</span>{h.text}</button>)}
                </nav>
              ) : null}
              {contents}
            </div>
          </div>
        ) : null}
      </div>

      {/* floating: the highlight bar, a mark's note, a term's meaning, a passing message */}
      {panel && typeof document !== "undefined" ? createPortal(
        <MarkPanel panel={panel} ui={ui} setPanel={setPanel} onSaveNew={saveNew} onSaveEdit={saveEdit} onRemove={removeMark} onCopy={(t) => { void navigator.clipboard.writeText(t); setPanel(null); }} />,
        document.body,
      ) : null}
      {tip && term && typeof document !== "undefined" ? createPortal(
        <div role="tooltip" onMouseEnter={() => window.clearTimeout(tipTimer.current)} onMouseLeave={hideTip} className="fixed z-[180] grid w-[320px] gap-1.5 rounded-xl bg-[#0d1117] p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,.25)]" style={{ left: tip.x, top: tip.y, transform: tip.below ? undefined : "translateY(-100%)" }}>
          <b className="text-[14px]">{term.term}</b>
          <span className="text-[13px] leading-[1.55] text-white/80"><PlainInline text={term.def} /></span>
          <Link href={`/dashboard/book/${book.id}/glossary#${slug(term.term)}`} className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#7cc4ff] hover:underline"><MaterialSymbol className="text-[14px]" name="dictionary" />{ui.inGlossary}</Link>
        </div>,
        document.body,
      ) : null}
      {flash && typeof document !== "undefined" ? createPortal(
        <div role="status" className="fixed bottom-6 left-1/2 z-[190] -translate-x-1/2 rounded-full bg-[#0d1117] px-4 py-2 text-[13px] font-semibold text-white shadow-lg">{flash}</div>,
        document.body,
      ) : null}
    </ReaderCtx.Provider>
  );
}

/* ---------- the highlight bar and a mark's note ---------- */
function MarkPanel({ panel, ui, setPanel, onSaveNew, onSaveEdit, onRemove, onCopy }: {
  panel: Panel; ui: BookUI; setPanel: (p: Panel | null) => void;
  onSaveNew: (p: Extract<Panel, { mode: "new" }>, color: HighlightColor, note: string) => void;
  onSaveEdit: (id: string, change: { note?: string; color?: HighlightColor }) => void;
  onRemove: (id: string) => void; onCopy: (t: string) => void;
}) {
  const dots = (on: HighlightColor, pick: (c: HighlightColor) => void) => (
    <span className="flex items-center gap-1.5">
      {HIGHLIGHT_COLORS.map((c) => <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c)} aria-label={`${ui.highlight} · ${c}`} aria-pressed={on === c} className={cn("size-[22px] rounded-full ring-2 ring-offset-1 transition-transform hover:scale-110", on === c ? "ring-black/40" : "ring-transparent")} style={{ background: HIGHLIGHT_HEX[c] }} />)}
    </span>
  );
  const W = 340;
  if (panel.mode === "new" && !panel.writing) {
    const r = panel.anchor.rect;
    const above = r.top > 70;
    return (
      <div data-nohl className="fixed z-[185] flex items-center gap-2 rounded-full bg-[#0d1117] px-3 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,.25)]" style={{ left: Math.max(12, Math.min(window.innerWidth - 300, r.left + r.width / 2 - 140)), top: above ? r.top - 50 : r.bottom + 10 }}>
        {dots("yellow", (c) => onSaveNew(panel, c, ""))}
        <span className="mx-0.5 h-5 w-px bg-white/15" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setPanel({ ...panel, writing: true })} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12.5px] font-semibold hover:bg-white/10"><MaterialSymbol className="text-[16px]" name="edit_note" />{ui.addNote}</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onCopy(panel.anchor.quote)} aria-label={ui.copy} className="flex size-7 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[16px]" name="content_copy" /></button>
      </div>
    );
  }
  const x = panel.mode === "new" ? panel.anchor.rect.left : panel.x;
  const y = panel.mode === "new" ? panel.anchor.rect.bottom : panel.y;
  const quote = panel.mode === "new" ? panel.anchor.quote : null;
  return (
    <div data-nohl role="dialog" aria-label={ui.note} className="fixed z-[185] grid gap-3 rounded-2xl bg-white p-4 shadow-[0_16px_50px_rgba(0,0,0,.22)] ring-1 ring-black/[0.08]" style={{ width: W, left: Math.max(12, Math.min(window.innerWidth - W - 12, x - 20)), top: Math.min(window.innerHeight - 280, y + 10) }}>
      {quote ? <span className="line-clamp-3 border-l-2 border-black/15 pl-3 text-[13px] italic leading-[1.5] text-black/55">{quote}</span> : null}
      <textarea autoFocus value={panel.note} onChange={(e) => setPanel({ ...panel, note: e.target.value })} placeholder={ui.notePlaceholder} rows={4} maxLength={4000} className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-[14px] leading-[1.5] outline-none focus:border-black/30" />
      <div className="flex items-center justify-between gap-2">
        {dots(panel.color, (c) => (panel.mode === "edit" ? (setPanel({ ...panel, color: c }), onSaveEdit(panel.id, { color: c })) : setPanel({ ...panel, color: c })))}
        <span className="flex items-center gap-1.5">
          {panel.mode === "edit" ? <button type="button" onClick={() => onRemove(panel.id)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#c2410c] hover:bg-[#c2410c]/10">{ui.remove}</button> : null}
          <button type="button" onClick={() => setPanel(null)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-black/55 hover:bg-black/5">{ui.cancel}</button>
          <button type="button" onClick={() => (panel.mode === "new" ? onSaveNew(panel, panel.color, panel.note) : (onSaveEdit(panel.id, { note: panel.note }), setPanel(null)))} className="rounded-lg bg-[#0d1117] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-black">{ui.save}</button>
        </span>
      </div>
    </div>
  );
}

const CALLOUT = {
  key: { icon: "key", ring: "#6d48d8" },
  warn: { icon: "do_not_disturb_on", ring: "#c2410c" },
  tip: { icon: "lightbulb", ring: "#0f766e" },
  agent: { icon: "smart_toy", ring: "#0284c7" },
  case: { icon: "inventory_2", ring: "#d81b60" },
} as const;

/* figures compact enough to sit beside the paragraph they illustrate */
const SIDE = new Set(["anatomy", "ladder", "bars", "delta", "funnel", "stack", "decide", "cycle", "hub", "matrix", "split", "ranges", "flow"]);

const BlockView = memo(function BlockView({ b, k, figures, num, book, paired }: { b: Block; k: string; figures: BookFigures; num: string; book: Book; paired?: boolean }) {
  const { ui, color } = useContext(ReaderCtx);
  switch (b.t) {
    case "lead": return <p className={cn(COL, "pr-[8%] text-[21px] leading-[1.55] tracking-[-0.005em] text-black/70")}><Inline text={b.text} /></p>;
    case "p": return <div className={cn(COL, "grid gap-4")}><Paras text={b.text} className={prose} /></div>;
    case "h": return (
      <h2 id={slug(b.text)} className={cn(COL, "group mt-8 flex scroll-mt-32 items-baseline gap-3 border-t border-black/[0.07] pt-7 text-[23px] font-semibold leading-tight tracking-[-0.015em] text-[#0d1117]")}>
        <span className="font-mono text-[13px] font-bold" style={{ color }}>{num}</span>
        <span className="min-w-0 flex-1">{b.text}</span>
      </h2>
    );
    case "h3": return <h3 className={cn(COL, "mt-1 text-[17.5px] font-semibold text-[#0d1117]")}>{b.text}</h3>;
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return <L className={cn(COL, "grid gap-2 pl-6 marker:text-black/30", prose, b.ordered ? "list-decimal" : "list-disc")}>{b.items.map((x, xi) => <li key={xi} className="pl-1"><Inline text={x} /></li>)}</L>;
    }
    case "quote": return <blockquote className={cn(COL, "border-l-2 pl-5 text-[17px] italic leading-[1.7] text-black/70")} style={{ borderColor: color }}><Inline text={b.text} />{b.by ? <footer className="mt-1 text-[12.5px] not-italic text-black/45">— {b.by}</footer> : null}</blockquote>;
    case "pull": return <p className={cn(COL, "my-1 border-y border-black/[0.08] py-6 text-center text-[22px] font-semibold leading-[1.4] tracking-[-0.01em] text-[#0d1117]")}><span style={{ color }}>“</span><Inline text={b.text} /><span style={{ color }}>”</span></p>;
    case "note": return <aside className={cn(COL, "flex gap-3 text-[14px] leading-[1.65] text-black/55")}><MaterialSymbol className="mt-0.5 shrink-0 text-[16px] text-black/30" name="sticky_note_2" /><span><Inline text={b.text} /></span></aside>;
    case "tldr": return (
      <section className={cn(COL, "grid gap-2 rounded-2xl border-l-4 bg-[#f6f7f9] px-5 py-4")} style={{ borderColor: color }}>
        <span className={cn(label, "text-black/45")}>{ui.inShort}</span>
        <ol className="grid gap-1.5">{b.items.map((x, xi) => <li key={xi} className="flex gap-3 text-[15px] leading-[1.6] text-[#24292f]"><span className="mt-[3px] flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-bold text-white" style={{ background: color }}>{xi + 1}</span><span><Inline text={x} /></span></li>)}</ol>
      </section>
    );
    case "callout": {
      const c = CALLOUT[b.tone];
      return (
        <aside className={cn(COL, "grid gap-1.5 rounded-r-2xl border-l-[3px] py-3 pl-5 pr-4")} style={{ borderColor: c.ring, background: `${c.ring}0a` }}>
          <span className={cn(label, "flex items-center gap-1.5")} style={{ color: c.ring }}><MaterialSymbol className="text-[15px]" name={c.icon} />{b.title ?? ui.callout[b.tone]}</span>
          <div className="grid gap-3"><Paras text={b.text} className="text-[15.5px] leading-[1.7] text-[#24292f]" /></div>
        </aside>
      );
    }
    case "steps": return <StepsBlock b={b} k={k} />;
    case "table": return <TableBlock b={b} />;
    case "contrast": return <ContrastBlock b={b} k={k} />;
    case "terms": return <TermsBlock b={b} />;
    case "pitfalls": return <PitfallsBlock b={b} />;
    case "prompt": return <PromptBlock title={b.title} text={b.text} />;
    case "talks": return <TalksView book={book} />;
    case "reading": return <ReadingCards book={book} items={(book.reading ?? []).filter((r) => r.kind === b.kind)} />;
    case "checklist": return <ChecklistBlock b={b} k={k} />;
    case "good": return (
      <section className={cn(COL, "grid gap-2 rounded-2xl bg-[#0f766e]/[0.05] px-5 py-4")}>
        <span className={cn(label, "flex items-center gap-1.5 text-[#0f766e]")}><MaterialSymbol className="text-[16px]" name="verified" />{ui.whatGood}</span>
        <ul className="grid gap-1.5">{b.items.map((x, xi) => <li key={xi} className="flex items-start gap-2.5 text-[15px] leading-[1.6] text-[#24292f]"><MaterialSymbol className="mt-0.5 shrink-0 text-[17px] text-[#0f766e]" name="check" /><span><Inline text={x} /></span></li>)}</ul>
      </section>
    );
    case "try": return (
      <section className={cn(COL, "grid gap-2 rounded-2xl px-5 py-4")} style={{ background: `${color}0d`, boxShadow: `inset 0 0 0 1px ${color}2e` }}>
        <span className={cn(label, "flex items-center gap-1.5")} style={{ color }}><MaterialSymbol className="text-[16px]" name="edit_note" />{ui.tryIt}</span>
        <p className="text-[15.5px] leading-[1.7] text-[#24292f]"><Inline text={b.text} /></p>
      </section>
    );
    case "figure": return SIDE.has(b.fig.kind) && !paired ? (
      /* a compact figure on its own: the drawing, with its caption set beside it as the note */
      <figure className={cn(WIDE, "grid items-center gap-x-10 gap-y-2 py-1 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}>
        <div className="@container overflow-hidden rounded-2xl bg-[#f7f8fa] p-4 ring-1 ring-black/[0.04]"><FigureView f={b.fig} figures={figures} book={book} /></div>
        <figcaption className="grid gap-1.5 px-1 text-[12.5px] leading-[1.55] text-black/50 @4xl:border-l-2 @4xl:pl-5 @4xl:text-[14.5px] @4xl:leading-[1.65] @4xl:text-black/60" style={{ borderColor: color }}><span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color }}>{ui.figure} {num}</span><span><Inline text={b.caption} /></span></figcaption>
      </figure>
    ) : (
      <figure className={cn(WIDE, "grid gap-2 py-1")}>
        <div className="@container overflow-hidden rounded-2xl bg-[#f7f8fa] p-4 ring-1 ring-black/[0.04]"><FigureView f={b.fig} figures={figures} book={book} /></div>
        <figcaption className="px-1 text-[12.5px] leading-[1.55] text-black/50"><span className="font-semibold text-black/70">{ui.figure} {num}.</span> <Inline text={b.caption} /></figcaption>
      </figure>
    );
  }
});

function PromptBlock({ title, text }: { title?: string; text: string }) {
  const { ui } = useContext(ReaderCtx);
  const [copied, setCopied] = useState(false);
  return (
    <figure className={cn(WIDE, "grid gap-0 overflow-hidden rounded-2xl bg-[#0d1117]")}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-2">
        <span className={cn(label, "flex items-center gap-1.5 text-[#7cc4ff]")}><MaterialSymbol className="text-[15px]" name="smart_toy" />{title ?? ui.promptForAgent}</span>
        {/* the label is drawn by CSS, so it never shifts the text that highlights are anchored to */}
        <button type="button" data-nohl onClick={() => void navigator.clipboard.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); })} aria-label={copied ? ui.copied : ui.copy} data-l={copied ? ui.copied : ui.copy} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-white/70 after:content-[attr(data-l)] hover:bg-white/10 hover:text-white">
          <MaterialSymbol className="text-[15px]" name={copied ? "check" : "content_copy"} />
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-mono text-[13px] leading-[1.7] text-white/85">{text}</pre>
    </figure>
  );
}
