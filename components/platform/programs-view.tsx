import Link from "next/link";
import type { CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagship } from "@/lib/node-landing-data";
import { FlagshipPrice } from "@/components/providers/pricing-provider";
import { flagshipHref, masterclasses, programIncludes, programPath } from "@/lib/platform-data";
import { cn } from "@/lib/utils";

import s from "./cinema.module.css";
import { ProgramCinema } from "./program-cinema";
import { DARK, LOOK, pad, STATUS_LABEL } from "./program-posters";
import { PosterBand } from "./poster-band";

/* The Programs page. The slider introduces each program; below it, only what helps you decide — kept short. */

const PAPER = "#f6f4ef", PINK = LOOK["copy-paste-go"].bg;
const d = (sec: number) => ({ "--d": `${sec}s` }) as CSSProperties;

/* every program, in path order, with the masterclasses at the end */
const PATH = [
  ...programPath.map((p) => ({ id: p.id, title: p.title, length: p.length, who: p.who, status: p.status, live: !!p.live })),
  { id: masterclasses.id, title: masterclasses.title, length: masterclasses.length, who: "Anyone", status: masterclasses.status, live: false },
];
const titleOf = (id: string) => PATH.find((p) => p.id === id)?.title ?? id;

const CHOOSER: { q: string; to: string }[] = [
  { q: "I’m new and unsure.", to: "hello-world" },
  { q: "I want to build an app now.", to: "copy-paste-go" },
  { q: "I’m building a team.", to: "dots" },
  { q: "I want to be job-ready.", to: "the-node" },
  { q: "I want to specialise.", to: "nano-degree" },
  { q: "I want one skill, fast.", to: masterclasses.id },
];
const FAQS = [
  { q: "Do I need experience?", a: "No. Copy, Paste, Go starts from zero." },
  { q: "Is there a certificate?", a: "Yes — the Node certificate when you finish the capstone." },
  { q: "When do the others open?", a: "Soon. Sign up and you’ll hear first." },
  { q: "Can I pay less?", a: "Yes — each friend who joins with your link takes PKR 1,000 off. Five make it free." },
];

/* a section heading, as on the slides: a mono kicker and the title rising from its mask */
function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className={s.sectionHead}>
      <div className="grid gap-4">
        <span className={cn(s.top, s.fade)} style={d(0.1)}>{kicker}</span>
        <h2 className={s.title} aria-label={title}>{title.split(" ").map((w, i) => <span key={i} className={s.mask} aria-hidden><span className={s.word} style={{ "--i": i } as CSSProperties}>{w}</span></span>)}</h2>
      </div>
    </div>
  );
}

