import type { Transition, Variants } from "framer-motion";

export const motionEasing = {
  smooth: [0.22, 1, 0.36, 1],
  snappy: [0.16, 1, 0.3, 1],
  soft: [0.25, 0.1, 0.25, 1],
} as const;

export const motionDurations = {
  fast: 0.2,
  base: 0.55,
  slow: 0.8,
} as const;

export const defaultTransition = {
  duration: motionDurations.base,
  ease: motionEasing.smooth,
} satisfies Transition;

export const defaultViewport = {
  once: true,
  amount: 0.2,
} as const;

export function fadeUp(distance = 24): Variants {
  return {
    hidden: {
      opacity: 0,
      y: distance,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: defaultTransition,
    },
  };
}

export function fadeIn(delay = 0): Variants {
  return {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        ...defaultTransition,
        delay,
      },
    },
  };
}

export function staggerContainer(stagger = 0.12, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };
}

export function scaleIn(scale = 0.96): Variants {
  return {
    hidden: {
      opacity: 0,
      scale,
    },
    show: {
      opacity: 1,
      scale: 1,
      transition: defaultTransition,
    },
  };
}
