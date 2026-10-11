"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagship } from "@/lib/node-landing-data";
import { actModel, howSteps, masterclasses, programPath } from "@/lib/platform-data";

import { CASHBACK, FEE, FREE_AT, pkr, REWARD, useReferrals } from "./referral-panel";

/* The welcome a new member sees on their first sign-in, before the profile questions — played like a short film:
 * a cold open, then seven scenes (who we are and why we're building Node, how they'll learn, their program, what's
 * coming next, the Professor, and a few honest words about starting with us this early). Each scene fills the
 * screen: the picture as a lit set with a slow camera push, the title rising word by word, a light wipe between
 * scenes, letterbox, grain. It plays itself (story bars up top) and holds while you read — hover the words, or
 * pause; arrows / Enter / Back / Next move through it. The last scene hands over to the questions. */
const PINK = "#e91e63", TEAL = "#4fd1c5", VIOLET = "#6d48d8", RED = "#e3051b";

type Seg = [string, string?]; // words, and their colour
type Slide = { id: string; kicker: string; color: string; title: Seg[]; body: ReactNode; art: ReactNode };
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")";

/* how long a scene plays, in seconds: long enough to read it */
const SECONDS: Record<string, number> = { hello: 9, why: 14, how: 14, program: 12, refer: 14, next: 12, professor: 13, start: 14 };
const lengthOf = (s: Slide) => SECONDS[s.id] ?? 11;