export function ProgramsView() {
  return (
    <main className="min-h-screen" style={{ background: DARK }}>
      <ProgramCinema />

      {/* where to start */}
      <PosterBand id="start" bg={DARK} ink="#ffffff" label="Where to start">
        <SectionHead kicker="Which one?" title="Start where you are." />
        <div className={cn(s.rows, s.fade)} style={d(0.5)}>
          {CHOOSER.map((c) => (
            <a key={c.to} href={`#${c.to}`} className={s.rowLink} style={{ "--c": LOOK[c.to].bg } as CSSProperties}>
              <span className={s.rowDot} />
              <span className={s.rowQ}>{c.q}</span>
              <span className={s.rowTo}>{titleOf(c.to)}</span>
              <MaterialSymbol className={cn(s.rowArrow, "text-[22px]")} name="arrow_forward" />
            </a>
          ))}
        </div>
      </PosterBand>

      {/* the live program */}
      <PosterBand id="copy-paste-go" bg={PAPER} ink={DARK} label={flagship.name}>
        <div className={s.copy}>
          <span className={cn(s.top, s.fade)} style={d(0.1)}><span className={cn(s.status, s.statusLive)}>{STATUS_LABEL.live}</span></span>
          <h2 className={s.title} style={{ fontSize: "clamp(2.2rem, 4vw, 3.8rem)", whiteSpace: "nowrap" }} aria-label={flagship.name}>
            {["Copy,", "Paste,", "Go."].map((w, i) => <span key={i} className={s.mask} aria-hidden><span className={s.word} style={{ "--i": i, color: i === 2 ? PINK : undefined } as CSSProperties}>{w}</span></span>)}
          </h2>
          <div className={cn(s.stats, s.fade)} style={d(0.5)}>
            {[["30", "days"], ["8", "acts"], ["1", "real app"]].map(([n, l]) => <span key={l} className={s.stat}><b>{n}</b><span>{l}</span></span>)}
          </div>
        </div>
        <div className={cn(s.priceBlock, s.fade)} style={d(0.6)}>
          <span className={s.priceBig}><FlagshipPrice part="price" /></span>
          <span className="flex items-center gap-3"><span className={s.pill}><FlagshipPrice part="off" /></span><span className={s.priceWas}><FlagshipPrice part="was" /></span></span>
          <span className={s.ctas}>
            <Link href="/register" className={cn(s.btn, s.btnSolid)}>Enroll<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link>
            <Link href={flagshipHref} className={cn(s.btn, s.btnLine)}>Curriculum</Link>
          </span>
        </div>
        <div className={cn(s.includes, s.fade)} style={{ ...d(0.75), "--accent": PINK } as CSSProperties}>
          {programIncludes.map((x, i) => <div key={x} className={s.include}><span className={s.includeN}>{pad(i + 1)}</span><span className={s.includeT}>{x}</span></div>)}
        </div>
      </PosterBand>

      {/* the path */}
      <PosterBand id="compare" bg="#ffffff" ink={DARK} label="The path">
        <SectionHead kicker="The path" title="Side by side." />
        <div className={cn(s.rail, s.fade)} style={d(0.5)}>
          <div className={s.railGrid} style={{ "--n": PATH.length } as CSSProperties} role="table" aria-label="Programs compared">
            <div className={s.railRow} role="row">
              <div className={cn(s.railCell, s.railLabel, s.railHead)} role="columnheader" />
              {PATH.map((p, i) => (
                <div key={p.id} id={p.live || p.id === masterclasses.id ? undefined : p.id} className={cn(s.railCell, s.railHead)} role="columnheader" style={{ "--c": LOOK[p.id].bg, "--d": `${0.6 + i * 0.1}s`, scrollMarginTop: 140 } as CSSProperties}>
                  <span className={s.railBar} />
                  <span className={s.railName}>{p.title}</span>
                </div>
              ))}
            </div>
            {([
              ["Length", (p: (typeof PATH)[number]) => <span className="font-mono text-[13px] font-bold">{p.length}</span>],
              ["For", (p: (typeof PATH)[number]) => p.who],
              ["Status", (p: (typeof PATH)[number]) => (p.live
                ? <Link href="/register" className={cn("inline-block rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em]", s.railLive)} style={{ "--c": LOOK[p.id].bg } as CSSProperties}>Enroll →</Link>
                : <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] opacity-55">{STATUS_LABEL[p.status]}</span>)],
            ] as const).map(([label, cell]) => (
              <div key={label} className={s.railRow} role="row">
                <div className={cn(s.railCell, s.railLabel)} role="rowheader">{label}</div>
                {PATH.map((p) => <div key={p.id} className={s.railCell} role="cell">{cell(p)}</div>)}
              </div>
            ))}
          </div>
        </div>
      </PosterBand>

      {/* masterclasses */}
      <PosterBand id={masterclasses.id} bg={LOOK[masterclasses.id].bg} ink={DARK} label={masterclasses.title}>
        <SectionHead kicker={`${masterclasses.length} · ${STATUS_LABEL[masterclasses.status]}`} title={`${masterclasses.title}.`} />
        <div className={cn(s.classList, s.fade)} style={d(0.5)}>
          {masterclasses.classes.map((c) => (
            <div key={c.title} className={s.classRow}>
              <span className={s.classHours}>{c.hours}<small>HRS</small></span>
              <span className={s.className}>{c.title}</span>
            </div>
          ))}
          <div className={s.classMore}>
            <span className={s.className}>+ More soon.</span>
            <Link href={`/register?interest=${masterclasses.id}`} className={cn(s.btn, s.btnSolid)}>Hear first<MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link>
          </div>
        </div>
      </PosterBand>

      {/* questions */}
      <PosterBand id="questions" bg={PAPER} ink={DARK} label="Questions">
        <SectionHead kicker="Questions" title="Good to know." />
        <div className={cn(s.faq, s.fade)} style={d(0.5)}>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}<MaterialSymbol className={s.faqIcon} name="add" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </PosterBand>

      {/* the close */}
      <PosterBand id="enroll" bg={DARK} ink="#ffffff" label="Enroll">
        <div className={s.closing}>
          <span className={cn(s.top, s.fade)} style={d(0.1)}>Start today</span>
          <h2 className={s.title} aria-label="Build a real app in 30 days.">{"Build a real app in 30 days.".split(" ").map((w, i) => <span key={i} className={s.mask} aria-hidden><span className={s.word} style={{ "--i": i } as CSSProperties}>{w}</span></span>)}</h2>
          <Link href="/register" className={cn(s.btn, s.btnSolid, s.fade)} style={d(0.6)}>Enroll · <FlagshipPrice part="price" /><MaterialSymbol className="text-[18px]" name="arrow_forward" /></Link>
          <div className={cn(s.stripe, s.fade)} style={d(0.8)} aria-hidden>{PATH.map((p) => <span key={p.id} style={{ "--c": LOOK[p.id].bg } as CSSProperties} />)}</div>
        </div>
      </PosterBand>
    </main>
  );
}
