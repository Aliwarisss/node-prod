import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagship, heroHeadline, roadmapWeeks } from "@/lib/node-landing-data";
import { bridge, careerStages, catalog, flagshipHref, experts, footer, howSteps, statusLabel, type CatalogItem } from "@/lib/platform-data";
import { loadPricingView } from "@/lib/pricing-store";

import { ActsLine } from "./acts-line";
import { HeroWithFx } from "./hero-fx";
import { PricingSection } from "./pricing-section";
import { ProgramPath } from "./program-path";
import { ScrollFx } from "./scroll-fx";
import { SiteHeader } from "./site-header";
import s from "./platform.module.css";

const v = (o: Record<string, string | number>) => o as CSSProperties;

/* One screen. On desktop the page is a deck of these; ScrollFx glides between them. */
function Block({ id, tone, children }: { id: string; tone: "dark" | "light" | "soft"; children: ReactNode }) {
  return (
    <section id={id} className={`${s.snap} ${s[tone]}`}>
      <div className={s.wrap} data-fit>{children}</div>
    </section>
  );
}
function Head({ label, title, lead, center }: { label: string; title: ReactNode; lead?: ReactNode; center?: boolean }) {
  return (
    <div className={`${s.head} ${center ? s.headC : ""}`}>
      <span className={`${s.lbl} ${s.rv}`}>{label}</span>
      <h2 className={`${s.h2} ${s.rv}`} style={v({ "--i": 1 })}>{title}</h2>
      {lead ? <p className={`${s.lead} ${s.rv}`} style={v({ "--i": 2 })}>{lead}</p> : null}
    </div>
  );
}

const KINDS: { kind: CatalogItem["kind"]; title: string; color: string }[] = [
  { kind: "program", title: "Programs", color: "#e91e63" },
  { kind: "model", title: "Models", color: "#4fd1c5" },
  { kind: "toolkit", title: "Toolkits", color: "#a78bfa" },
];
const external = (href: string) => !href.startsWith("/") && !href.startsWith("#");

