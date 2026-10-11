"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { gsap, gsapDefaults, ensureGsapScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { defaultViewport, fadeIn, fadeUp, scaleIn, staggerContainer } from "@/lib/animation/motion";
import { partnerMarks, programFee, programLinks } from "@/lib/node-landing-data";

/* The original landing hero's blueprint frame (from landing-sections.tsx HeroSection) and its Enroll button —
 * without the headline block — with the original parallax, following whichever element scrolls. */
export function HeroWithFx() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      let cancelled = false;
      (async () => {
        const { ScrollTrigger } = await ensureGsapScrollTrigger();
        const root = ref.current;
        if (cancelled || !root || !ScrollTrigger) return;
        const deck = root.closest("main");
        const scroller = deck && getComputedStyle(deck).overflowY !== "visible" ? deck : undefined;
        gsap.defaults(gsapDefaults);
        const heroFrame = root.querySelector<HTMLElement>("[data-hero-frame]");
        if (heroFrame) {
          gsap.to(heroFrame, { yPercent: -10, ease: "none", scrollTrigger: { trigger: root, scroller, start: "top top", end: "bottom top", scrub: 1.1 } });
        }
        gsap.utils.toArray<HTMLElement>("[data-parallax='soft']", root).forEach((el) => {
          gsap.to(el, { y: -36, ease: "none", scrollTrigger: { trigger: root, scroller, start: "top top", end: "bottom top", scrub: 1.2 } });
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax='reverse']", root).forEach((el) => {
          gsap.to(el, { y: 28, ease: "none", scrollTrigger: { trigger: root, scroller, start: "top top", end: "bottom top", scrub: 1.2 } });
        });
        ScrollTrigger.refresh();
      })();
      return () => { cancelled = true; };
    },
    { scope: ref },
  );

  return (
    <header ref={ref} id="top" data-section="hero" className="node-link-pattern relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-white pb-16 pt-28">
      <div className="section-shell relative z-10 flex flex-col items-center text-center">
        <div data-parallax="soft" className="absolute left-1/4 top-20 size-4 rounded-sm bg-[color:color-mix(in_srgb,var(--bridge-teal)_20%,transparent)] animate-pulse" />
        <div data-parallax="reverse" className="absolute right-1/4 top-40 h-2 w-6 rounded-full bg-[color:color-mix(in_srgb,var(--electric-pink)_20%,transparent)]" />
        <div data-parallax="soft" className="absolute bottom-20 left-1/3 size-3 rotate-45 bg-[color:color-mix(in_srgb,var(--safety-orange)_20%,transparent)]" />

        <m.div data-hero-frame className="relative w-full max-w-4xl" initial="hidden" variants={fadeIn()} viewport={defaultViewport} whileInView="show">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-1/2 h-px w-full bg-black/10" />
            <div className="absolute left-0 top-1/4 h-px w-full bg-black/5" />
            <div className="absolute bottom-1/4 left-0 h-px w-full bg-black/5" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-black/10" />
            <div className="absolute left-1/4 top-0 h-full w-px bg-black/5" />
            <div className="absolute right-1/4 top-0 h-full w-px bg-black/5" />
            <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bridge-teal)] shadow-[0_0_10px_rgba(0,128,128,1)]" />
            <div className="absolute left-1/4 top-1/4 size-1 rounded-full bg-black/20" />
            <div className="absolute right-1/4 top-1/4 size-1 rounded-full bg-black/20" />
            <div className="absolute bottom-1/4 left-1/4 size-1 rounded-full bg-black/20" />
            <div className="absolute bottom-1/4 right-1/4 size-1 rounded-full bg-black/20" />
            <div className="absolute left-1/4 right-1/4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[var(--electric-pink)] to-transparent opacity-40" />
            <div className="absolute bottom-1/4 top-1/4 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-[var(--bridge-teal)] to-transparent opacity-40" />
            <div className="absolute left-1/4 top-4 font-mono text-[10px] uppercase tracking-widest text-black/40">CORE_ENGINE</div>
            <div className="absolute bottom-4 right-1/4 font-mono text-[10px] uppercase tracking-widest text-black/40">SYSTEM_v2.0</div>
          </div>

          <div className="relative flex flex-col items-center py-20">
            <m.div className="eyebrow mb-4 text-[var(--bridge-teal)]" variants={fadeUp(16)}>Architectural_Standard</m.div>
            <m.h1 className="font-heading text-[5rem] leading-none font-black uppercase tracking-[-0.05em] text-[var(--primary)] sm:text-[7rem] md:text-[11.25rem]" variants={scaleIn(0.94)}>
              NODE
            </m.h1>
          </div>

          <m.div className="mt-4 flex flex-wrap justify-center gap-8 opacity-40 sm:gap-12" variants={staggerContainer(0.08, 0.15)}>
            {partnerMarks.map((mark) => (
              <m.div key={mark.label} className="flex items-center gap-2 grayscale transition-all hover:grayscale-0" variants={fadeUp(14)}>
                <MaterialSymbol className="text-[18px]" name={mark.icon} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{mark.label}</span>
              </m.div>
            ))}
          </m.div>
        </m.div>

        <m.div className="mt-14 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6" initial="hidden" variants={fadeUp(18)} viewport={defaultViewport} whileInView="show">
          <Link
            href="/register"
            className="rounded-gem inline-flex h-auto items-center justify-center bg-[var(--electric-pink)] px-10 py-5 text-[15px] font-black uppercase tracking-wide text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-500/40"
          >
            Enroll · {programFee.amount}
          </Link>
          {programLinks.roadmap ? (
            <a className="group flex items-center gap-2 text-[15px] font-bold text-[var(--primary)] transition-colors hover:text-[var(--bridge-teal)]" href={programLinks.roadmap}>
              Roadmap
              <MaterialSymbol className="text-[20px] transition-transform group-hover:translate-x-1" name="arrow_forward" />
            </a>
          ) : null}
        </m.div>
      </div>
    </header>
  );
}
