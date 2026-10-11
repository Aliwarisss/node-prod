"use client";

import type { CSSProperties } from "react";

import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  defaultViewport,
  fadeIn,
  fadeUp,
  scaleIn,
  staggerContainer,
} from "@/lib/animation/motion";
import {
  audienceCards,
  audienceImage,
  footerColumns,
  heroHeadline,
  mentors,
  methodologySteps,
  partnerMarks,
  pricingPlans,
  programFee,
  problemCards,
  programLinks,
  roadmapWeeks,
  stats,
  whyNodeCompare,
  whyNodePoints,
} from "@/lib/node-landing-data";
import { cn } from "@/lib/utils";

import { MaterialSymbol } from "./material-symbol";
import { SectionIntro } from "./primitives";

export function HeroSection() {
  return (
    <header
      data-section="hero"
      className="node-link-pattern relative overflow-hidden bg-white pb-24 pt-40"
    >
      <div className="section-shell relative z-10 flex flex-col items-center text-center">
        <div
          data-parallax="soft"
          className="absolute left-1/4 top-20 size-4 rounded-sm bg-[color:color-mix(in_srgb,var(--bridge-teal)_20%,transparent)] animate-pulse"
        />
        <div
          data-parallax="reverse"
          className="absolute right-1/4 top-40 h-2 w-6 rounded-full bg-[color:color-mix(in_srgb,var(--electric-pink)_20%,transparent)]"
        />
        <div
          data-parallax="soft"
          className="absolute bottom-20 left-1/3 size-3 rotate-45 bg-[color:color-mix(in_srgb,var(--safety-orange)_20%,transparent)]"
        />

        <m.div
          data-hero-frame
          className="relative mb-16 w-full max-w-4xl"
          initial="hidden"
          variants={fadeIn()}
          viewport={defaultViewport}
          whileInView="show"
        >
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
            <div className="absolute left-1/4 top-4 font-mono text-[10px] uppercase tracking-widest text-black/40">
              CORE_ENGINE
            </div>
            <div className="absolute bottom-4 right-1/4 font-mono text-[10px] uppercase tracking-widest text-black/40">
              SYSTEM_v2.0
            </div>
          </div>

          <div className="relative flex flex-col items-center py-20">
            <m.div
              className="eyebrow mb-4 text-[var(--bridge-teal)]"
              variants={fadeUp(16)}
            >
              Architectural_Standard
            </m.div>
            <m.h1
              className="font-heading text-[5rem] leading-none font-black uppercase tracking-[-0.05em] text-[var(--primary)] sm:text-[7rem] md:text-[11.25rem]"
              variants={scaleIn(0.94)}
            >
              NODE
            </m.h1>
          </div>

          <m.div
            className="mt-4 flex flex-wrap justify-center gap-8 opacity-40 sm:gap-12"
            variants={staggerContainer(0.08, 0.15)}
          >
            {partnerMarks.map((mark) => (
              <m.div
                key={mark.label}
                className="flex items-center gap-2 grayscale transition-all hover:grayscale-0"
                variants={fadeUp(14)}
              >
                <MaterialSymbol className="text-[18px]" name={mark.icon} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  {mark.label}
                </span>
              </m.div>
            ))}
          </m.div>
        </m.div>

        <m.div
          className="max-w-4xl space-y-8"
          initial="hidden"
          variants={staggerContainer(0.12, 0.12)}
          viewport={defaultViewport}
          whileInView="show"
        >
          <m.h2
            className="section-title text-[3rem] leading-[0.98] md:text-[4.5rem]"
            variants={fadeUp(24)}
          >
            {heroHeadline.title}
          </m.h2>
          <m.p
            className="text-[18px] leading-8 text-[var(--on-surface-variant)] md:text-[20px]"
            variants={fadeUp(20)}
          >
            {heroHeadline.sub}
          </m.p>
          <m.ul className="grid gap-3 text-left sm:grid-cols-3" variants={fadeUp(18)}>
            {heroHeadline.lines.map((line) => (
              <li
                key={line.title}
                className="rounded-gem flex flex-col gap-2 bg-[var(--deep-indigo)] p-5 text-white"
              >
                <MaterialSymbol className="text-[24px] text-[var(--electric-pink)]" name={line.icon} />
                <span className="text-[16px] font-black">{line.title}</span>
                <span className="text-[14px] leading-6 text-white/70">{line.body}</span>
              </li>
            ))}
          </m.ul>
          <m.div
            className="flex flex-col items-center justify-center gap-5 pt-4 sm:flex-row sm:gap-6"
            variants={fadeUp(18)}
          >
            <Link
              href="/register"
              className="rounded-gem inline-flex h-auto items-center justify-center bg-[var(--electric-pink)] px-10 py-5 text-[15px] font-black uppercase tracking-wide text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-500/40"
            >
              Enroll · {programFee.amount}
            </Link>
            {programLinks.roadmap ? (
              <a
                className="group flex items-center gap-2 text-[15px] font-bold text-[var(--primary)] transition-colors hover:text-[var(--bridge-teal)]"
                href={programLinks.roadmap}
              >
                Roadmap
                <MaterialSymbol
                  className="text-[20px] transition-transform group-hover:translate-x-1"
                  name="arrow_forward"
                />
              </a>
            ) : null}
          </m.div>
        </m.div>
      </div>
    </header>
  );
}

