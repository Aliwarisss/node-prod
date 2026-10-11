import type { Metadata } from "next";

import { ProgramPage } from "@/components/platform/program-page";

export const metadata: Metadata = {
  title: "Copy, Paste, Go — 30-day agentic delivery · Node",
  description:
    "Node's flagship program: develop apps end to end with agentic AI — one real project from requirements to deployment in 30 days. No experience needed.",
};

export default function Page() {
  return <ProgramPage />;
}
