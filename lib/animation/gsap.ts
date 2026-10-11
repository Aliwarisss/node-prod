"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

let coreRegistered = false;
let scrollTriggerRegistered = false;
type ScrollTriggerLike = {
  refresh: () => void;
};

let scrollTriggerPlugin: ScrollTriggerLike | null = null;

if (!coreRegistered) {
  gsap.registerPlugin(useGSAP);
  gsap.config({ nullTargetWarn: false });
  coreRegistered = true;
}

export const gsapDefaults = {
  duration: 0.8,
  ease: "power3.out",
  overwrite: "auto",
} as const;

export async function ensureGsapScrollTrigger() {
  if (typeof window === "undefined") {
    return { gsap, ScrollTrigger: null };
  }

  if (scrollTriggerRegistered) {
    return {
      gsap,
      ScrollTrigger: scrollTriggerPlugin,
    };
  }

  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);
  scrollTriggerRegistered = true;
  scrollTriggerPlugin = ScrollTrigger as ScrollTriggerLike;

  return { gsap, ScrollTrigger };
}

export { gsap, useGSAP };
