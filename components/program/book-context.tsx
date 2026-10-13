"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";

import { BOOK_UI, type BookUI } from "./book-ui";

/* What every block and figure on a book page shares: the reader's words, the glossary's claims on this page, the act
   colour, your ticks, and a way to open another page. */
export type ReaderCtxValue = {
  ui: BookUI;
  claim: Map<string, string>;
  re: RegExp | null;
  color: string;
  ticks: Record<string, boolean>;
  onTick: (k: string) => void;
  goTo: (pageKey: string) => void;
};
export const ReaderCtx = createContext<ReaderCtxValue>({ ui: BOOK_UI.en, claim: new Map(), re: null, color: "#6d48d8", ticks: {}, onTick: () => {}, goTo: () => {} });
export const useReader = () => useContext(ReaderCtx);

/* the reading column, and what may break out of it — both centred */
export const COL = "mx-auto w-full max-w-[1160px]";
export const WIDE = COL;
export const COL_PX = 1160;
export const label = "font-mono text-[10px] font-bold uppercase tracking-[0.16em]";
export const prose = "text-[17px] leading-[1.8] text-[#24292f]";
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const plain = (s: string) => s.replace(/\*/g, "");

export function PlainInline({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part.replace(/\*/g, "")}</Fragment>))}</>;
}

/* inline text: **bold**, *italic*, and the page's first use of each glossary term, underlined */
export function Inline({ text }: { text: string }) {
  const { claim, re, color } = useReader();
  const flat = plain(text);
  const mine = re ? [...claim].filter(([, piece]) => plain(piece) === flat).map(([k]) => k) : [];
  const used = new Set<string>();
  const terms = (s: string, key: string): ReactNode => {
    if (!re || !mine.length) return s;
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of s.matchAll(re)) {
      const k = m[1].toLowerCase();
      if (!mine.includes(k) || used.has(k) || m.index === undefined) continue;
      used.add(k);
      out.push(s.slice(last, m.index));
      out.push(<span key={`${key}-${m.index}`} data-term={k} tabIndex={0} className="cursor-help underline decoration-dotted decoration-[1.5px] underline-offset-[4px] outline-none focus-visible:rounded focus-visible:ring-2" style={{ textDecorationColor: `${color}aa` }}>{m[0]}</span>);
      last = m.index + m[0].length;
    }
    if (!out.length) return s;
    out.push(s.slice(last));
    return out;
  };
  return <>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i} className="font-semibold text-[#0d1117]">{terms(part.slice(2, -2), `b${i}`)}</strong> : part.startsWith("*") && part.length > 2 ? <em key={i}>{terms(part.slice(1, -1), `e${i}`)}</em> : <Fragment key={i}>{terms(part, `t${i}`)}</Fragment>)}</>;
}
export function Paras({ text, className }: { text: string; className?: string }) {
  return <>{text.split(/\n\n+/).map((t, i) => <p key={i} className={className}><Inline text={t} /></p>)}</>;
}

/* a small control row above an interactive figure */
export function Controls({ children, hint }: { children?: ReactNode; hint?: string }) {
  return (
    <div data-nohl className="mb-3 flex flex-wrap items-center gap-2">
      {hint ? <span className="mr-auto flex items-center gap-1.5 text-[12px] text-black/45"><span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />{hint}</span> : <span className="mr-auto" />}
      {children}
    </div>
  );
}
export function Btn({ onClick, children, on, color, disabled }: { onClick: () => void; children: ReactNode; on?: boolean; color?: string; disabled?: boolean }) {
  return (
    <button type="button" data-nohl disabled={disabled} onClick={onClick} aria-pressed={on} className={"flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors disabled:opacity-40 " + (on ? "text-white" : "bg-white text-black/65 ring-1 ring-black/10 hover:bg-black/[0.04]")} style={on ? { background: color ?? "#0d1117" } : undefined}>
      {children}
    </button>
  );
}

export const TONE = { human: "#c2410c", system: "#0d1117", new: "#6d48d8", risk: "#d81b60", fact: "#0f766e", guess: "#a86b00", bad: "#d81b60", good: "#0f766e", neutral: "#475569" } as const;
export const PAL = ["#6d48d8", "#0f766e", "#c2410c", "#0284c7", "#d81b60", "#a86b00", "#475569", "#7c3aed"];

/* step through n things, one every `ms`, stopping at the end */
export function usePlayer(n: number, ms = 1300) {
  const [at, setAt] = useState(-1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setAt((a) => {
      if (a + 1 >= n) { setPlaying(false); return a; }
      return a + 1;
    }), ms);
    return () => window.clearInterval(id);
  }, [playing, n, ms]);
  const play = () => { if (!playing && at >= n - 1) setAt(-1); setPlaying((p) => !p); if (at < 0 || at >= n - 1) setAt(0); };
  return { at, setAt: (i: number) => { setPlaying(false); setAt(i); }, playing, play, reset: () => { setPlaying(false); setAt(-1); } };
}
/* true once the element has scrolled into view */
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { const id = window.requestAnimationFrame(() => setSeen(true)); return () => window.cancelAnimationFrame(id); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}
export const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function PlayControls({ p, n, hint }: { p: ReturnType<typeof usePlayer>; n: number; hint?: string }) {
  const { ui, color } = useReader();
  return (
    <Controls hint={hint}>
      {p.at >= 0 ? <span className="font-mono text-[11px] text-black/45">{ui.stepOf(p.at + 1, n)}</span> : null}
      <Btn onClick={() => p.setAt(Math.max(0, p.at - 1))} disabled={p.at <= 0}><MaterialSymbol className="text-[15px]" name="chevron_left" /></Btn>
      <Btn onClick={p.play} on={p.playing} color={color}><MaterialSymbol className="text-[15px]" name={p.playing ? "pause" : "play_arrow"} />{p.playing ? ui.pause : ui.play}</Btn>
      <Btn onClick={() => p.setAt(Math.min(n - 1, p.at + 1))} disabled={p.at >= n - 1}><MaterialSymbol className="text-[15px]" name="chevron_right" /></Btn>
      {p.at >= 0 ? <Btn onClick={p.reset}><MaterialSymbol className="text-[15px]" name="restart_alt" /></Btn> : null}
    </Controls>
  );
}
