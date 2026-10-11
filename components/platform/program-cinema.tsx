"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagship } from "@/lib/node-landing-data";
import { useFlagship } from "@/components/providers/pricing-provider";
import { flagshipHref, masterclasses, programPath } from "@/lib/platform-data";
import { cn } from "@/lib/utils";

import s from "./cinema.module.css";
import { d, DARK, LOOK, pad, STATUS_LABEL } from "./program-posters";

/* Full-screen program posters: each program gets a flat field of its own colour and a drawn motif that says what it is.
   Between slides, a hard-edged curtain wipes across; the words rise from behind a mask and the motif draws itself in. */

type Slide = { id: string; title: string; length: string; bg: string; ink: string; status: "live" | "soon" | "building"; tagline: string; who: string; outcome: string; art: ReactNode; primary: { label: string; href: string }; secondary: { label: string; href: string }; overview?: boolean };

/* the opener: every program at once — the tiles jump to each one's slide */
const OVERVIEW: Slide = {
  id: "all", title: "One path. Every stage.", length: `${programPath[0].length} → ${programPath.at(-1)!.length}`, bg: DARK, ink: "#ffffff", status: "live",
  tagline: "From a fifteen-day first look at computer science to a six-month specialisation — plus one-day masterclasses. Pick where you start; each one leads to the next.",
  who: "Everyone, from first look to specialist", outcome: `${flagship.name} — open now`, art: null, overview: true,
  primary: { label: `Start with ${flagship.name}`, href: "#copy-paste-go" }, secondary: { label: "Compare them", href: "#compare" },
};
const SLIDES: Slide[] = [
  OVERVIEW,
  ...[...programPath].sort((a, b) => Number(!!b.live) - Number(!!a.live)).map((p): Slide => ({
    id: p.id, title: p.title, length: p.length, status: p.status, tagline: p.tagline, who: p.who, outcome: p.outcome, ...LOOK[p.id],
    primary: p.live ? { label: "Enroll · {price}", href: "/register" } : { label: "Hear when it opens", href: `/register?interest=${p.id}` },
    secondary: p.live ? { label: "See the curriculum", href: flagshipHref } : { label: "Details", href: `#${p.id}` },
  })),
  {
    id: masterclasses.id, title: masterclasses.title, length: masterclasses.length, status: masterclasses.status, tagline: masterclasses.tagline, who: "Anyone, any level",
    outcome: `${masterclasses.classes.length} classes planned — and many more`, ...LOOK[masterclasses.id],
    primary: { label: "Hear when it opens", href: `/register?interest=${masterclasses.id}` }, secondary: { label: "See the classes", href: `#${masterclasses.id}` },
  },
];
const DURATION = 8000; // ms per slide

/* the overview's art: every program as a small poster, in path order (the live one marked) */
function Overview({ onPick, tab }: { onPick: (index: number) => void; tab: number }) {
  const order = [...programPath.map((p) => p.id), masterclasses.id];
  const tiles = order.map((id) => ({ id, index: SLIDES.findIndex((x) => x.id === id) })).filter((t) => t.index > 0);
  return (
    <div className={s.overview}>
      {tiles.map(({ id, index }, k) => {
        const sl = SLIDES[index];
        return (
          <button key={id} type="button" tabIndex={tab} onClick={() => onPick(index)} aria-label={`${sl.title} — ${sl.length}`}
            className={cn(s.tile, s.slideIn)} style={{ "--tbg": sl.bg, "--tink": sl.ink, "--d": `${0.55 + k * 0.09}s`, "--fx": "0px", "--fy": "24px" } as CSSProperties}>
            <span className={s.tileTop}>{pad(k + 1)}<span className={cn(s.tileDot, sl.status === "live" && s.tileLive)} title={STATUS_LABEL[sl.status]} /></span>
            <span className={s.tileName}>{sl.title}</span>
            <span className={s.tileLen}>{sl.length}{sl.status === "live" ? " · open" : ""}</span>
          </button>
        );
      })}
      <span className={s.pathLine} aria-hidden />
      <span className={s.pathNote}><span>First look</span><span>Specialist</span></span>
    </div>
  );
}

