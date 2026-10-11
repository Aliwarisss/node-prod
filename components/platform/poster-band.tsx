"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import s from "./cinema.module.css";

/* A full-width poster band: its colour field, and — the first time it scrolls into view — the same entrance as the
   slider (words rise, details fade up, the motif draws itself in). */
export function PosterBand({ id, bg, ink, label, children }: { id?: string; bg: string; ink: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "current">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* no IntersectionObserver (or reduced motion): just show it */
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { const t = setTimeout(() => setState("current"), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState("current"); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} aria-label={label} data-state={state} className={s.band} style={{ "--bg": bg, "--ink": ink } as CSSProperties}>
      <div className={s.bandInner}>{children}</div>
    </section>
  );
}
