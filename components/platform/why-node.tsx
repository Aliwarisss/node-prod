"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { moreToTell, whyBeliefs, whyChapters, whyEntries, whyHero, whyMilestones, whyPlanks, whySky } from "@/lib/why-data";
import { cn } from "@/lib/utils";

import { WhyNarrator } from "./why-narrator";

/* Why Node — the philosophy, told as a story. The words scroll; the scene beside them (pinned) moves on with each
 * chapter: the edge of education, the gap people fall into, the bridge Node builds across it, the ladders onto it
 * from any point, and the road beyond, with Node alongside. */
const PINK = "#e91e63", TEAL = "#4fd1c5", INK = "#070a10", WHITE = "#f5f1ea";

export function WhyNode() {
  /* which part of the page is being read: 0–5 the story (the scene follows), 6 the beliefs, 7 the close */
  const [at, setAt] = useState(0);
  const stage = Math.min(at, 5);
  const page = useRef<HTMLElement>(null);
  useEffect(() => {
    const els = page.current?.querySelectorAll<HTMLElement>("[data-stage]");
    if (!els?.length) return;
    /* the chapter crossing the middle of the screen is the one on stage */
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.stage));
    }, { rootMargin: "-50% 0px -49% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={page} className="min-h-screen overflow-x-clip" style={{ background: INK, color: WHITE }}>
      <WhyNarrator at={at} />
      {/* the story: words on one side, the scene pinned on the other (on phones, pinned on top) */}
      <div className="relative lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="sticky top-[var(--nb,0px)] z-20 h-[46svh] lg:z-0 lg:order-2 lg:h-[calc(100svh-var(--nb,0px))]" style={{ background: INK }} aria-hidden>
          <Scene stage={stage} />
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-40 lg:block" style={{ background: `linear-gradient(90deg, ${INK}, transparent)` }} />
          {whySky[stage] ? (
            <span key={stage} className="wn-rise pointer-events-none absolute inset-x-0 top-[17%] hidden text-center font-heading text-[clamp(52px,6.2vw,108px)] font-black uppercase leading-none tracking-[-0.05em] lg:block" style={{ color: "transparent", WebkitTextStroke: `1.5px ${stage === 2 ? "rgba(233,30,99,.45)" : "rgba(245,241,234,.16)"}` }}>{whySky[stage]}</span>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 lg:hidden" style={{ background: `linear-gradient(transparent, ${INK})` }} />
        </div>

        <div className="relative z-10 lg:order-1">
          {/* the opening */}
          <section data-stage={0} className="flex min-h-[54svh] flex-col justify-end px-5 pb-14 pt-10 sm:px-10 lg:min-h-svh lg:pb-24 lg:pl-[max(2.5rem,calc((100vw-1200px)/2))]">
            <span className="wn-rise font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: PINK }}>{whyHero.label}</span>
            <h1 className="wn-rise mt-4 font-heading text-[clamp(40px,6.4vw,92px)] font-black uppercase leading-[0.9] tracking-[-0.045em]" style={{ animationDelay: ".12s" }}>
              {whyHero.title} <span style={{ color: PINK }}>{whyHero.accent}</span>
            </h1>
            <p className="wn-rise mt-6 max-w-[34ch] text-[17px] leading-7 text-white/65 sm:text-[19px]" style={{ animationDelay: ".24s" }}>{whyHero.lead}</p>
            <span className="wn-rise mt-10 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-white/45" style={{ animationDelay: ".4s" }}>
              <MaterialSymbol className="wn-nudge text-[18px]" name="south" />Scroll — the story
            </span>
          </section>

          {whyChapters.map((c) => (
            <section key={c.stage} data-stage={c.stage} className="flex min-h-[78svh] flex-col justify-center px-5 py-16 sm:px-10 lg:min-h-svh lg:pl-[max(2.5rem,calc((100vw-1200px)/2))]">
              <div className={cn("grid max-w-[560px] gap-5 transition-all duration-700", at === c.stage ? "translate-y-0 opacity-100" : "translate-y-4 opacity-35")}>
                <span className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: PINK }}>
                  <span className="h-px w-8" style={{ background: PINK }} />{c.label}
                </span>
                <h2 className="font-heading text-[clamp(34px,4.6vw,64px)] font-black uppercase leading-[0.92] tracking-[-0.04em]">
                  {c.title} <span style={{ color: PINK }}>{c.accent}</span>
                </h2>
                {c.body.map((p) => <p key={p} className="text-[16.5px] leading-7 text-white/68 sm:text-[18px] sm:leading-8">{p}</p>)}
                {c.chips ? (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {c.chips.map((x, i) => (
                      <li key={x} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-500", at === c.stage ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0", c.stage === 2 ? "border-[#e91e63]/35 text-[#ff9fbf]" : "border-white/15 text-white/80")} style={{ transitionDelay: `${at === c.stage ? 150 + i * 60 : 0}ms` }}>{x}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* what we believe */}
      <section data-stage={6} className="relative z-10 border-t border-white/[0.07] px-5 py-24 sm:px-10" style={{ background: "#0b0f15" }}>
        <div className="mx-auto max-w-6xl">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: TEAL }}>What we believe</span>
          <h2 className="mt-4 max-w-[18ch] font-heading text-[clamp(34px,4.6vw,64px)] font-black uppercase leading-[0.92] tracking-[-0.04em]">Six lines we <span style={{ color: PINK }}>build by.</span></h2>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3">
            {whyBeliefs.map((b, i) => (
              <li key={b.title} className="group relative grid content-start gap-3 bg-[#0b0f15] p-7 transition-colors hover:bg-[#10151d] sm:p-8">
                <span className="font-heading text-[56px] font-black leading-none tracking-[-0.05em] text-white/[0.07] transition-colors group-hover:text-[#e91e63]/40">0{i + 1}</span>
                <b className="font-heading text-[22px] font-black uppercase leading-tight tracking-[-0.02em]">{b.title}</b>
                <p className="text-[15px] leading-7 text-white/60">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* much more to tell */}
      <section data-stage={7} className="relative z-10 px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="grid gap-5 lg:sticky lg:top-28">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: PINK }}>To be continued</span>
            <h2 className="font-heading text-[clamp(32px,4vw,56px)] font-black uppercase leading-[0.92] tracking-[-0.04em]">{moreToTell.title} <span style={{ color: PINK }}>{moreToTell.accent}</span></h2>
            <p className="max-w-[40ch] text-[17px] leading-7 text-white/60">{moreToTell.lead}</p>
            <p className="font-heading text-[26px] font-black uppercase tracking-[-0.02em]">See you <span style={{ color: TEAL }}>soon.</span></p>
          </div>
          <ul className="grid gap-3">
            {moreToTell.items.map((m, i) => {
              const inner = (
                <>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${[PINK, TEAL, "#a78bfa", "#f2b705"][i % 4]}1f`, color: [PINK, TEAL, "#a78bfa", "#f2b705"][i % 4] }}><MaterialSymbol className="text-[24px]" name={m.icon} /></span>
                  <span className="grid min-w-0 flex-1 gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/35">Chapter {String(i + 2).padStart(2, "0")}</span>
                      {m.ready ? null : <span className="rounded-full border border-white/15 px-2 py-px font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/55">Coming soon</span>}
                    </span>
                    <b className="font-heading text-[20px] font-black uppercase tracking-[-0.02em]">{m.title}</b>
                    <span className="text-[14.5px] leading-6 text-white/55">{m.body}</span>
                  </span>
                </>
              );
              const cls = "flex items-start gap-4 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 transition-colors sm:p-6";
              return <li key={m.title}>{m.ready && m.href ? <Link href={m.href} className={cn(cls, "hover:border-white/25")}>{inner}</Link> : <div className={cn(cls, "border-dashed")}>{inner}</div>}</li>;
            })}
          </ul>
        </div>
      </section>

      {/* cross with us */}
      <section className="relative z-10 overflow-hidden border-t border-white/[0.07] px-5 pb-10 pt-24 text-center sm:px-10">
        <div className="pointer-events-none absolute left-1/2 top-10 size-[520px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]" style={{ background: `radial-gradient(${PINK}, transparent 65%)` }} />
        <div className="relative mx-auto grid max-w-3xl justify-items-center gap-6">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">Node · bridging the gap</span>
          <h2 className="font-heading text-[clamp(40px,6vw,84px)] font-black uppercase leading-[0.9] tracking-[-0.045em]">Cross <span style={{ color: PINK }}>with us.</span></h2>
          <p className="max-w-[44ch] text-[17px] leading-7 text-white/60">Wherever you stand today — at the edge, halfway, or already across and looking for what’s next.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full px-7 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-pink-500/25 transition-transform hover:scale-[1.03]" style={{ background: PINK }}>Create your account</Link>
            <Link href="/programs" className="rounded-full border border-white/25 px-7 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] transition-colors hover:border-white">See the programs</Link>
          </div>
        </div>
        <footer className="relative mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-[13px] text-white/45">
          <span className="font-heading text-[18px] font-black text-white">Node.<small className="ml-2 font-sans text-[12px] font-semibold text-white/40">Bridging the gap</small></span>
          <span className="flex flex-wrap gap-5"><Link href="/" className="hover:text-white">Home</Link><Link href="/programs" className="hover:text-white">Programs</Link><Link href="/professor" className="hover:text-white">The Professor</Link><Link href="/login" className="hover:text-white">Sign in</Link></span>
        </footer>
      </section>
    </main>
  );
}

/* ---------------- the scene ---------------- */
const L = { x: 322, y: 378 }, R = { x: 678, y: 352 };
/* a point on the deck, t from the education side (0) to the market side (1); it sags a little in the middle */
const deck = (t: number) => ({ x: L.x + (R.x - L.x) * t, y: L.y + (R.y - L.y) * t + Math.sin(Math.PI * t) * 12 });
const TA = deck(0.08), TB = deck(0.92), TOP = 122, CY = 360;
const towerA = { x: TA.x, y: TA.y - TOP }, towerB = { x: TB.x, y: TB.y - TOP };
const cableAt = (x: number) => { const s = (x - towerA.x) / (towerB.x - towerA.x); return (1 - s) ** 2 * towerA.y + 2 * (1 - s) * s * CY + s ** 2 * towerB.y; };
const PLANKS = 18;
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 211) % 1000, y: (i * 97) % 300, r: i % 5 === 0 ? 1.6 : 0.9 }));
const CITY = [[716, 64], [748, 110], [786, 82], [822, 148], [862, 96], [896, 182], [936, 120], [968, 76]] as const;
const ROAD = [[744, 342], [796, 300], [842, 250], [888, 198], [930, 146], [968, 96]] as const;

function Scene({ stage }: { stage: number }) {
  const lit = stage >= 1, built = stage >= 3;
  /* the one we follow: at the edge, then across, then up the road */
  const at = stage <= 2 ? { x: 298, y: 377 } : stage === 3 ? deck(0.42) : stage === 4 ? deck(0.66) : { x: 744, y: 342 };
  return (
    <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="wn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={INK} /><stop offset="1" stopColor="#111827" /></linearGradient>
        <radialGradient id="wn-dawn" cx="85%" cy="52%" r="55%"><stop offset="0" stopColor={PINK} stopOpacity=".32" /><stop offset=".5" stopColor="#6d48d8" stopOpacity=".1" /><stop offset="1" stopColor={INK} stopOpacity="0" /></radialGradient>
        <radialGradient id="wn-pit" cx="50%" cy="100%" r="60%"><stop offset="0" stopColor={PINK} stopOpacity=".55" /><stop offset="1" stopColor={PINK} stopOpacity="0" /></radialGradient>
        <linearGradient id="wn-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2130" /><stop offset="1" stopColor="#0c1018" /></linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#wn-sky)" />
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={WHITE} opacity={0.18 + (i % 4) * 0.08} className={i % 3 ? undefined : "wn-twinkle"} style={{ animationDelay: `${(i % 7) * 0.6}s` }} />)}
      <rect width="1000" height="700" fill="url(#wn-dawn)" style={{ opacity: lit ? 1 : 0.25, transition: "opacity 1.6s" }} />

      {/* the pit, glowing when people fall */}
      <rect x="300" y="360" width="400" height="340" fill="url(#wn-pit)" style={{ opacity: stage === 2 ? 1 : stage >= 3 ? 0.25 : 0.1, transition: "opacity 1.2s" }} />

      {/* education: the near cliff, an institute on it */}
      <polygon points="0,700 0,380 60,372 140,378 220,370 300,376 330,380 318,430 326,500 312,580 322,700" fill="url(#wn-rock)" stroke="#2a3442" strokeWidth="2" />
      <g fill="none" stroke="#8b98a8" strokeWidth="2" strokeLinejoin="round" style={{ opacity: lit ? 0.9 : 0.4, transition: "opacity 1.2s" }}>
        <polyline points="88,336 158,304 228,336 88,336" />
        <line x1="96" y1="342" x2="220" y2="342" />
        {[108, 135, 162, 189, 212].map((x) => <line key={x} x1={x} y1="346" x2={x} y2="368" />)}
        <line x1="90" y1="371" x2="226" y2="371" />
      </g>
      <text x="158" y="430" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="5" fill="#8b98a8" fontFamily="ui-monospace, monospace" style={{ opacity: lit ? 1 : 0.35, transition: "opacity 1.2s" }}>EDUCATION</text>

      {/* the market: the far cliff, a city on it */}
      <polygon points="1000,700 1000,350 940,346 860,352 760,344 690,350 670,354 680,420 668,500 684,600 674,700" fill="url(#wn-rock)" stroke="#2a3442" strokeWidth="2" />
      <g style={{ opacity: stage >= 5 ? 0.35 : 1, transition: "opacity 1s" }}>
        {CITY.map(([x, h], i) => (
          <g key={x}>
            <rect x={x} y={348 - h} width="28" height={h} fill="#121826" stroke="#2a3442" strokeWidth="1.5" />
            {Array.from({ length: Math.floor(h / 18) }, (_, r) => [0, 1].map((cI) => (
              <rect key={`${r}-${cI}`} x={x + 6 + cI * 10} y={348 - h + 8 + r * 18} width="5" height="7" fill="#ffd98a" style={{ opacity: lit && (r + cI + i) % 3 !== 0 ? 0.75 : 0.06, transition: `opacity .6s ${0.3 + ((r * 3 + cI + i) % 9) * 0.12}s` }} />
            )))}
          </g>
        ))}
      </g>
      <text x="842" y="402" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="5" fill="#8b98a8" fontFamily="ui-monospace, monospace" style={{ opacity: lit ? 1 : 0.35, transition: "opacity 1.2s" }}>THE MARKET</text>

      {/* the gap: what people fall into, falling */}
      {stage === 2 ? (
        <g fontFamily="ui-monospace, monospace" fontWeight="700" fill="#ff9fbf">
          {whyChapters[1].chips!.map((w, i) => (
            <text key={w} x={448 + ((i * 41) % 110)} y={310} textAnchor="middle" fontSize="12.5" className="wn-fall" style={{ animationDelay: `${i * 0.55}s`, ["--r" as string]: `${(i % 2 ? 1 : -1) * (8 + i * 3)}deg` } as CSSProperties}>{w}</text>
          ))}
        </g>
      ) : null}
      <text x="500" y="560" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="6" fill={PINK} fontFamily="ui-monospace, monospace" style={{ opacity: stage === 2 ? 0.9 : 0, transition: "opacity .8s" }}>THE GAP</text>

      {/* the bridge */}
      <g>
        {/* towers and cables, drawn in */}
        <g fill="none" stroke={TEAL} strokeWidth="2.4" strokeLinecap="round">
          {[[TA, towerA], [TB, towerB]].map(([a, b], i) => <line key={i} x1={a.x} y1={a.y + 6} x2={b.x} y2={b.y} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: built ? 0 : 1, transition: `stroke-dashoffset .9s ${built ? 0.2 : 0}s` }} />)}
          <path d={`M${L.x - 34} ${L.y - 4} L${towerA.x} ${towerA.y} Q500 ${CY} ${towerB.x} ${towerB.y} L${R.x + 34} ${R.y - 4}`} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: built ? 0 : 1, transition: `stroke-dashoffset 1.6s ${built ? 0.9 : 0}s ease-in-out` }} />
        </g>
        <g stroke={TEAL} strokeOpacity=".55" strokeWidth="1.2">
          {Array.from({ length: 11 }, (_, i) => deck(0.16 + i * 0.068)).map((p, i) => <line key={i} x1={p.x} y1={p.y} x2={p.x} y2={cableAt(p.x)} style={{ opacity: built ? 1 : 0, transition: `opacity .4s ${built ? 1.6 + i * 0.05 : 0}s` }} />)}
        </g>
        {/* the deck, plank by plank */}
        {Array.from({ length: PLANKS }, (_, i) => {
          const t = (i + 0.5) / PLANKS, p = deck(t), q = deck(t + 0.01), a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${a})`}>
              <rect x="-9.4" y="-3" width="18.8" height="7" rx="1" fill={i % 5 === 2 ? PINK : "#e8e2d6"} style={{ opacity: built ? 1 : 0, transform: built ? "none" : "translateY(-26px)", transition: `opacity .35s ${built ? 0.15 + i * 0.07 : 0}s, transform .5s cubic-bezier(.2,.8,.3,1.3) ${built ? 0.15 + i * 0.07 : 0}s` }} />
            </g>
          );
        })}
        <text x={deck(0.5).x} y={deck(0.5).y + 34} textAnchor="middle" fontSize="16" fontWeight="900" letterSpacing="8" fill={PINK} fontFamily="ui-monospace, monospace" style={{ opacity: built ? 1 : 0, transition: `opacity .8s ${built ? 1.6 : 0}s` }}>NODE</text>
      </g>

      {/* what the bridge is made of */}
      <g fontFamily="ui-monospace, monospace" fontSize="11.5" fontWeight="700">
        {whyPlanks.map((w, i) => {
          const up = i < 3, k = i % 3, p = deck(0.2 + k * 0.3), y = up ? p.y - 150 + (k === 1 ? -34 : 0) : p.y + 64 + (k === 1 ? 34 : 0), wpx = w.length * 7.2 + 20;
          return (
            <g key={w} style={{ opacity: stage === 3 ? 1 : 0, transition: `opacity .5s ${stage === 3 ? 1.2 + i * 0.15 : 0}s` }}>
              <line x1={p.x} y1={up ? p.y - 6 : p.y + 6} x2={p.x} y2={up ? y + 8 : y - 14} stroke={WHITE} strokeOpacity=".25" strokeDasharray="2 3" />
              <rect x={p.x - wpx / 2} y={y - 14} width={wpx} height="22" rx="11" fill="#0b0f15" stroke={i % 3 === 1 ? TEAL : PINK} strokeOpacity=".7" />
              <text x={p.x} y={y + 1} textAnchor="middle" fill={WHITE}>{w}</text>
            </g>
          );
        })}
      </g>

      {/* any point: ladders up onto the bridge, people climbing on */}
      {whyEntries.map((e, i) => {
        const p = deck(0.24 + i * 0.25), on = stage === 4;
        return (
          <g key={e.who} style={{ opacity: on ? 1 : 0, transition: `opacity .6s ${on ? i * 0.25 : 0}s` }}>
            <g stroke={e.color} strokeOpacity=".7" strokeWidth="2">
              <line x1={p.x - 7} y1={p.y + 4} x2={p.x - 7} y2="700" /><line x1={p.x + 7} y1={p.y + 4} x2={p.x + 7} y2="700" />
              {Array.from({ length: 16 }, (_, r) => <line key={r} x1={p.x - 7} y1={p.y + 18 + r * 20} x2={p.x + 7} y2={p.y + 18 + r * 20} />)}
            </g>
            <g style={{ transform: on ? "translateY(0)" : "translateY(170px)", transition: `transform 2.2s cubic-bezier(.3,.7,.3,1) ${on ? 0.4 + i * 0.3 : 0}s` }}>
              <Walker x={p.x} y={p.y} color={e.color} />
            </g>
            <g transform={`translate(${p.x} ${p.y + 64 + i * 34})`}>
              <rect x={10} y={-12} width={e.who.length * 7.2 + 18} height="22" rx="11" fill="#0b0f15" stroke={e.color} />
              <text x={19} y={3} fontSize="11.5" fontWeight="700" fill={WHITE} fontFamily="ui-monospace, monospace">{e.who}</text>
            </g>
          </g>
        );
      })}

      {/* the partner: the road on, with Node alongside */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={ROAD.map(([x, y]) => `${x},${y}`).join(" ")} stroke={WHITE} strokeOpacity=".7" strokeWidth="2.4" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: stage >= 5 ? 0 : 1, transition: `stroke-dashoffset 2s ${stage >= 5 ? 0.8 : 0}s ease-in-out` }} />
        <polyline points={ROAD.map(([x, y]) => `${x + 12},${y + 9}`).join(" ")} stroke={TEAL} strokeWidth="2" strokeDasharray="4 6" style={{ opacity: stage >= 5 ? 1 : 0, transition: `opacity 1s ${stage >= 5 ? 1.6 : 0}s` }} />
      </g>
      {ROAD.slice(1).map(([x, y], i) => (
        <g key={i} style={{ opacity: stage >= 5 ? 1 : 0, transition: `opacity .5s ${stage >= 5 ? 1 + i * 0.3 : 0}s` }}>
          <rect x={x - 22 - whyMilestones[i].length * 7.3} y={y - 11} width={whyMilestones[i].length * 7.3 + 14} height="21" rx="10.5" fill="#0b0f15" stroke={WHITE} strokeOpacity=".18" />
          <circle cx={x} cy={y} r="5.5" fill={INK} stroke={i === whyMilestones.length - 1 ? PINK : WHITE} strokeWidth="2" />
          <text x={x - 15} y={y + 4} textAnchor="end" fontSize="12" fontWeight="700" fill={WHITE} fontFamily="ui-monospace, monospace">{whyMilestones[i]}</text>
        </g>
      ))}
      <text x={ROAD[2][0] + 18} y={ROAD[2][1] + 44} fontSize="10.5" fontWeight="800" letterSpacing="2" fill={TEAL} fontFamily="ui-monospace, monospace" style={{ opacity: stage >= 5 ? 1 : 0, transition: `opacity .8s ${stage >= 5 ? 2.2 : 0}s` }}>NODE, ALONGSIDE</text>

      {/* the one we follow */}
      <g style={{ transform: `translate(${at.x}px, ${at.y}px)`, transition: "transform 2.6s cubic-bezier(.45,0,.3,1)" }}>
        <Walker x={0} y={0} color={WHITE} cap />
      </g>
    </svg>
  );
}

/* a figure in straight lines; feet at (x, y) */
function Walker({ x, y, color, cap }: { x: number; y: number; color: string; cap?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none">
      <circle cx="0" cy="-31" r="5.5" fill={INK} />
      <polyline points="0,-25 0,-11" />
      <polyline points="-6,0 0,-11 6,0" />
      <polyline points="-6,-15 0,-22 6,-16" />
      {cap ? <g fill={color} stroke="none"><polygon points="-8,-37 0,-41 8,-37 0,-33" /><line x1="7" y1="-37" x2="8" y2="-31" stroke={color} strokeWidth="1.2" /></g> : null}
    </g>
  );
}