export function ProgramCinema() {
  const plan = useFlagship();
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(false);
  const [visible, setVisible] = useState(true);
  const stage = useRef<HTMLElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const n = SLIDES.length;

  const go = useCallback((to: number, direction?: "next" | "prev") => {
    const target = (to + n) % n;
    if (target === cur) return;
    setPrev(cur);
    setDir(direction ?? (to > cur ? "next" : "prev"));
    setCur(target);
  }, [n, cur]);
  const next = useCallback(() => go(cur + 1, "next"), [go, cur]);
  const back = useCallback(() => go(cur - 1, "prev"), [go, cur]);

  useEffect(() => { if (prev === null) return; const t = setTimeout(() => setPrev(null), 1000); return () => clearTimeout(t); }, [prev, cur]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setCalm(mq.matches);
    const t = setTimeout(set, 0);
    mq.addEventListener("change", set);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    if (stage.current) io.observe(stage.current);
    const vis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => { clearTimeout(t); mq.removeEventListener("change", set); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!visible || (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, visible]);

  const onDown = (e: PointerEvent<HTMLElement>) => { if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent<HTMLElement>) => {
    const st = swipe.current; swipe.current = null;
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else back(); }
  };
  const playing = !paused && !calm && visible;

  return (
    <section
      ref={stage}
      className={s.stage}
      aria-roledescription="carousel"
      aria-label="Node programs"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
    >
      {SLIDES.map((sl, i) => {
        const state = i === cur ? "current" : i === prev ? "leaving" : "idle";
        const words = sl.title.split(" ");
        const tab = i === cur ? 0 : -1;
        return (
          <div key={sl.id} className={s.slide} data-state={state} data-dir={dir} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${sl.title}`} aria-hidden={i !== cur}
            style={{ "--bg": sl.bg, "--ink": sl.ink } as CSSProperties}>
            <span className={cn(s.rule, s.ruleH)} style={{ top: 92 }} aria-hidden />
            {state !== "idle" ? (
              <div className={s.inner}>
                <div className={cn(s.copy, sl.overview && s.copyOverview)}>
                  <span className={cn(s.top, s.fade)} style={d(0.35)}>
                    <span className={s.index}>{pad(i + 1)} / {pad(n)}</span>
                    <span className={cn(s.status, sl.status === "live" && s.statusLive)}>{sl.overview ? "All programs" : STATUS_LABEL[sl.status]}</span>
                    <span>{sl.overview ? "Node programs" : sl.id === "copy-paste-go" ? flagship.kind : sl.who}</span>
                  </span>
                  <h2 className={s.title} aria-label={sl.title}>
                    {words.map((w, wi) => <span key={wi} className={s.mask} aria-hidden><span className={s.word} style={{ "--i": wi } as CSSProperties}>{w}</span></span>)}
                  </h2>
                  <p className={cn(s.tagline, s.fade)} style={d(0.85)}>{sl.tagline}</p>
                  <div className={cn(s.facts, s.fade)} style={d(1)}>
                    {sl.overview ? (
                      <>
                        <span className={s.fact}><small>Programs</small><b>{programPath.length} + masterclasses</b></span>
                        <span className={s.fact}><small>From → to</small><b>{sl.length}</b></span>
                        <span className={s.fact}><small>Open now</small><b>{flagship.name} · {plan.price}</b></span>
                      </>
                    ) : (
                      <>
                        <span className={s.fact}><small>Length</small><b>{sl.length}</b></span>
                        <span className={s.fact}><small>For</small><b>{sl.who}</b></span>
                        {sl.status === "live" ? <span className={s.fact}><small>Price · {plan.off}</small><b>{plan.price} <s style={{ opacity: 0.55, fontWeight: 600 }}>{plan.was}</s></b></span> : <span className={s.fact}><small>You come away with</small><b>{sl.outcome}</b></span>}
                      </>
                    )}
                  </div>
                  <div className={cn(s.ctas, s.fade)} style={d(1.15)}>
                    {sl.overview
                      ? <button type="button" tabIndex={tab} onClick={() => go(SLIDES.findIndex((x) => x.id === "copy-paste-go"), "next")} className={cn(s.btn, s.btnSolid)}>{sl.primary.label.replace("{price}", plan.price)}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
                      : <Link href={sl.primary.href} tabIndex={tab} className={cn(s.btn, s.btnSolid)}>{sl.primary.label.replace("{price}", plan.price)}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link>}
                    {sl.secondary.href.startsWith("#") ? <a href={sl.secondary.href} tabIndex={tab} className={cn(s.btn, s.btnLine)}>{sl.secondary.label}</a> : <Link href={sl.secondary.href} tabIndex={tab} className={cn(s.btn, s.btnLine)}>{sl.secondary.label}</Link>}
                  </div>
                </div>
                <div className={s.art}>
                  {sl.overview ? <Overview onPick={(j) => go(j)} tab={tab} /> : sl.art}
                  {sl.overview ? null : <span className={cn(s.length, s.fade)} style={d(1.2)}><span className={s.lengthSmall}>Length</span>{sl.length}</span>}
                </div>

                {/* the index: every program, numbered — click to jump; the line under the current one is the timer */}
                <nav className={s.nav} aria-label="Programs">
                  <span className={s.big} aria-live="polite">{pad(cur + 1)}<small>/ {pad(n)}</small></span>
                  <div className={s.list} style={{ "--n": n } as CSSProperties}>
                    {SLIDES.map((o, j) => (
                      <button key={o.id} type="button" tabIndex={tab} onClick={() => go(j)} aria-label={`Show ${o.title}`} aria-current={j === cur}
                        className={cn(s.item, j === cur && s.itemOn, j < cur && s.itemDone)}
                        style={{ "--dur": `${DURATION}ms`, "--play": playing && i === cur ? "running" : "paused" } as CSSProperties}>
                        <span className={s.itemNum}>{pad(j + 1)}</span>
                        <span className={s.itemName}>{o.overview ? "All programs" : o.title}</span>
                        <span className={s.track}><span key={j === cur ? `on-${cur}` : "off"} className={s.fill} onAnimationEnd={j === cur && i === cur ? next : undefined} /></span>
                      </button>
                    ))}
                  </div>
                  <span className={s.arrows}>
                    <button type="button" tabIndex={tab} className={s.arrow} onClick={back} aria-label="Previous program"><MaterialSymbol name="arrow_back" /></button>
                    <button type="button" tabIndex={tab} className={s.arrow} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"} aria-pressed={!paused}><MaterialSymbol name={paused || calm ? "play_arrow" : "pause"} /></button>
                    <button type="button" tabIndex={tab} className={s.arrow} onClick={next} aria-label="Next program"><MaterialSymbol name="arrow_forward" /></button>
                  </span>
                </nav>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
