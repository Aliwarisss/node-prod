import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { lessonCount, modules } from "@/lib/course-data";
import { flagship, heroHeadline } from "@/lib/node-landing-data";
import { FlagshipPrice } from "@/components/providers/pricing-provider";
import { programIncludes } from "@/lib/platform-data";

import { ProgramExplorer } from "./program-explorer";
import { ProgramPath } from "./program-path";
import { SiteHeader } from "./site-header";
import c from "./course.module.css";


/* Copy, Paste, Go — the 30-day program, as a course explorer: a course header with the enroll card, tabbed panels,
   then what comes after it */
export function ProgramPage() {
  return (
    <main className={c.page}>
      <SiteHeader />

      <header className={c.hero}>
        <div className={`${c.wrap} ${c.heroGrid}`}>
          <div className={c.heroInfo}>
            <nav className={c.crumbs} aria-label="Breadcrumb">
              <Link href="/">Node</Link><MaterialSymbol name="chevron_right" className={c.ms} />
              <Link href="/programs">Programs</Link><MaterialSymbol name="chevron_right" className={c.ms} />
              <span>{flagship.name}</span>
            </nav>
            <span className={c.badge}>● Flagship program · {flagship.kind} · live now</span>
            <h1 className={c.title}>Copy, Paste, <span>Go.</span></h1>
            <p className={c.sub}>{heroHeadline.title} {heroHeadline.sub}</p>
            <ul className={c.meta}>
              <li><MaterialSymbol name="calendar_month" className={c.ms} />30 days</li>
              <li><MaterialSymbol name="view_module" className={c.ms} />{modules.length} modules</li>
              <li><MaterialSymbol name="menu_book" className={c.ms} />{lessonCount} lessons</li>
              <li><MaterialSymbol name="construction" className={c.ms} />1 real project</li>
              <li><MaterialSymbol name="signal_cellular_alt_1_bar" className={c.ms} />No experience needed</li>
              <li><MaterialSymbol name="workspace_premium" className={c.ms} />Certificate</li>
            </ul>
          </div>

          <aside className={c.card}>
            <span className={c.cardLbl}>One price · everything included</span>
            <div className={c.price}><s style={{ fontSize: "0.45em", opacity: 0.5, marginRight: 8, verticalAlign: "middle" }}><FlagshipPrice part="was" /></s><FlagshipPrice part="price" /><small><FlagshipPrice part="suffix" /><FlagshipPrice part="off" before=" · " /></small></div>
            <Link href="/register" className={`${c.btn} ${c.btnPink}`}>Enroll now</Link>
            <a href="#curriculum" className={`${c.btn} ${c.btnLine}`}>Browse the curriculum</a>
            <h3 className={c.cardH}>This program includes</h3>
            <ul className={c.includes}>
              {programIncludes.map((x) => <li key={x}><MaterialSymbol name="check_circle" className={c.ms} />{x}</li>)}
            </ul>
          </aside>
        </div>
      </header>

      <ProgramExplorer />

      <section className={c.wrap} style={{ padding: "72px 0 80px" }} aria-labelledby="next-programs">
        <span className={c.kicker}>Coming next</span>
        <h2 id="next-programs" className={c.h2}>After Copy, Paste, Go</h2>
        <p style={{ maxWidth: 680, marginBottom: 8, opacity: 0.7 }}>One path, from a first look to a specialisation. These programs are on the way.</p>
        <ProgramPath hideLive />
      </section>

      <footer className={c.foot}>
        <div className={`${c.wrap} ${c.footIn}`}>
          <div>
            <b>Ready when you are.</b>
            <span>Day 0 starts when you enrol.</span>
          </div>
          <div className={c.footCta}>
            <Link href="/register" className={`${c.btn} ${c.btnPink}`}>Enroll · <FlagshipPrice part="price" /></Link>
            <Link href="/" className={`${c.btn} ${c.btnGhost}`}>Back to Node</Link>
          </div>
        </div>
        <div className={`${c.wrap} ${c.footBase}`}>© {new Date().getFullYear()} Node · Bridging the gap</div>
      </footer>
    </main>
  );
}
