import type { ReactNode } from "react";

import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { authHighlights, authStats } from "@/lib/product-data";
import { cn } from "@/lib/utils";

import {
  BulletList,
  Eyebrow,
  FadeSection,
  Panel,
  StatChip,
  TopBrandBar,
} from "./section-primitives";

type AuthShellProps = {
  alternateCtaHref: string;
  alternateCtaLabel: string;
  alternateText: string;
  children: ReactNode;
  heading: string;
  subheading: string;
};

export function AuthShell({
  alternateCtaHref,
  alternateCtaLabel,
  alternateText,
  children,
  heading,
  subheading,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <TopBrandBar ctaHref="/" ctaLabel="Back Home" />
      <main className="node-link-pattern relative overflow-hidden pb-12 pt-30">
        <div className="section-shell grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <FadeSection className="space-y-8">
            <div className="pt-3">
              <Eyebrow className="mb-6 text-[var(--bridge-teal)]">Access_Node</Eyebrow>
              <h1 className="section-title max-w-xl text-[3.4rem] leading-[0.95] text-[var(--primary)] md:text-[4.7rem]">
                {heading}
              </h1>
              <p className="mt-6 max-w-xl text-[18px] leading-8 text-[var(--on-surface-variant)]">
                {subheading}
              </p>
            </div>

            <Panel className="p-7">
              <div className="mb-6 flex flex-wrap gap-4">
                {authStats.map((stat) => (
                  <StatChip key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
              <BulletList accent="var(--bridge-teal)" items={authHighlights} />
            </Panel>

            <Panel className="schematic-grid relative overflow-hidden bg-[var(--deep-indigo)] p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,30,99,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(0,128,128,0.22),transparent_42%)] opacity-90" />
              <div className="relative z-10">
                <Eyebrow className="mb-5 text-[var(--electric-pink)]">Mentor_Notes</Eyebrow>
                <p className="max-w-lg text-[18px] leading-8 text-white/72">
                  &ldquo;The best engineers do not just finish modules. They learn how each
                  system decision affects the next one. That is what Node makes visible.&rdquo;
                </p>
                <div className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--bridge-teal)]">
                  Elena Vance // Principal Architect
                </div>
              </div>
            </Panel>
          </FadeSection>

          <FadeIn delay={0.08}>
            <Panel className="relative overflow-hidden bg-white p-8 md:p-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--bridge-teal)] via-[var(--electric-pink)] to-[var(--safety-orange)]" />
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,transparent)] blur-3xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[color:color-mix(in_srgb,var(--electric-pink)_10%,transparent)] blur-3xl" />
              <div className="relative z-10">
                {children}
                <div className="mt-8 border-t border-black/6 pt-6 text-center text-[15px] text-[var(--on-surface-variant)]">
                  {alternateText}{" "}
                  <Link
                    href={alternateCtaHref}
                    className="font-black text-[var(--bridge-teal)] transition-colors hover:text-[var(--electric-pink)]"
                  >
                    {alternateCtaLabel}
                  </Link>
                </div>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-auto rounded-full px-5 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-[var(--primary)]",
                    )}
                  >
                    Explore Roadmap
                  </Link>
                </div>
              </div>
            </Panel>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