export function WelcomeTour({ first, questions, onDone, onSkipAll, skipLabel = "Skip for now" }: { first: string; questions: number; onDone: () => void; onSkipAll?: () => void; skipLabel?: string }) {
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [at, setAt] = useState(still ? 0 : -1); // -1: the cold open
  const [paused, setPaused] = useState(still);
  const [hold, setHold] = useState(false);
  const slides = buildSlides(first, questions);
  const last = at === slides.length - 1;
  const s = slides[Math.max(0, at)];
  const go = (n: number) => setAt(Math.max(0, Math.min(slides.length - 1, n)));
  const playing = !paused && !hold;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (at === -1) { if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "Escape") { e.preventDefault(); setAt(0); } return; }
      const onControl = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
      if (e.key === "ArrowRight" || (e.key === "Enter" && !onControl)) { e.preventDefault(); if (last) onDone(); else go(at + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
      else if (e.key === " " && !onControl) { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key === "Escape") { e.preventDefault(); onDone(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* straight onto the page: the first-run screen animates (a transform), which would box in anything fixed inside it */
  return createPortal(
    <div className="fixed inset-0 z-[175] overflow-hidden bg-[#06070b] text-white" role="region" aria-label="Welcome to Node — the introduction">
      {/* the grade: a glow in the scene's colour, a vignette, grain */}
      <span className="pointer-events-none absolute -left-[20%] -top-[30%] size-[80vmax] rounded-full opacity-25 blur-[140px] transition-[background-color] duration-[1500ms]" style={{ backgroundColor: at === -1 ? "#000" : s.color }} />
      <span className="pointer-events-none absolute -bottom-[40%] -right-[20%] size-[70vmax] rounded-full bg-[#6d48d8] opacity-[.14] blur-[140px]" />

      {at === -1 ? <ColdOpen onEnd={() => setAt(0)} /> : (
        <div key={s.id} className="absolute inset-0">
          {/* the light that wipes the new scene in */}
          <span className="wt-edge pointer-events-none absolute inset-y-0 z-20 w-[22vw]" style={{ background: `linear-gradient(90deg, transparent, ${s.color}55 45%, #ffffffcc 50%, ${s.color}55 55%, transparent)` }} aria-hidden />
          <div className="wt-wipe grid h-full grid-rows-[40svh_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:grid-rows-1">
            {/* the set */}
            <div className="relative order-1 overflow-hidden lg:order-2" aria-hidden>
              <div className="wt-push absolute inset-0 p-[6svh] pt-[9svh] lg:p-[8vh]" style={{ animationDuration: `${lengthOf(s) + 4}s` }}>{s.art}</div>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06070b] lg:hidden" />
            </div>
            {/* the words — reading them holds the scene */}
            <div className="relative order-2 overflow-y-auto px-6 pb-36 pt-2 [scrollbar-width:none] lg:order-1 lg:flex lg:flex-col lg:pb-[calc(3.5vh+104px)] lg:pl-[max(48px,7vw)] lg:pr-6 lg:pt-[calc(3.5vh+104px)]" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
              <div className="grid max-w-[560px] content-start gap-4 lg:my-auto [@media(min-height:820px)]:gap-5">
                <span className="wt-in flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.26em]" style={{ color: s.color }}>
                  <span className="text-white/35">Scene {String(at + 1).padStart(2, "0")}</span><span className="h-px w-8" style={{ background: s.color }} />{s.kicker}
                </span>
                <Title segs={s.title} />
                <div className="wt-in grid gap-4 text-[15.5px] leading-7 text-white/72" style={{ animationDelay: ".7s" }}>{s.body}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* grain and vignette over everything */}
      <span className="pointer-events-none absolute inset-0 opacity-[.07] mix-blend-screen" style={{ backgroundImage: GRAIN }} />
      <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55))" }} />
      {/* letterbox */}
      <span className="wt-bars pointer-events-none absolute inset-x-0 top-0 h-[3.5vh] bg-black" />
      <span className="wt-bars pointer-events-none absolute inset-x-0 bottom-0 h-[3.5vh] bg-black" />

      {/* top: the mark, the story bars, pause, and the ways out */}
      <header className="pointer-events-none absolute inset-x-0 top-[3.5vh] z-30 grid gap-3 px-5 pt-3 sm:px-8 [&_button]:pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="font-heading text-[18px] font-black tracking-[-0.03em]">Node<span className="text-[var(--electric-pink)]">.</span></span>
          <span className="ml-auto flex items-center gap-1">
            {at >= 0 && !still ? <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"} className="flex size-9 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white"><MaterialSymbol className="text-[20px]" name={paused ? "play_arrow" : "pause"} /></button> : null}
            <button type="button" onClick={onDone} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white">Skip intro</button>
            {onSkipAll ? <button type="button" onClick={onSkipAll} aria-label={skipLabel} title={skipLabel} className="flex size-9 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"><MaterialSymbol className="text-[19px]" name="close" /></button> : null}
          </span>
        </div>
        {at >= 0 ? (
          <div className="flex gap-1.5" aria-hidden>
            {slides.map((x, k) => (
              <button key={x.id} type="button" tabIndex={-1} onClick={() => go(k)} className="group h-3 flex-1 py-1">
                <span className="block h-[3px] overflow-hidden rounded-full bg-white/18 group-hover:bg-white/30">
                  {k < at ? <span className="block h-full w-full bg-white/85" /> : k === at ? (
                    <span key={`${x.id}-${at}`} className="wt-bar block h-full" onAnimationEnd={() => { if (!last) go(at + 1); }}
                      style={{ background: s.color, animationDuration: `${lengthOf(x)}s`, animationPlayState: playing ? "running" : "paused", ...(still ? { width: "100%", animation: "none" } : {}) } as CSSProperties} />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* bottom: back, where we are, next */}
      {at >= 0 ? (
        <nav className="pointer-events-none absolute inset-x-0 bottom-[3.5vh] z-30 flex [&_button]:pointer-events-auto items-center justify-between gap-3 bg-gradient-to-t from-[#06070b] via-[#06070b]/80 to-transparent px-5 pb-4 pt-10 sm:px-8" aria-label="Welcome tour">
          <button type="button" onClick={() => go(at - 1)} disabled={at === 0} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:invisible"><MaterialSymbol className="text-[18px]" name="arrow_back" />Back</button>
          <span className="hidden font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/40 sm:block">{String(at + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}{hold && !paused ? " · holding while you read" : paused && !still ? " · paused" : ""}</span>
          {last ? (
            <button type="button" onClick={onDone} className="wt-glow relative flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-[14px] font-black text-white" style={{ background: PINK }}>Set up my profile<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
          ) : (
            <button type="button" onClick={() => go(at + 1)} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-black text-[#0d1117] transition-transform hover:-translate-y-px">{at === 0 ? "Show me around" : "Next"}<MaterialSymbol className="text-[18px]" name="arrow_forward" /></button>
          )}
        </nav>
      ) : null}
    </div>,
    document.body,
  );
}

/* the title, word by word, each rising into focus (no clipping mask — Chromium can leave a masked word unpainted) */
function Title({ segs }: { segs: Seg[] }) {
  let n = 0;
  return (
    <h1 className="font-heading text-[clamp(30px,min(4.8vw,7.2vh),64px)] font-black uppercase leading-[0.92] tracking-[-0.045em]">
      {segs.map(([text, color], si) => text.split(" ").filter(Boolean).map((w, wi) => (
        <Fragment key={`${si}-${wi}`}>
          <span className="inline-block">
            <span className="wt-word inline-block" style={{ color, animationDelay: `${0.25 + n++ * 0.075}s` }}>{w}</span>
          </span>{" "}
        </Fragment>
      )))}
    </h1>
  );
}

/* the cold open: black, two lines, the mark lit — then the film */
function ColdOpen({ onEnd }: { onEnd: () => void }) {
  return (
    <button type="button" onClick={onEnd} className="absolute inset-0 grid cursor-default place-items-center px-6 text-center" aria-label="Skip the opening">
      <span className="grid justify-items-center gap-6">
        <span className="font-heading text-[clamp(26px,4.4vw,56px)] font-black uppercase leading-[0.95] tracking-[-0.04em]">
          <span className="wt-cold block" style={{ animationDelay: ".4s" }}>Every career begins</span>
          <span className="wt-cold block text-[#e91e63]" style={{ animationDelay: "1.5s" }}>at the edge of a gap.</span>
        </span>
        <span className="wt-mark relative flex items-center gap-3 overflow-hidden rounded-full px-1" style={{ animationDelay: "3s" }} onAnimationEnd={(e) => { if (e.animationName === "wt-mark") window.setTimeout(onEnd, 900); }}>
          <span className="flex size-12 items-center justify-center rounded-[16px] bg-white text-[#0d1117]"><MaterialSymbol className="text-[26px]" name="dataset" /></span>
          <span className="font-heading text-[34px] font-black tracking-[-0.04em]">Node<span className="text-[#e91e63]">.</span></span>
          <span className="wt-sweep pointer-events-none absolute inset-y-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)", animationDelay: "3.5s" }} />
        </span>
        <span className="wt-cold font-mono text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/35" style={{ animationDelay: "3.6s" }}>This is where you cross</span>
      </span>
    </button>
  );
}

function buildSlides(first: string, questions: number): Slide[] {
  const live = programPath.find((p) => p.live);
  const next = programPath.filter((p) => !p.live);
  return [
    {
      id: "hello", kicker: "Welcome", color: PINK,
      title: first ? [["Welcome to Node,"], [`${first}.`, PINK]] : [["Welcome to Node."]],
      body: (
        <>
          <p className="flex w-fit items-center gap-2 rounded-full border border-[#f2b705]/40 bg-[#f2b705]/10 px-3 py-1 text-[12.5px] font-bold text-[#f2b705]"><MaterialSymbol className="text-[16px]" name="auto_awesome" />You’re one of the first</p>
          <p>Node is just getting started — and so are you. You’re joining at the very beginning, as part of the first people we build this with.</p>
          <p>Before a few quick questions, here’s a two-minute look at what Node is, why we built it, and what’s on its way.</p>
        </>
      ),
      art: <HelloArt />,
    },
    {
      id: "why", kicker: "Why Node", color: PINK,
      title: [["Every career begins"], ["at the edge of a gap.", PINK]],
      body: (
        <>
          <p>You pass out of your institute with the foundations — then step into a market that speaks a different language. Between the two, people fall: theory without practice, no real project to show, tools that changed, no one to ask.</p>
          <p><b className="text-white">Node is the bridge across.</b> Aggressive, hands-on training on real work — entered at any point in your career, and a partner for all of it.</p>
          <Link href="/why" target="_blank" className="flex w-fit items-center gap-1.5 text-[13.5px] font-bold text-white underline-offset-4 hover:underline" style={{ color: TEAL }}>Read our philosophy<MaterialSymbol className="text-[16px]" name="open_in_new" /></Link>
        </>
      ),
      art: <BridgeArt />,
    },
    {
      id: "how", kicker: "How you’ll learn", color: TEAL,
      title: [["Learn it. Do it."], ["Prove it.", TEAL]],
      body: (
        <ul className="grid gap-3">
          {howSteps.map((h, k) => (
            <li key={h.title} className="wt-in flex items-start gap-3" style={{ animationDelay: `${0.2 + k * 0.08}s` }}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-[#4fd1c5]"><MaterialSymbol className="text-[19px]" name={h.icon} /></span>
              <span className="grid gap-0.5"><b className="text-[14.5px] text-white">{h.title}</b><span className="text-[13.5px] leading-6 text-white/60">{h.body}</span></span>
            </li>
          ))}
        </ul>
      ),
      art: <ActsArt />,
    },
    {
      id: "program", kicker: "Your program", color: PINK,
      title: [[flagship.name], ["→ 30 days.", PINK]],
      body: (
        <>
          <p>{live?.tagline ?? "Thirty days, one real project of yours, from the first question to production."}</p>
          <ul className="flex flex-wrap gap-2">
            {[["calendar_month", "30 days"], ["hub", "8 acts"], ["rocket_launch", "1 real project — yours"], ["smart_toy", "Agents as your team"], ["workspace_premium", "A certificate"]].map(([ic, t]) => (
              <li key={t} className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[12.5px] font-semibold text-white/80"><MaterialSymbol className="text-[16px] text-[#ff5c93]" name={ic} />{t}</li>
            ))}
          </ul>
          <p className="text-[14px] text-white/55">A day at a time: read, watch it done, do it on your project, and hand it in for review. Your mentor and the board are there when you’re stuck.</p>
        </>
      ),
      art: <ProgramArt />,
    },
    {
      id: "refer", kicker: "Refer & save", color: TEAL,
      title: [["Bring friends,"], ["pay less.", TEAL]],
      body: (
        <>
          <p>Learning is better with friends — so we made it pay. Every friend who joins with your link brings your fee down.</p>
          <ul className="grid gap-2">
            {[
              ["savings", TEAL, `${pkr(REWARD)} off for every friend`, "Straight off your fee, each time one joins."],
              ["celebration", "#f2b705", `${FREE_AT} friends and it’s free`, `Your ${pkr(FEE)} fee drops to zero — and your program unlocks.`],
              ["payments", PINK, "Already paid? Cash back", `${pkr(CASHBACK)} per friend after you’ve paid — up to ${pkr(CASHBACK * FREE_AT)}.`],
            ].map(([ic, c, t, b], k) => (
              <li key={t} className="wt-in flex items-center gap-3" style={{ animationDelay: `${0.9 + k * 0.1}s` }}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c}22`, color: c }}><MaterialSymbol className="text-[19px]" name={ic} /></span>
                <span className="grid leading-tight"><b className="text-[14.5px] text-white">{t}</b><span className="text-[13px] text-white/60">{b}</span></span>
              </li>
            ))}
          </ul>
          <ReferShare />
          <p className="-mt-1 text-[11.5px] text-white/40">Your link is always in <b className="text-white/65">Refer & save</b> on your dashboard.</p>
        </>
      ),
      art: <ReferArt />,
    },
    {
      id: "next", kicker: "What’s coming next", color: VIOLET,
      title: [["One path."], ["Every stage.", "#a78bfa"]],
      body: (
        <>
          <p>{flagship.name} is the first step on a longer road. These are on their way — from a first look at computer science to a specialisation:</p>
          <ul className="grid gap-2">
            {next.map((p, k) => (
              <li key={p.id} className="wt-in flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2" style={{ "--c": p.color, animationDelay: `${0.2 + k * 0.07}s` } as CSSProperties}>
                <MaterialSymbol className="text-[19px] text-[var(--c)]" name={p.icon} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-white">{p.title}</span>
                <span className="shrink-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/45">{p.length}</span>
                <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--c)]" style={{ background: `color-mix(in srgb, ${p.color} 16%, transparent)` }}>{p.status === "building" ? "In the making" : "Soon"}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 px-3 text-[13px] text-white/50"><MaterialSymbol className="text-[18px] text-[#f2b705]" name={masterclasses.icon} />Plus {masterclasses.title} — one-day classes on single skills.</li>
          </ul>
        </>
      ),
      art: <PathArt />,
    },
    {
      id: "professor", kicker: "Coming soon", color: RED,
      title: [["Meet"], ["the Professor.", RED]],
      body: (
        <>
          <p>Node’s own advisor — an agent that has read your program, your project and every rubric your work is graded on.</p>
          <ul className="grid gap-2">
            {[["lightbulb", "He advises", "Options, trade-offs, and the one he’d pick — the call stays yours."], ["school", "He teaches", "The why behind each step, at the moment you need it."], ["checklist", "He instructs", "Checks your draft against the rubric before your reviewer sees it."]].map(([ic, t, b]) => (
              <li key={t} className="flex items-start gap-3"><MaterialSymbol className="mt-0.5 text-[19px] text-[#ff5a66]" name={ic} /><span><b className="text-white">{t}.</b> <span className="text-white/60">{b}</span></span></li>
            ))}
          </ul>
          <Link href="/professor" target="_blank" className="flex w-fit items-center gap-1.5 text-[13.5px] font-bold underline-offset-4 hover:underline" style={{ color: "#ff5a66" }}>See the teaser<MaterialSymbol className="text-[16px]" name="open_in_new" /></Link>
        </>
      ),
      art: <ProfessorArt />,
    },
    {
      id: "start", kicker: "Before we start", color: TEAL,
      title: [["We’re building this"], ["with you.", TEAL]],
      body: (
        <ul className="grid gap-3">
          {[
            ["construction", "#f2b705", "It’s early days", "Node is under active development. You may hit a bug or a rough edge — when you do, tell us on the Board. Every report makes it better."],
            ["forum", TEAL, "You’re never on your own", "Ask on the Board any time; live sessions are on your Calendar, and your mentor reviews your work."],
            ["tune", PINK, "Your answers shape it", `Next, ${questions} quick questions — about three minutes — so your mentor, your pace and your sessions fit you.`],
          ].map(([ic, c, t, b], k) => (
            <li key={t} className="wt-in flex items-start gap-3" style={{ animationDelay: `${0.2 + k * 0.08}s` }}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${c}22`, color: c }}><MaterialSymbol className="text-[19px]" name={ic} /></span>
              <span className="grid gap-0.5"><b className="text-[14.5px] text-white">{t}</b><span className="text-[13.5px] leading-6 text-white/60">{b}</span></span>
            </li>
          ))}
        </ul>
      ),
      art: <StartArt />,
    },
  ];
}

/* their own link, ready to send: copy it, or straight to WhatsApp (a friend counts once their fee is confirmed) */
function ReferShare() {
  const { data } = useReferrals();
  const [copied, setCopied] = useState(false);
  const code = data?.code ?? "";
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/register?ref=${code}` : "";
  const message = `I'm joining Node's 30-day program, Copy, Paste, Go — building apps end to end with AI agents. Join with my link: ${link}`;
  return (
    <div className="wt-in grid gap-1.5 rounded-2xl border border-white/12 bg-white/[0.04] p-2.5 pl-3.5" style={{ animationDelay: "1.3s" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid min-w-0 flex-1 basis-[210px] leading-tight">
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/45">Your invite link{code ? <> · <b className="text-[#4fd1c5]">{code}</b></> : null}</span>
          <span className="truncate font-mono text-[12.5px] text-white/80">{link || "Getting your link…"}</span>
        </span>
        <button type="button" disabled={!link} onClick={() => void navigator.clipboard.writeText(link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); })} className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#0d1117] disabled:opacity-40">
          <MaterialSymbol className="text-[16px]" name={copied ? "check" : "content_copy"} />{copied ? "Copied" : "Copy"}
        </button>
        {link ? <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl bg-[#25d366] px-3 py-1.5 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[16px]" name="chat" />WhatsApp</a> : null}
      </div>
    </div>
  );
}

/* ---------------- the pictures ---------------- */
const Card = ({ children, glow }: { children: ReactNode; glow: string }) => (
  <div className="relative isolate grid h-full w-full place-items-center">
    <span className="absolute -z-10 size-[62%] rounded-full opacity-45 blur-[90px]" style={{ background: glow }} />
    <div className="grid h-full max-h-[640px] w-full max-w-[860px] place-items-center [&>div]:xl:scale-[1.3]">{children}</div>
  </div>
);

function HelloArt() {
  return (
    <Card glow={PINK}>
      <svg viewBox="0 0 400 300" className="h-full w-full">
        {[0, 1, 2].map((k) => <circle key={k} cx="200" cy="150" r={70 + k * 34} fill="none" stroke={[PINK, TEAL, VIOLET][k]} strokeOpacity=".35" strokeDasharray="3 9" className="wt-spin" style={{ animationDuration: `${18 + k * 8}s`, animationDirection: k % 2 ? "reverse" : "normal" }} />)}
        {[[PINK, 0], [TEAL, 120], [VIOLET, 240]].map(([c, a], k) => <g key={k} className="wt-spin" style={{ animationDuration: `${12 + k * 5}s` }}><circle cx={200 + Math.cos(((a as number) * Math.PI) / 180) * (104 + k * 17)} cy={150 + Math.sin(((a as number) * Math.PI) / 180) * (104 + k * 17)} r="6" fill={c as string} /></g>)}
        <rect x="160" y="110" width="80" height="80" rx="24" fill="#fff" className="wt-pop" />
        <g fill="#0d1117" className="wt-pop" style={{ animationDelay: ".15s" }}>{[0, 1].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={182 + c * 20} y={132 + r * 20} width="16" height="16" rx="3" />))}</g>
      </svg>
    </Card>
  );
}

function BridgeArt() {
  const deck = (t: number) => ({ x: 120 + 160 * t, y: 180 + Math.sin(Math.PI * t) * 8 });
  return (
    <Card glow={PINK}>
      <svg viewBox="0 0 400 300" className="h-full w-full">
        <polygon points="0,300 0,182 70,178 120,182 112,230 118,300" fill="#1a2130" stroke="#2a3442" strokeWidth="2" />
        <polygon points="400,300 400,178 330,176 280,180 288,230 282,300" fill="#1a2130" stroke="#2a3442" strokeWidth="2" />
        <rect x="120" y="190" width="160" height="110" fill={PINK} opacity=".12" />
        <text x="58" y="210" textAnchor="middle" fontSize="10" letterSpacing="3" fill="#8b98a8" fontFamily="ui-monospace, monospace">EDUCATION</text>
        <text x="342" y="208" textAnchor="middle" fontSize="10" letterSpacing="3" fill="#8b98a8" fontFamily="ui-monospace, monospace">THE MARKET</text>
        <path d="M120 180 L140 120 Q200 168 260 120 L280 180" fill="none" stroke={TEAL} strokeWidth="2.2" pathLength={1} className="wt-draw" />
        {Array.from({ length: 12 }, (_, k) => { const p = deck((k + 0.5) / 12); return <rect key={k} x={p.x - 6} y={p.y - 3} width="12" height="6" rx="1" fill={k === 5 ? PINK : "#e8e2d6"} className="wt-drop" style={{ animationDelay: `${0.5 + k * 0.07}s` }} />; })}
        <text x="200" y="210" textAnchor="middle" fontSize="12" fontWeight="900" letterSpacing="6" fill={PINK} fontFamily="ui-monospace, monospace" className="wt-pop" style={{ animationDelay: "1.4s" }}>NODE</text>
        <g className="wt-walk" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"><circle cx="0" cy="-26" r="4.5" fill="#0b0e14" /><polyline points="0,-21 0,-9" /><polyline points="-5,0 0,-9 5,0" /><polyline points="-5,-13 0,-18 5,-13" /></g>
      </svg>
    </Card>
  );
}

function ActsArt() {
  return (
    <Card glow={TEAL}>
      <svg viewBox="0 0 400 300" className="h-full w-full">
        <circle cx="200" cy="150" r="96" fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="18" />
        <circle cx="200" cy="150" r="96" fill="none" stroke={TEAL} strokeWidth="3" pathLength={1} className="wt-draw" transform="rotate(-90 200 150)" />
        {actModel.map((a, k) => {
          const ang = (k / actModel.length) * Math.PI * 2 - Math.PI / 2, x = 200 + Math.cos(ang) * 96, y = 150 + Math.sin(ang) * 96;
          return (
            <g key={a.id} className="wt-pop" style={{ animationDelay: `${0.3 + k * 0.1}s` }}>
              <circle cx={x} cy={y} r="15" fill="#0b0e14" stroke={k < 3 ? VIOLET : k < 6 ? "#008080" : "#c49000"} strokeWidth="2" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="ui-monospace, monospace">{a.n}</text>
              <text x={200 + Math.cos(ang) * 132} y={150 + Math.sin(ang) * 132 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff" fillOpacity=".6" fontFamily="ui-monospace, monospace">{a.name}</text>
            </g>
          );
        })}
        <text x="200" y="146" textAnchor="middle" fontSize="13" fontWeight="900" letterSpacing="2" fill="#fff" fontFamily="ui-monospace, monospace">THE NODE</text>
        <text x="200" y="163" textAnchor="middle" fontSize="9.5" letterSpacing="2" fill={TEAL} fontFamily="ui-monospace, monospace">8 ACTS</text>
      </svg>
    </Card>
  );
}

/* five friends join, one by one — the fee falls a step each time, until it's free */
function ReferArt() {
  const steps = Array.from({ length: FREE_AT + 1 }, (_, k) => Math.max(0, FEE - REWARD * k));
  return (
    <Card glow={TEAL}>
      <div className="grid w-[94%] justify-items-center gap-3 sm:gap-5 lg:w-[72%]">
        <div className="flex items-center gap-1.5 xl:gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#0d1117] shadow-[0_0_0_4px_rgba(79,209,197,.35)] xl:size-12"><MaterialSymbol className="text-[20px] xl:text-[24px]" name="person" /></span>
          <span className="h-px w-2 bg-white/25 xl:w-4" />
          {Array.from({ length: FREE_AT }, (_, k) => (
            <span key={k} className="wt-pop flex size-8 items-center justify-center rounded-full bg-[#4fd1c5] text-[#0d1117] xl:size-10" style={{ animationDelay: `${0.6 + k * 0.55}s` }}><MaterialSymbol className="text-[19px]" name="person_add" /></span>
          ))}
        </div>
        <div className="relative grid h-[72px] w-full place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]/80 sm:h-[92px]">
          {steps.map((v, k) => (
            <span key={k} className="wt-tick absolute inset-0 grid place-items-center" style={{ animationDelay: `${0.35 + k * 0.55}s`, ["--last" as string]: k === steps.length - 1 ? "1" : "0" } as CSSProperties}>
              <span className="grid justify-items-center gap-0.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{k ? `${k} friend${k === 1 ? "" : "s"} joined` : "Your fee"}</span>
                <b className="font-heading text-[30px] font-black leading-none tracking-[-0.04em] sm:text-[40px]" style={{ color: v ? "#fff" : "#4fd1c5" }}>{v ? pkr(v) : "FREE"}</b>
              </span>
            </span>
          ))}
        </div>
        <span className="wt-pop rounded-full px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#0d1117]" style={{ background: "#f2b705", animationDelay: "3.6s" }}>Program unlocked</span>
      </div>
    </Card>
  );
}

function ProgramArt() {
  const weeks = ["Discover · Plan", "Design · Build", "Verify · Release", "Operate · Evolve"];
  return (
    <Card glow={PINK}>
      <div className="grid w-[82%] gap-2.5">
        {weeks.map((w, k) => (
          <div key={w} className="wt-in flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1117]/80 px-3.5 py-2.5" style={{ animationDelay: `${0.2 + k * 0.12}s` }}>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Week {k + 1}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="wt-grow block h-full rounded-full" style={{ background: [PINK, "#ff5c93", TEAL, VIOLET][k], animationDelay: `${0.5 + k * 0.2}s` }} /></span>
            <b className="w-[110px] text-right text-[12px] text-white/85">{w}</b>
          </div>
        ))}
        <div className="wt-pop mt-1 flex items-center justify-center gap-2 rounded-2xl py-2 text-[12.5px] font-black uppercase tracking-[0.08em] text-white" style={{ background: PINK, animationDelay: "1.3s" }}><MaterialSymbol className="text-[17px]" name="rocket_launch" />Day 30 · shipped</div>
      </div>
    </Card>
  );
}

function PathArt() {
  return (
    <Card glow={VIOLET}>
      <svg viewBox="0 0 400 300" className="h-full w-full">
        <path d="M40 250 C 120 250, 110 170, 190 170 S 270 90, 360 70" fill="none" stroke="#ffffff" strokeOpacity=".25" strokeWidth="2.5" strokeDasharray="5 7" />
        <path d="M40 250 C 120 250, 110 170, 190 170 S 270 90, 360 70" fill="none" stroke="#a78bfa" strokeWidth="3" pathLength={1} className="wt-draw" />
        {programPath.map((p, k) => {
          const pts = [[40, 250], [118, 214], [190, 170], [272, 118], [360, 70]];
          const [x, y] = pts[k] ?? pts[pts.length - 1];
          return (
            <g key={p.id} className="wt-pop" style={{ animationDelay: `${0.3 + k * 0.15}s` }}>
              <circle cx={x} cy={y} r={p.live ? 12 : 9} fill={p.live ? p.color : "#0b0e14"} stroke={p.color} strokeWidth="2.5" />
              {p.live ? <circle cx={x} cy={y} r="18" fill="none" stroke={p.color} strokeOpacity=".5" className="wt-ping" /> : null}
              <text x={x} y={y - 20} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fillOpacity={p.live ? 1 : 0.65} fontFamily="ui-monospace, monospace">{p.length}</text>
            </g>
          );
        })}
        {(() => { const pts = [[40, 250], [118, 214], [190, 170], [272, 118], [360, 70]]; const [x, y] = pts[Math.max(0, programPath.findIndex((p) => p.live))] ?? pts[0]; return <text x={x} y={y + 32} textAnchor="middle" fontSize="9.5" letterSpacing="2" fill={PINK} fontFamily="ui-monospace, monospace">YOU ARE HERE</text>; })()}
      </svg>
    </Card>
  );
}

function ProfessorArt() {
  return (
    <Card glow={RED}>
      <svg viewBox="0 0 400 300" className="h-full w-full">
        {/* his bust, in straight lines: suit and tie, neck, head, hair, glasses, beard */}
        <g transform="translate(36 22)" strokeLinejoin="round">
          <polygon points="18,300 30,240 70,214 104,206 160,206 194,214 234,240 246,300" fill="#08090c" stroke="#2a2f3a" strokeWidth="1.5" />
          <polygon points="104,206 132,252 160,206 150,200 114,200" fill="#e8e2d6" />
          <polygon points="126,214 138,214 142,262 132,282 122,262" fill="#9e0a14" />
          <polyline points="104,206 92,240 132,282 172,240 160,206" fill="none" stroke="#1d212a" strokeWidth="3" />
          <polygon points="112,174 152,174 154,206 132,216 110,206" fill="#060404" />
          <polygon points="98,96 108,70 132,60 156,70 166,96 168,124 164,150 154,170 132,180 110,170 100,150 96,124" fill="#060404" stroke={RED} strokeOpacity=".75" strokeWidth="2" />
          <polyline points="98,96 108,70 132,60 156,70 166,96" fill="none" stroke="#ffd98a" strokeOpacity=".55" strokeWidth="2" />
          <polyline points="104,84 122,74 144,74 160,86" fill="none" stroke="#d8c3a0" strokeOpacity=".3" strokeWidth="1.2" />
          <polygon points="100,136 164,136 160,156 150,172 132,180 114,172 104,156" fill="#0d0a09" stroke="#d8c3a0" strokeOpacity=".35" strokeWidth="1" />
          <polyline points="118,142 132,138 146,142" fill="none" stroke="#d8c3a0" strokeOpacity=".5" strokeWidth="1.6" />
          <rect x="104" y="110" width="24" height="15" fill="#ffd98a" fillOpacity=".12" stroke="#f2e6cf" strokeWidth="2" />
          <rect x="136" y="110" width="24" height="15" fill="#ffd98a" fillOpacity=".12" stroke="#f2e6cf" strokeWidth="2" />
          <line x1="128" y1="116" x2="136" y2="116" stroke="#f2e6cf" strokeWidth="2" />
          <line x1="96" y1="114" x2="104" y2="114" stroke="#f2e6cf" strokeWidth="1.6" /><line x1="160" y1="114" x2="168" y2="114" stroke="#f2e6cf" strokeWidth="1.6" />
        </g>
        <g className="wt-pop" style={{ animationDelay: ".5s" }}>
          <rect x="196" y="58" width="180" height="56" rx="16" fill="#0b0b0c" stroke={RED} strokeOpacity=".6" />
          <polygon points="214,112 226,112 206,128" fill="#0b0b0c" stroke={RED} strokeOpacity=".6" />
          <text x="212" y="80" fontSize="8.5" fontWeight="800" letterSpacing="2.5" fill={RED} fontFamily="ui-monospace, monospace">THE PROFESSOR</text>
          <text x="212" y="100" fontSize="12" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">I’m coming to connect you.</text>
        </g>
      </svg>
    </Card>
  );
}

function StartArt() {
  return (
    <Card glow={TEAL}>
      <div className="grid w-[78%] gap-3">
        {[["construction", "#f2b705", "In development"], ["forum", TEAL, "The Board"], ["calendar_month", PINK, "Live sessions"], ["person", "#a78bfa", "Your profile — next"]].map(([ic, c, t], k) => (
          <div key={t} className="wt-in flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1117]/80 px-4 py-3" style={{ animationDelay: `${0.15 + k * 0.12}s` }}>
            <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: `${c}22`, color: c }}><MaterialSymbol className="text-[19px]" name={ic} /></span>
            <b className="text-[13.5px] text-white/90">{t}</b>
            {k === 3 ? <MaterialSymbol className="wt-nudge ml-auto text-[19px] text-white/60" name="arrow_forward" /> : <MaterialSymbol className="ml-auto text-[18px] text-[#4fd1c5]" name="check_circle" filled />}
          </div>
        ))}
      </div>
    </Card>
  );
}
