"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { GuideVisual, Lesson } from "@/lib/program";
import { cn } from "@/lib/utils";

import { Visual } from "./kickoff-guide";

/* Day 0's board: the whole kick-off on one full-screen board, the way every lesson's Learn board works — chapters
 * along the top (one per orientation lesson), the narration as subtitles at the bottom, and each line bringing the next
 * thing onto the board. It walks through every lesson's guide in order: the road ahead, how the month works, inside a
 * lesson, tasks and reviews, the agent kit, achievements — and ends at picking your project. */

const kicker = "font-mono text-[10px] font-bold uppercase tracking-[0.16em]";
const B = ({ children }: { children: ReactNode }) => <b className="font-bold text-white">{children}</b>;
const sentences = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((x) => x.trim()).filter(Boolean);
/* an element that arrives when the narration reaches line k */
const show = (li: number, k: number) => cn(`kb-l${k} transition-all duration-500 ease-out`, li >= k ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0");

const VISUAL_LINE: Record<GuideVisual["kind"], string> = {
  stages: "Here they are, in order — each with its days and the gate it ends at.",
  ladder: "From the biggest piece to the smallest — with the real names from Day 1.",
  steps: "The seven steps, always in this order.",
  workflow: "A real workflow from Day 1: steps run to the gate; the diamond is a decision; the loops are what happens when it goes another way.",
  cycle: "Every task goes round this cycle — and if it's sent back, round again.",
  kit: "These are the kit's layers — with Discover's real file counts.",
  unlocks: "And this is when each stage's kit opens.",
  xp: "What earns XP — and how XP adds up to levels.",
};

/* short names for the chapter pills */
const SHORT: Record<string, string> = { welcome: "Welcome", month: "The month", lesson: "Inside a lesson", tasks: "Tasks & reviews", kit: "Agent kit", community: "Achievements", project: "Your project" };

type Frame = { key: string; chapter: number; title: string; icon: string; lines: ReactNode[]; render: (li: number) => ReactNode };

/* the frames: per lesson, a title card, then one frame per section of its guide */
function useFrames(lessons: Lesson[]): Frame[] {
  return useMemo(() => lessons.flatMap((l, ci) => {
    const g = l.guide!;
    const intro = sentences(g.intro);
    const out: Frame[] = [{
      key: `${l.fid}:title`, chapter: ci, title: l.title, icon: "flag",
      lines: [<>Lesson <B>{l.code}</B> — <B>{l.title}</B>.</>, ...intro],
      render: (li) => (
        <div className="grid max-w-3xl justify-items-center gap-5 text-center">
          <span className={cn(kicker, "rounded-full bg-[var(--deep-indigo)] px-3 py-1.5 text-[#4fd1c5]")}>Day 0 · lesson {ci + 1} of {lessons.length}</span>
          <h2 className="font-heading text-[clamp(2rem,4.6vw,3.8rem)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-[var(--primary)]">{l.title}</h2>
          <p className={cn("max-w-2xl text-[clamp(15px,1.6vw,19px)] leading-relaxed text-black/60", show(li, 1))}>{g.intro}</p>
          <div className={cn("flex flex-wrap justify-center gap-2", show(li, Math.max(1, intro.length)))}>
            {g.sections.map((s) => <span key={s.title} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--primary)] shadow-sm ring-1 ring-black/[0.06]"><MaterialSymbol className="text-[16px] text-[var(--electric-pink)]" name={s.icon} />{s.title}</span>)}
          </div>
        </div>
      ),
    }];
    for (const [si, s] of g.sections.entries()) {
      const body = s.body ? sentences(s.body) : [];
      const lines: ReactNode[] = [<><B>{s.title}.</B>{body[0] ? ` ${body[0]}` : ""}</>, ...body.slice(1)];
      const visualAt = s.visual ? lines.length : -1;
      if (s.visual) lines.push(VISUAL_LINE[s.visual.kind]);
      const pointsAt = lines.length;
      for (const [k, v] of s.points ?? []) lines.push(<><B>{k}</B> — {v}</>);
      out.push({
        key: `${l.fid}:${si}`, chapter: ci, title: s.title, icon: s.icon, lines,
        render: (li) => (
          <div className="grid w-full max-w-6xl gap-5">
            <span className="flex items-center gap-3">
              <span className="flex size-11 flex-none items-center justify-center rounded-2xl bg-[var(--deep-indigo)] text-[#4fd1c5] shadow-lg"><MaterialSymbol className="text-[24px]" name={s.icon} /></span>
              <span className="grid leading-tight">
                <span className={cn(kicker, "text-[var(--bridge-teal)]")}>{l.code} · {l.title}</span>
                <h2 className="text-[clamp(1.4rem,2.6vw,2.1rem)] font-bold tracking-[-0.02em] text-[var(--primary)]">{s.title}</h2>
              </span>
            </span>
            {s.body ? <p className={cn("max-w-4xl text-[clamp(14px,1.4vw,17px)] leading-relaxed text-black/60", show(li, 0))}>{s.body}</p> : null}
            {s.visual ? <div className={cn("rounded-3xl bg-white/70 p-3 shadow-[0_18px_50px_-30px_rgba(13,17,23,.35)] ring-1 ring-black/[0.05] sm:p-4", show(li, visualAt))}><Visual v={s.visual} /></div> : null}
            {s.points?.length ? (
              <dl className="grid gap-2.5 sm:grid-cols-2">
                {s.points.map(([k, v], pi) => (
                  <div key={k} className={cn("grid gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.05]", show(li, pointsAt + pi), li === pointsAt + pi && "ring-2 ring-[var(--electric-pink)]")}>
                    <dt className="text-[14.5px] font-bold text-[var(--primary)]">{k}</dt>
                    <dd className="text-[13.5px] leading-6 text-black/60">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ),
      });
    }
    return out;
  }).concat([{
    key: "end", chapter: lessons.length - 1, title: "Now it's your turn", icon: "rocket_launch",
    lines: [<>That&rsquo;s <B>how Copy, Paste, Go works</B>.</>, "Now go through the lessons: each one has a short task — finish them to pass the Day 0 gate.", <>The last one is the big one: <B>pick your project</B> — everything you make this month is for it.</>],
    render: (li) => (
      <div className="grid max-w-3xl justify-items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-[var(--electric-pink)] text-white shadow-lg shadow-pink-500/30"><MaterialSymbol className="text-[34px]" name="rocket_launch" /></span>
        <h2 className="font-heading text-[clamp(2rem,4.4vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-[var(--primary)]">Ready for Day 1</h2>
        <ol className={cn("grid w-full max-w-xl gap-1.5 text-left", show(li, 1))}>
          {lessons.map((l) => <li key={l.fid} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-[13.5px] shadow-sm ring-1 ring-black/[0.05]"><span className="font-mono text-[11px] text-black/40">{l.code}</span><b className="text-[var(--primary)]">{l.title}</b><MaterialSymbol className="ml-auto text-[17px] text-black/25" name="edit_note" /></li>)}
        </ol>
      </div>
    ),
  }]), [lessons]);
}

export function KickoffBoard({ lessons, start = 0, onClose }: { lessons: Lesson[]; start?: number; onClose: (finished: boolean) => void }) {
  const frames = useFrames(lessons);
  const [fi, setFi] = useState(() => Math.max(0, frames.findIndex((f) => f.chapter === start)));
  const [li, setLi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [menu, setMenu] = useState(false);
  const fr = frames[fi];
  const total = frames.reduce((n, f) => n + f.lines.length, 0);
  const done = frames.slice(0, fi).reduce((n, f) => n + f.lines.length, 0) + li + 1;
  const last = fi === frames.length - 1 && li === fr.lines.length - 1;

  const next = () => {
    if (li < fr.lines.length - 1) setLi(li + 1);
    else if (fi < frames.length - 1) { setFi(fi + 1); setLi(0); }
    else { setPlaying(false); onClose(true); }
  };
  const prev = () => {
    if (li > 0) setLi(li - 1);
    else if (fi > 0) { setFi(fi - 1); setLi(frames[fi - 1].lines.length - 1); }
  };
  const jump = (f: number) => { setFi(f); setLi(0); setMenu(false); };

  /* keys: → / space next, ← back, Esc close */
  const nav = useRef({ next, prev, menu });
  useEffect(() => { nav.current = { next, prev, menu }; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); if (nav.current.menu) setMenu(false); else onClose(false); }
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); e.stopPropagation(); nav.current.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); nav.current.prev(); }
    };
    window.addEventListener("keydown", onKey, true);
    const before = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.documentElement.style.overflow = before; };
  }, [onClose]);
  /* play: the narration moves on by itself, a little longer for longer lines */
  const line = fr.lines[li];
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => nav.current.next(), 3200 + Math.min(5000, textOf(line).length * 38));
    return () => clearTimeout(t);
  }, [playing, fi, li, line]);
  /* keep what the narration just brought on in view */
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stage.current?.querySelector(`.kb-l${li}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 120);
  }, [fi, li]);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#f4f3ef] [animation:kb-in_.3s_ease-out]" role="dialog" aria-modal="true" aria-label="Day 0 board" style={{ backgroundImage: "radial-gradient(rgba(13,17,23,.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <style>{`@keyframes kb-in { from { opacity: 0; transform: scale(.985); } } @keyframes kb-line { from { opacity: 0; transform: translateY(6px); } }`}</style>
      {/* top: Day 0, its lessons as chapters, close */}
      <header className="flex flex-none items-center gap-3 px-4 py-3 sm:px-6">
        <span className="grid min-w-0 leading-tight">
          <span className={cn(kicker, "text-[9.5px] text-[var(--bridge-teal)]")}>Day 0 · the board</span>
          <b className="truncate text-[14px] text-[var(--primary)]">How Copy, Paste, Go works</b>
        </span>
        <nav className="mx-auto hidden items-center gap-0.5 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-black/[0.05] md:flex" aria-label="Lessons">
          {lessons.map((l, ci) => {
            const f = frames.findIndex((x) => x.chapter === ci);
            return (
              <button key={l.fid} type="button" onClick={() => jump(f)} title={l.title} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors", ci === fr.chapter ? "bg-[var(--deep-indigo)] text-white" : ci < fr.chapter ? "text-[var(--bridge-teal)]" : "text-black/45 hover:text-[var(--primary)]")}>
                {ci < fr.chapter ? <MaterialSymbol className="text-[14px]" name="check_circle" /> : <span className="font-mono text-[10.5px]">{l.code}</span>}
                <span className={cn("whitespace-nowrap", ci === fr.chapter ? "" : "hidden xl:inline")}>{SHORT[l.fid.split(".").pop() ?? ""] ?? l.title}</span>
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={() => onClose(false)} className="ml-auto flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black/60 shadow-sm ring-1 ring-black/[0.06] hover:text-[var(--primary)] md:ml-0"><MaterialSymbol className="text-[16px]" name="close" />Close</button>
      </header>

      {/* the board */}
      <main className="relative min-h-0 flex-1 px-4 pb-3 sm:px-8">
        <div ref={stage} key={fr.key} className="h-full overflow-y-auto [animation:kb-in_.35s_ease-out]">
          <div className="flex min-h-full items-center justify-center py-4">{fr.render(li)}</div>
        </div>
      </main>

      {/* the narration */}
      <footer className="flex-none bg-[var(--deep-indigo)] px-4 pb-4 pt-3 text-white sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-3">
          <div key={`${fi}-${li}`} className="grid min-h-[56px] content-center gap-1 [animation:kb-line_.3s_ease-out]">
            <span className={cn(kicker, "text-[9.5px] text-[#4fd1c5]")}>Narrator · {lessons[fr.chapter]?.code} {fr.title}</span>
            <p className="text-[clamp(15px,1.5vw,18px)] leading-snug text-white/85">{line}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={prev} disabled={fi === 0 && li === 0} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label="Back"><MaterialSymbol className="text-[20px]" name="arrow_back" /></button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-colors", menu ? "bg-white text-[var(--deep-indigo)]" : "bg-white/10 hover:bg-white/20")}>
                <MaterialSymbol className="text-[18px]" name="format_list_bulleted" /><span className="hidden sm:inline">Contents</span>
              </button>
              {menu ? (
                <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 grid max-h-[min(70vh,560px)] w-[min(92vw,380px)] gap-0.5 overflow-y-auto rounded-2xl bg-white p-2 text-[var(--primary)] shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)] [animation:kb-line_.18s_ease-out]">
                  {lessons.map((l, ci) => (
                    <div key={l.fid} className="grid gap-0.5 pb-1">
                      <span className={cn(kicker, "px-2 pb-0.5 pt-2 text-[9px] text-black/40")}>{l.code} · {l.title}</span>
                      {frames.map((f, i) => ({ f, i })).filter((x) => x.f.chapter === ci && x.f.key !== "end").map(({ f, i }) => (
                        <button key={f.key} type="button" onClick={() => jump(i)} className={cn("flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-left text-[12.5px] transition-colors", i === fi ? "bg-[var(--deep-indigo)] text-white" : i < fi ? "text-black/45 hover:bg-black/[0.04]" : "hover:bg-black/[0.04]")}>
                          <MaterialSymbol className={cn("text-[15px]", i === fi ? "text-[#4fd1c5]" : i < fi ? "text-[var(--bridge-teal)]" : "text-black/35")} name={i < fi ? "check_circle" : f.icon} />
                          <span className="min-w-0 truncate">{f.key.endsWith(":title") ? "Introduction" : f.title}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={() => setPlaying((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}><MaterialSymbol className="text-[20px]" name={playing ? "pause" : "play_arrow"} /></button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--electric-pink)] transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} /></div>
            <button type="button" onClick={next} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-pink-500/25 hover:brightness-110">
              {last ? "Start the lessons" : "Next"}<MaterialSymbol className="text-[18px]" name="arrow_forward" />
            </button>
          </div>
          <span className="hidden text-center text-[11px] text-white/40 sm:block">→ or space for the next line · ← back · Esc to close</span>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

/* the plain text of a narration line (for timing) */
function textOf(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(textOf).join("");
  if (typeof n === "object" && "props" in n) return textOf((n as { props: { children?: ReactNode } }).props.children);
  return "";
}
