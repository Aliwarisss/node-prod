"use client";

import type { ReactNode } from "react";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

import { defaultTransition } from "@/lib/animation/motion";

type AnimationProviderProps = {
  children: ReactNode;
};

export function AnimationProvider({ children }: AnimationProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={defaultTransition}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