export async function PlatformLanding() {
  const { config, now, flagship: plan } = await loadPricingView();
  return (
    <main className={s.page}>
      <SiteHeader />
      <ScrollFx />

      {/* the original hero frame */}
      <HeroWithFx />

      {/* what Node is: the bridge between education and the market */}
      <Block id="about" tone="dark">
        <Head center label="What is Node" title={<>Bridging the gap.<br /><span className={s.pink}>In computer science.</span></>} lead="Node is a training platform between education and the market — to start your career, grow it, and keep flowing with the market as it changes." />
        <div className={`${s.bridge} ${s.rv}`} style={v({ "--i": 3 })}>
          <div className={s.shore}>
            <span className={s.shoreTitle}>Education</span>
            <ul>{bridge.education.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className={s.span}>
            <div className={s.spanLine}><i /><b>Node</b><i /></div>
            <ul className={s.spanItems}>{bridge.node.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className={`${s.shore} ${s.shoreR}`}>
            <span className={s.shoreTitle}>The market</span>
            <ul>{bridge.market.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
        <div className={`${s.ctaRow} ${s.rv}`} style={v({ "--i": 4 })}>
          <Link className={`${s.btn} ${s.btnLine}`} href="/why">Why we’re building Node<MaterialSymbol name="arrow_forward" className={s.ms} /></Link>
        </div>
      </Block>

      {/* who it's for: three stages of a career */}
      <Block id="who" tone="light">
        <Head center label="Who it’s for" title={<>Wherever you are. <span className={s.pink}>Whatever’s next.</span></>} lead="From your first line of code to your next career move." />
        <div className={s.stages}>
          {careerStages.map((c, i) => (
            <div key={c.id} className={`${s.stage} ${s.rv}`} style={v({ "--c": c.color, "--i": 3 + i })}>
              <MaterialSymbol name={c.icon} className={s.stageIcon} />
              <span className={s.stageWho}>{c.who}</span>
              <b className={s.stageVerb}>{c.verb}</b>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </Block>

      {/* everything on the platform */}
      <Block id="catalog" tone="dark">
        <div className={s.split}>
          <Head label="One platform" title={<>Many paths.<br /><span className={s.pink}>One way of working.</span></>} lead="Programs for every stage, plus the models and toolkits behind them. One program is live now — more are on the way." />
          <div className={s.cols}>
            {KINDS.map((k, ki) => (
              <div key={k.kind} className={s.rv} style={v({ "--c": k.color, "--i": 2 + ki })}>
                <h3 className={s.colTitle}>{k.title}</h3>
                <ul className={s.list}>
                  {catalog.filter((c) => c.kind === k.kind).map((c) => {
                    const label = <><span className={s.itemName}>{c.title}</span><span className={`${s.itemSt} ${s[`st_${c.status}`]}`}>{c.status === "included" ? "Included" : statusLabel[c.status]}</span></>;
                    return (
                      <li key={c.id}>
                        {c.href ? <a href={c.href} className={s.item} {...(external(c.href) ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a> : <span className={s.item}>{label}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Block>

      {/* introducing the flagship program — the full story lives on its own page */}
      <Block id="program" tone="soft">
        <div className={s.split}>
          <div>
            <Head label="Introducing our flagship program" title={<>Copy, Paste, <span className={s.pink}>Go.</span></>} lead={`${flagship.kind[0].toUpperCase()}${flagship.kind.slice(1)}. ${heroHeadline.title} ${heroHeadline.sub}`} />
            <ul className={`${s.facts} ${s.rv}`} style={v({ "--i": 3 })}>
              <li><b>30</b><span>days</span></li>
              <li><b>1</b><span>real project of yours</span></li>
              <li><b>8</b><span>acts, idea to production</span></li>
            </ul>
            <div className={`${s.ctaRowL} ${s.rv}`} style={v({ "--i": 4 })}>
              <Link className={`${s.btn} ${s.btnPink}`} href={flagshipHref}>Explore now<MaterialSymbol name="arrow_forward" className={s.ms} /></Link>
              <span className={s.priceNote}>{plan.price}{plan.was ? <> <s style={{ opacity: 0.55 }}>{plan.was}</s></> : null}{plan.off ? ` · ${plan.off}` : ""}{plan.suffix ? ` · ${plan.suffix}` : ""}</span>
            </div>
          </div>
          <Link href={flagshipHref} className={`${s.teaser} ${s.rv}`} style={v({ "--i": 3 })} aria-label={`Explore ${flagship.name}`}>
            <span className={s.teaserTag}>● Live now</span>
            {roadmapWeeks.map((w) => (
              <div key={w.week} className={s.teaserWeek}>
                <small>{w.week}</small>
                <b>{w.title}</b>
                <span>{w.acts.map((a) => a.name).join(" · ")}</span>
              </div>
            ))}
            <span className={s.teaserMore}>See the whole month<MaterialSymbol name="arrow_forward" className={s.ms} /></span>
          </Link>
        </div>
      </Block>

      {/* the programs as one path — what's live, and what's coming next */}
      <Block id="next" tone="light">
        <Head center label="Coming next" title={<>One path. <span className={s.pink}>Five programs.</span></>} lead="From a fifteen-day first look to a six-month specialisation. Start with Copy, Paste, Go today — the rest are on the way." />
        <div className={s.rv} style={v({ "--i": 3 })}><ProgramPath /></div>
      </Block>

      {/* the method behind every program */}
      <Block id="model" tone="dark">
        <Head center label="The method · the NODE model" title={<>How software is really built. <span className={s.pink}>Eight acts.</span></>} lead="Every Node program teaches the same lifecycle the industry runs on — so what you learn carries into the job." />
        <div className={s.rv} style={v({ "--i": 3 })}><ActsLine /></div>
      </Block>

      {/* how it works */}
      <Block id="how" tone="light">
        <Head label="How it works" title={<>Learn it. Do it. <span className={s.pink}>Prove it.</span></>} />
        <ol className={s.steps}>
          {howSteps.map((h, i) => (
            <li key={h.title} className={s.rv} style={v({ "--i": 2 + i })}>
              <span className={s.stepN}>0{i + 1}</span>
              <b>{h.title}</b>
              <p>{h.body}</p>
            </li>
          ))}
        </ol>
      </Block>

      {/* learn from experts who ship */}
      <Block id="experts" tone="dark">
        <Head center label="Experts" title={<>Learn from experts <span className={s.pink}>who ship.</span></>} lead="Your agents do the heavy lifting. Experts make sure you learn the judgement — the part the market pays for." />
        <div className={s.experts}>
          {experts.map((x, i) => (
            <div key={x.title} className={`${s.expert} ${s.rv}`} style={v({ "--c": x.color, "--i": 3 + i })}>
              <span className={s.expertIcon}><MaterialSymbol name={x.icon} /></span>
              <b>{x.title}</b>
              <p>{x.body}</p>
            </div>
          ))}
        </div>
      </Block>

      {/* pricing */}
      <Block id="pricing" tone="soft">
        <Head center label="Pricing" title={<>One price. <span className={s.pink}>Everything in.</span></>} lead="No subscriptions, no tiers to decode — pay once and the whole program is yours." />
        <div className={`${s.rv}`} style={v({ "--i": 2 })}><PricingSection config={config} now={now} /></div>
      </Block>

      {/* start + footer */}
      <section id="start" className={`${s.snap} ${s.dark} ${s.finale}`}>
        <div className={`${s.glow} ${s.glowP}`} /><div className={`${s.glow} ${s.glowT}`} />
        <div className={s.cta}>
          <span className={`${s.lbl} ${s.rv}`}>Node</span>
          <h2 className={`${s.h2} ${s.ctaH} ${s.rv}`} style={v({ "--i": 1 })}>Bridge the gap.<br /><span className={s.pink}>Start today.</span></h2>
          <div className={`${s.ctaRow} ${s.rv}`} style={v({ "--i": 2 })}>
            <Link className={`${s.btn} ${s.btnPink}`} href="/register">Create your account</Link>
            <Link className={`${s.btn} ${s.btnLine}`} href="/programs">See the programs</Link>
          </div>
        </div>
        <footer className={s.foot}>
          <div className={`${s.wrap} ${s.footRow}`}>
            <span className={s.footBrand}>Node.<small>Bridging the gap</small></span>
            {footer.columns.flatMap((c) => c.links).map((l) => (l.href.startsWith("/") ? <Link key={l.label} href={l.href}>{l.label}</Link> : <a key={l.label} href={l.href}>{l.label}</a>))}
            <span className={s.footCopy}>© {new Date().getFullYear()} Node</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
