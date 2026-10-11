"use client";

import { useRef } from "react";

import { gsap, gsapDefaults, ensureGsapScrollTrigger, useGSAP } from "@/lib/animation/gsap";

import { LandingHeader } from "./landing-header";
import {
  AudienceSection,
  CtaSection,
  HeroSection,
  MentorsSection,
  MethodologySection,
  PricingSection,
  ProblemSection,
  RoadmapSection,
  SiteFooter,
  StatsSection,
  WhyNodeSection,
} from "./landing-sections";

export function NodeLandingPage() {
  const mainRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      let cancelled = false;

      async function createScrollScenes() {
        const { ScrollTrigger } = await ensureGsapScrollTrigger();

        if (cancelled || !mainRef.current || !ScrollTrigger) {
          return;
        }

        gsap.defaults(gsapDefaults);

        const heroFrame = mainRef.current.querySelector<HTMLElement>("[data-hero-frame]");
        if (heroFrame) {
          gsap.to(heroFrame, {
            yPercent: -10,
            ease: "none",
            scrollTrigger: {
              trigger: heroFrame,
              start: "top top",
              end: "bottom top",
              scrub: 1.1,
            },
          });
        }

        gsap.utils
          .toArray<HTMLElement>("[data-parallax='soft']", mainRef.current)
          .forEach((element) => {
            const section = element.closest("[data-section]") ?? element;
            gsap.to(element, {
              y: -36,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          });

        gsap.utils
          .toArray<HTMLElement>("[data-parallax='reverse']", mainRef.current)
          .forEach((element) => {
            const section = element.closest("[data-section]") ?? element;
            gsap.to(element, {
              y: 28,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          });

        gsap.utils
          .toArray<HTMLElement>("[data-draw-line]", mainRef.current)
          .forEach((element) => {
            gsap.fromTo(
              element,
              { scaleX: 0, transformOrigin: "left center" },
              {
                scaleX: 1,
                duration: 1.1,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 85%",
                },
              },
            );
          });

        ScrollTrigger.refresh();
      }

      createScrollScenes();

      return () => {
        cancelled = true;
      };
    },
    { scope: mainRef },
  );

  return (
    <main ref={mainRef} className="bg-[var(--surface)] text-[var(--on-surface)]">
      <LandingHeader />
      <HeroSection />
      <StatsSection />
      <ProblemSection />
      <WhyNodeSection />
      <AudienceSection />
      <MethodologySection />
      <RoadmapSection />
      <MentorsSection />
      <PricingSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
