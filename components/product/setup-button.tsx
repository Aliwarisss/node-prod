"use client";

import type { ReactNode } from "react";

import type { ProfileStep } from "@/lib/profile";

/* opens the profile setup modal (it lives in the dashboard frame), at a step — for server-rendered pages */
export function SetupButton({ step, className, children }: { step?: ProfileStep; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("node:setup", { detail: { step } }))}>
      {children}
    </button>
  );
}
