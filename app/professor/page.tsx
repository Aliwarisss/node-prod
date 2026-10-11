import type { Metadata } from "next";

import { ProfessorLanding } from "@/components/platform/professor-landing";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata: Metadata = {
  title: "The Professor — coming soon · Node",
  description: "Node’s advisor agent. He advises, he teaches, he instructs — and knows your program, your project and your plan. Coming to connect you soon.",
  openGraph: { title: "The Professor — coming soon", description: "He advises. He teaches. He instructs. Node’s advisor agent is coming to connect you soon." },
};

/* the Professor — Node's coming advisor agent — teased in public */
export default function ProfessorPage() {
  return (
    <>
      <SiteHeader />
      <ProfessorLanding />
    </>
  );
}
