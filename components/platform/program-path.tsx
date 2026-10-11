import Link from "next/link";
import type { CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { masterclasses, moreToCome, programPath } from "@/lib/platform-data";

import p from "./program-path.module.css";

/* The programs as one path, shortest first: the live one to start now, the rest coming next — then more to come */
export function ProgramPath({ tone = "light", hideLive = false }: { tone?: "light" | "dark"; hideLive?: boolean }) {
  const steps = hideLive ? programPath.filter((x) => !x.live) : programPath;
  return (
    <div className={`${p.root} ${tone === "dark" ? p.dark : ""}`}>
      <ol className={p.path} style={{ "--n": steps.length } as CSSProperties}>
        {steps.map((x, i) => {
          const body = (
            <>
              <span className={p.top}>
                <span className={p.icon}><MaterialSymbol name={x.icon} /></span>
                <span className={p.len}>{x.length}</span>
              </span>
              <b className={p.name}>{x.title}</b>
              <span className={p.who}>{x.who}</span>
              <span className={p.tag}>{x.tagline}</span>
              <span className={p.out}><MaterialSymbol name="flag" className={p.ms} />{x.outcome}</span>
              {x.status === "live" ? <span className={p.live}>● Live now · explore<MaterialSymbol name="arrow_forward" className={p.ms} /></span>
                : x.status === "building" ? <span className={p.building}><i className={p.pulse} />In the making</span>
                : <span className={p.soon}>Coming soon</span>}
            </>
          );
          return (
            <li key={x.id} className={`${p.step} ${x.live ? p.stepLive : ""}`} style={{ "--c": x.color, "--i": i } as CSSProperties}>
              <span className={p.dot} aria-hidden />
              {x.live && x.href ? <Link href={x.href} className={p.card}>{body}</Link> : <div className={p.card}>{body}</div>}
            </li>
          );
        })}
      </ol>
      <div className={p.extras}>
        {/* masterclasses: a day each, many of them */}
        <div className={`${p.more} ${p.day}`} style={{ "--c": masterclasses.color } as CSSProperties}>
          <span className={p.dayIcon}><MaterialSymbol name={masterclasses.icon} /></span>
          <span className={p.moreText}><b>{masterclasses.title}</b><em>{masterclasses.kind} · {masterclasses.length}</em> {masterclasses.line}</span>
          <span className={p.ideas}>{masterclasses.classes.map((c) => <span key={c.title}>{c.title} · {c.hours}h</span>)}<span className={p.plus}>+ many more</span></span>
        </div>
        <div className={p.more}>
          <span className={p.moreIcon}><MaterialSymbol name="auto_awesome" /></span>
          <span className={p.moreText}><b>{moreToCome.title}</b> {moreToCome.body}</span>
          <span className={p.ideas}>{moreToCome.ideas.map((i) => <span key={i}>{i}</span>)}</span>
          <Link href="/register" className={p.moreCta}>Hear first<MaterialSymbol name="arrow_forward" className={p.ms} /></Link>
        </div>
      </div>
    </div>
  );
}
