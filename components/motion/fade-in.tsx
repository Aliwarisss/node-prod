"use client";

import type { ReactNode } from "react";

import { m, type HTMLMotionProps } from "framer-motion";

import { defaultViewport, fadeUp } from "@/lib/animation/motion";
import { cn } from "@/lib/utils";

type FadeInProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  distance?: number;
  eager?: boolean;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  distance = 24,
  eager = false,
  transition,
  ...props
}: FadeInProps) {
  return (
    <m.div
      className={cn(className)}
      initial="hidden"
      animate={eager ? "show" : undefined}
      transition={{ delay, ...transition }}
      variants={fadeUp(distance)}
      viewport={eager ? undefined : defaultViewport}
      whileInView={eager ? undefined : "show"}
      {...props}
    >
      {children}
    </m.div>
  );
}