export function StatsSection() {
  return (
    <section
      data-section="stats"
      className="border-y border-black/5 bg-[var(--soft-stone)] py-16"
    >
      <m.div
        className="section-shell"
        initial="hidden"
        variants={staggerContainer(0.08)}
        viewport={defaultViewport}
        whileInView="show"
      >
        <m.div className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-12">
          {stats.map((stat) => (
            <m.div key={stat.label} className="text-center md:text-left" variants={fadeUp(16)}>
              <div className="mb-1 text-[40px] leading-none font-black text-[var(--primary)]">
                {stat.value}
              </div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--bridge-teal)]">
                {stat.label}
              </div>
            </m.div>
          ))}
        </m.div>
      </m.div>
    </section>
  );
}

export function ProblemSection() {
  return (
    <section data-section="problem" className="bg-white py-[var(--block-padding)]">
      <div className="section-shell">
        <FadeIn>
          <SectionIntro
            body="Tutorial hell keeps you learning pieces without understanding how the entire ecosystem connects. We bridge that logic."
            eyebrow="Problem_Analysis.01"
            eyebrowClassName="text-[var(--electric-pink)]"
            title="Stuck in the Gap?"
          />
        </FadeIn>

        <m.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          variants={staggerContainer(0.1)}
          viewport={defaultViewport}
          whileInView="show"
        >
          {problemCards.map((card) => (
            <m.article
              key={card.title}
              className="rounded-gem border-2 border-[var(--soft-stone)] bg-white p-8 transition-all duration-500 hover:shadow-2xl"
              variants={fadeUp(20)}
              style={{
                borderColor: "var(--soft-stone)",
                boxShadow: "0 0 0 rgba(0,0,0,0)",
              }}
            >
              <div
                className="mb-8 flex size-14 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${card.accent} 10%, transparent)`,
                  color: card.accent,
                }}
              >
                <MaterialSymbol className="text-[32px]" name={card.icon} />
              </div>
              <h3 className="mb-4 text-[22px] font-black text-[var(--primary)]">
                {card.title}
              </h3>
              <p className="text-[15px] leading-7 text-[var(--on-surface-variant)]">
                {card.body}
              </p>
            </m.article>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export function WhyNodeSection() {
  return (
    <section data-section="why-node" id="why-node" className="border-t border-black/5 bg-white py-[var(--block-padding)]">
      <div className="section-shell">
        <FadeIn>
          <SectionIntro
            body="A project-based learning roadmap that teaches how software actually gets built today — end to end, with agents — on a real project of your own, with the kit to do it from day one."
            eyebrow="Why_Node"
            eyebrowClassName="text-[var(--bridge-teal)]"
            title={
              <>
                Why <span className="text-[var(--electric-pink)]">Node.</span>
              </>
            }
          />
        </FadeIn>

        <m.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          variants={staggerContainer(0.08)}
          viewport={defaultViewport}
          whileInView="show"
        >
          {whyNodePoints.map((point, index) => (
            <m.article
              key={point.title}
              className="rounded-gem group relative overflow-hidden bg-[var(--soft-stone)] p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              variants={fadeUp(20)}
            >
              <span className="absolute right-6 top-6 font-mono text-[12px] font-bold tracking-widest text-black/20">
                0{index + 1}
              </span>
              <div
                className="mb-8 flex size-14 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${point.accent} 10%, transparent)`,
                  color: point.accent,
                }}
              >
                <MaterialSymbol className="text-[30px]" name={point.icon} />
              </div>
              <h3 className="mb-3 text-[22px] font-black text-[var(--primary)]">{point.title}</h3>
              <p className="text-[15px] leading-7 text-[var(--on-surface-variant)]">{point.body}</p>
            </m.article>
          ))}
        </m.div>

        <FadeIn className="mt-16" delay={0.05}>
          <div className="rounded-gem overflow-hidden border border-black/5 bg-white shadow-sm">
            <div className="grid grid-cols-2 border-b border-black/5 font-mono text-[11px] font-bold uppercase tracking-widest">
              <div className="p-5 text-[var(--on-surface-variant)] sm:px-8">Typical course</div>
              <div className="bg-[var(--deep-indigo)] p-5 text-[var(--bridge-teal)] sm:px-8">Node</div>
            </div>
            {whyNodeCompare.map((row) => (
              <div key={row.node} className="grid grid-cols-2 border-b border-black/5 last:border-b-0">
                <div className="flex items-start gap-3 p-5 text-[14px] leading-6 text-[var(--on-surface-variant)] sm:px-8 sm:text-[15px]">
                  <MaterialSymbol className="mt-0.5 text-[18px] text-black/25" name="close" />
                  {row.typical}
                </div>
                <div className="flex items-start gap-3 bg-[var(--deep-indigo)] p-5 text-[14px] font-bold leading-6 text-white sm:px-8 sm:text-[15px]">
                  <MaterialSymbol className="mt-0.5 text-[18px] text-[var(--bridge-teal)]" name="check" />
                  {row.node}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function RoadmapSection() {
  return (
    <section data-section="roadmap" id="roadmap" className="bg-[var(--soft-stone)] py-[var(--block-padding)]">
      <div className="section-shell">
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <FadeIn>
            <SectionIntro
              align="left"
              body="A project-based learning roadmap: eight acts across four weeks, and you take one real project through all of them — discovery and delivery side by side, ending in a capstone. Act I is open to explore free; the rest unlock when you enroll."
              className="mb-0"
              eyebrow="Roadmap.30_Days"
              eyebrowClassName="text-[var(--electric-pink)]"
              title={
                <>
                  Thirty days. <br />
                  <span className="text-[var(--bridge-teal)]">Full outline.</span>
                </>
              }
            />
          </FadeIn>
          {programLinks.roadmap || programLinks.preview || programLinks.overview ? (
            <FadeIn className="flex flex-wrap gap-3" delay={0.1}>
              {programLinks.roadmap ? (
                <a
                  href={programLinks.roadmap}
                  className="rounded-gem inline-flex items-center gap-2 bg-[var(--electric-pink)] px-8 py-4 text-[14px] font-black uppercase tracking-wide text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  See the full roadmap
                  <MaterialSymbol className="text-[20px]" name="arrow_forward" />
                </a>
              ) : null}
              {programLinks.preview ? (
                <a
                  href={programLinks.preview}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--primary)] px-8 py-4 text-[14px] font-black uppercase tracking-wide text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                >
                  Try Act I free
                </a>
              ) : null}
              {programLinks.overview ? (
                <a
                  href={programLinks.overview}
                  className="inline-flex items-center gap-2 px-2 py-4 text-[14px] font-black uppercase tracking-wide text-[var(--bridge-teal)] transition-colors hover:text-[var(--primary)]"
                >
                  Read the overview
                  <MaterialSymbol className="text-[20px]" name="arrow_forward" />
                </a>
              ) : null}
            </FadeIn>
          ) : null}
        </div>

        <div className="relative">
          <div
            data-draw-line
            className="absolute left-0 right-0 top-[38px] hidden h-[3px] rounded-full bg-[linear-gradient(90deg,#6d48d8,var(--bridge-teal),#c49000,var(--electric-pink))] lg:block"
          />
          <m.div
            className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            variants={staggerContainer(0.1)}
            viewport={defaultViewport}
            whileInView="show"
          >
            {roadmapWeeks.map((week) => (
              <m.article key={week.week} variants={fadeUp(20)}>
                <div className="mb-6 flex items-center gap-3">
                  <span className="relative z-10 flex size-[76px] shrink-0 flex-col items-center justify-center rounded-full border-4 border-white bg-[var(--deep-indigo)] text-white shadow-xl">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/50">Week</span>
                    <span className="font-heading text-[26px] font-black leading-none">{week.week.split(" ")[1]}</span>
                  </span>
                  <h3 className="font-heading text-[19px] font-black uppercase leading-tight tracking-tight text-[var(--primary)]">
                    {week.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  {week.acts.map((act) => {
                    const href = act.href ?? (act.open ? programLinks.preview : programLinks.syllabus);
                    const Tag = href ? "a" : "div";
                    return (
                    <Tag
                      key={act.name}
                      href={href ?? undefined}
                      className={cn(
                        "rounded-gem flex items-center justify-between gap-3 border p-4 transition-all",
                        href && "hover:-translate-y-0.5 hover:shadow-lg",
                        act.open
                          ? "border-[color:color-mix(in_srgb,var(--bridge-teal)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--bridge-teal)_8%,white)]"
                          : "border-black/5 bg-[repeating-linear-gradient(135deg,#fff,#fff_10px,#fafafa_10px,#fafafa_20px)]",
                      )}
                    >
                      <div>
                        <div className="text-[16px] font-black uppercase tracking-tight text-[var(--primary)]">{act.name}</div>
                        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
                          {act.days}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                          act.open ? "bg-[var(--bridge-teal)] text-white" : "bg-[var(--deep-indigo)] text-white",
                        )}
                      >
                        <MaterialSymbol className="text-[14px]" name={act.open ? "lock_open" : "lock"} />
                        {act.open ? "Open" : "Enroll"}
                      </span>
                    </Tag>
                    );
                  })}
                </div>
              </m.article>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}

export function AudienceSection() {
  return (
    <section data-section="audience" className="bg-[var(--soft-stone)] py-[var(--block-padding)]">
      <div className="section-shell grid items-center gap-16 lg:grid-cols-[1fr_0.9fr] lg:gap-24">
        <m.div
          initial="hidden"
          variants={staggerContainer(0.12)}
          viewport={defaultViewport}
          whileInView="show"
        >
          <m.div variants={fadeUp(24)}>
            <SectionIntro
              align="left"
              className="mb-10"
              eyebrow="Target_Profiles.02"
              eyebrowClassName="text-[var(--bridge-teal)]"
              title={
                <>
                  Built for the <br />
                  <span className="text-[var(--electric-pink)]">Builders.</span>
                </>
              }
              titleClassName="text-[3.4rem] leading-[1.02] md:text-[4.5rem]"
            />
          </m.div>

          <m.div className="space-y-6" variants={staggerContainer(0.1, 0.08)}>
            {audienceCards.map((card) => (
              <m.article
                key={card.index}
                className="rounded-gem bg-white p-8 shadow-sm transition-transform hover:scale-[1.02]"
                variants={fadeUp(18)}
              >
                <div className="flex items-start gap-6">
                  <div
                    className="font-mono text-[24px] font-black"
                    style={{ color: card.accent }}
                  >
                    {card.index}
                  </div>
                  <div>
                    <h3 className="mb-2 text-[20px] font-black text-[var(--primary)]">
                      {card.title}
                    </h3>
                    <p className="text-[var(--on-surface-variant)]">{card.body}</p>
                  </div>
                </div>
              </m.article>
            ))}
          </m.div>
        </m.div>

        <FadeIn className="relative" delay={0.1}>
          <div data-parallax="soft" className="rounded-[2rem] bg-white p-2 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-black/10">
              <Image
                alt="Node interface"
                className="h-full w-full object-cover"
                height={760}
                priority
                src={audienceImage}
                unoptimized
                width={620}
              />
            </div>
          </div>
          <div
            data-parallax="reverse"
            className="rounded-gem absolute -bottom-8 right-0 bg-[var(--bridge-teal)] p-6 text-white shadow-xl transition-transform hover:-rotate-3 sm:-right-8"
          >
            <div className="text-[32px] font-black">94%</div>
            <div className="font-mono text-[12px] font-bold uppercase">
              Efficiency_Gain
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function MethodologySection() {
  return (
    <section
      data-section="methodology"
      className="schematic-grid relative overflow-hidden bg-[var(--deep-indigo)] py-[var(--block-padding)] text-white"
    >
      <div className="absolute inset-0 opacity-10" />
      <div className="section-shell relative z-10">
        <FadeIn>
          <SectionIntro
            body=""
            eyebrow="Methodology.03"
            eyebrowClassName="text-[var(--bridge-teal)]"
            title="The Learning Circuit"
            titleClassName="text-[3rem] text-white md:text-[4rem]"
          />
        </FadeIn>

        <div className="relative">
          <div
            data-draw-line
            className="absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 bg-[color:color-mix(in_srgb,var(--bridge-teal)_30%,transparent)] lg:block"
          />
          <m.div
            className="relative z-10 grid gap-8 lg:grid-cols-3"
            initial="hidden"
            variants={staggerContainer(0.12)}
            viewport={defaultViewport}
            whileInView="show"
          >
            {methodologySteps.map((step) => (
              <m.article
                key={step.step}
                className="rounded-gem group border border-white/10 bg-[var(--deep-indigo)] p-8 transition-all duration-500 hover:[border-color:color-mix(in_srgb,var(--step-accent)_50%,transparent)]"
                variants={fadeUp(24)}
                style={
                  {
                    ["--step-accent" as string]: step.accent,
                  } as CSSProperties
                }
              >
                <div className="mb-12 flex items-start justify-between">
                  <div
                    className="flex size-14 items-center justify-center border border-white/20 transition-colors group-hover:border-[var(--step-accent)]"
                  >
                    <MaterialSymbol
                      className="text-[32px] text-white transition-colors group-hover:text-[var(--step-accent)]"
                      name={step.icon}
                    />
                  </div>
                  <span className="font-mono text-[12px] font-bold tracking-widest text-[var(--bridge-teal)]">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-4 text-[24px] font-black uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-7 text-white/50">{step.body}</p>
              </m.article>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}

export function MentorsSection() {
  return (
    <section data-section="mentors" className="bg-white py-[var(--block-padding)]">
      <div className="section-shell">
        <FadeIn>
          <SectionIntro
            body="Learn from the architects who built the systems you use every day."
            eyebrow="Expert_Network.04"
            eyebrowClassName="text-[var(--bridge-teal)]"
            title="Precision Mentors"
          />
        </FadeIn>

        <m.div
          className="grid gap-12 md:grid-cols-3"
          initial="hidden"
          variants={staggerContainer(0.12)}
          viewport={defaultViewport}
          whileInView="show"
        >
          {mentors.map((mentor) => (
            <m.article key={mentor.name} className="group" variants={fadeUp(22)}>
              <div className="rounded-gem relative mb-8 aspect-[4/5] overflow-hidden border-2 border-[var(--soft-stone)] bg-[var(--soft-stone)] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                <Image
                  alt={mentor.name}
                  className="h-full w-full scale-105 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                  height={620}
                  loading="eager"
                  src={mentor.image}
                  unoptimized
                  width={496}
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-8 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="bg-[var(--bridge-teal)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                    VERIFIED_EXPERT
                  </div>
                </div>
              </div>
              <h3 className="mb-1 text-[24px] font-black text-[var(--primary)]">
                {mentor.name}
              </h3>
              <p
                className="mb-4 font-mono text-[12px] font-bold uppercase tracking-widest"
                style={{ color: mentor.accent }}
              >
                {mentor.title}
              </p>
              <div className="flex gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--soft-stone)] transition-colors hover:bg-[var(--bridge-teal)] hover:text-white">
                  <MaterialSymbol className="text-[18px]" name="alternate_email" />
                </div>
              </div>
            </m.article>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section data-section="pricing" className="bg-[var(--soft-stone)] py-[var(--block-padding)]">
      <div className="section-shell">
        <FadeIn>
          <SectionIntro
            body={`${programFee.note}.`}
            eyebrow="Asset_Access.05"
            eyebrowClassName="text-[var(--safety-orange)]"
            title="One Price. Everything Included."
          />
        </FadeIn>

        <m.div
          className={cn(
            "grid items-center gap-8",
            pricingPlans.length > 1 ? "md:grid-cols-3" : "mx-auto max-w-xl",
          )}
          initial="hidden"
          variants={staggerContainer(0.12)}
          viewport={defaultViewport}
          whileInView="show"
        >
          {pricingPlans.map((plan) => (
            <m.article
              key={plan.label}
              className={cn(
                "rounded-gem relative overflow-hidden border-2 p-12 transition-all duration-500",
                plan.featured
                  ? "scale-100 border-transparent bg-[var(--primary)] shadow-2xl md:scale-105"
                  : "border-transparent bg-white hover:border-[var(--bridge-teal)]",
              )}
              variants={fadeUp(plan.featured ? 28 : 20)}
            >
              {plan.featured ? (
                <div className="absolute right-[-38px] top-[18px] rotate-45 bg-[var(--electric-pink)] px-10 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white">
                  POPULAR
                </div>
              ) : null}

              <div className="mb-10">
                <h3
                  className={cn(
                    "mb-3 font-mono text-[11px] font-black uppercase tracking-[0.2em]",
                    plan.featured ? "text-white/40" : "text-[var(--outline)]",
                  )}
                >
                  {plan.label}
                </h3>
                <div className="flex items-end gap-2">
                  <span
                    className={cn(
                      "text-[54px] leading-none font-black",
                      plan.featured ? "text-white" : "text-[var(--primary)]",
                    )}
                  >
                    {"was" in plan && plan.was ? <s className="mr-2 align-middle text-[0.45em] font-bold opacity-50">{plan.was}</s> : null}
                    {plan.price}
                  </span>
                  {"off" in plan && plan.off ? <span className="ml-2 inline-block rounded-full bg-[var(--electric-pink)] px-2 py-0.5 align-middle text-[11px] font-black uppercase tracking-[0.08em] text-white">{plan.off}</span> : null}
                  {plan.suffix ? (
                    <span
                      className={cn(
                        "pb-1 text-[16px] font-bold",
                        plan.featured ? "text-white/40" : "text-[var(--outline)]",
                      )}
                    >
                      {plan.suffix}
                    </span>
                  ) : null}
                </div>
              </div>

              <ul className="mb-12 space-y-5">
                {plan.items.map((item) => (
                  <li
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 text-[15px] font-bold",
                      plan.featured
                        ? "text-white"
                        : item.included
                          ? "text-[var(--primary)]"
                          : "text-black/30",
                    )}
                  >
                    {"starred" in item && item.starred ? (
                      <MaterialSymbol
                        className="text-[22px] text-[var(--electric-pink)]"
                        filled
                        name="stars"
                      />
                    ) : item.included ? (
                      <MaterialSymbol
                        className="text-[20px] text-[var(--bridge-teal)]"
                        name="check_circle"
                      />
                    ) : (
                      <MaterialSymbol className="text-[20px]" name="cancel" />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>

              {plan.featured ? (
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants(),
                    "rounded-gem h-auto w-full bg-[var(--bridge-teal)] py-5 text-[14px] font-black uppercase tracking-widest text-white shadow-xl shadow-teal-900/30 transition-all hover:scale-105",
                  )}
                >
                  {plan.cta}
                </Link>
              ) : (
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto w-full rounded-full border-2 border-[var(--primary)] bg-transparent py-4 text-[14px] font-black uppercase tracking-widest text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white",
                  )}
                >
                  {plan.cta}
                </Link>
              )}
            </m.article>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section data-section="cta" className="bg-[var(--soft-stone)] py-[var(--block-padding)]">
      <div className="section-shell">
        <m.div
          className="schematic-grid relative overflow-hidden rounded-[2rem] bg-[var(--deep-indigo)] px-8 py-14 text-center text-white md:px-24 md:py-24"
          initial="hidden"
          variants={staggerContainer(0.12)}
          viewport={defaultViewport}
          whileInView="show"
        >
          <div className="absolute left-0 top-0 h-px w-full bg-[color:color-mix(in_srgb,var(--bridge-teal)_20%,transparent)]" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-[color:color-mix(in_srgb,var(--bridge-teal)_20%,transparent)]" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-[color:color-mix(in_srgb,var(--bridge-teal)_10%,transparent)]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <m.h2
              className="section-title mb-8 text-[2.5rem] uppercase leading-[0.95] tracking-[-0.04em] text-white md:text-[4rem]"
              variants={fadeUp(28)}
            >
              READY TO CONNECT YOUR SKILLS TO REAL OUTCOMES?
            </m.h2>
            <m.p
              className="mx-auto mb-12 max-w-2xl text-[18px] leading-8 text-white/60 md:text-[22px]"
              variants={fadeUp(22)}
            >
              Join Node and start building practical skills with structure,
              guidance, and real execution.
            </m.p>
            <m.div
              className="mb-8 flex flex-col items-center justify-center gap-6 md:flex-row"
              variants={fadeUp(18)}
            >
              <Link
                href="/register"
                className={cn(
                  buttonVariants(),
                  "h-auto rounded-full bg-[var(--electric-pink)] px-10 py-5 text-[15px] font-black uppercase tracking-wide text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:scale-105",
                )}
              >
                Enroll · {programFee.amount}
              </Link>
              <Button
                className="h-auto rounded-full border-2 border-white/20 bg-transparent px-10 py-5 text-[15px] font-black uppercase tracking-wide text-white transition-all duration-300 hover:bg-white hover:text-[var(--deep-indigo)]"
                type="button"
              >
                Talk to Us
              </Button>
            </m.div>
            <m.p
              className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--bridge-teal)]"
              variants={fadeUp(14)}
            >
              Next cohort starts soon. Limited seats available.
            </m.p>
          </div>
        </m.div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[var(--deep-indigo)] py-24 text-white">
      <div className="section-shell">
        <div className="grid gap-16 md:grid-cols-4">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="rounded-gem flex size-8 items-center justify-center bg-white">
                <MaterialSymbol className="text-[18px] text-[var(--deep-indigo)]" name="dataset" />
              </div>
              <span className="font-heading text-[24px] font-black tracking-tight">
                Node.
              </span>
            </div>
            <p className="max-w-xs text-[15px] leading-7 text-white/50">
              Building the future of technical orchestration. We bridge the gap
              between potential and precision with a block-based approach.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3
                className="mb-8 font-mono text-[12px] font-black uppercase tracking-widest"
                style={{ color: column.accent }}
              >
                {column.title}
              </h3>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      className="text-[15px] text-white/60 transition-all hover:text-white"
                      href="#"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/30">
            © 2024 SPECTRUM_LOGIC_INTL
          </span>
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-[var(--bridge-teal)] shadow-[0_0_10px_rgba(0,128,128,1)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/50">
              STATUS: OPTIMAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
