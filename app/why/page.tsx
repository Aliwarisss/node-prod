import type { Metadata } from "next";

import { SiteHeader } from "@/components/platform/site-header";
import { WhyNode } from "@/components/platform/why-node";

export const metadata: Metadata = {
  title: "Why Node — our philosophy",
  description: "Between education and the market there’s a gap, and people fall into it. Node is the bridge across: aggressive, hands-on training, entered at any point, and a partner for the whole career.",
};

export default function WhyPage() {
  return (
    <>
      <SiteHeader />
      <WhyNode />
    </>
  );
}
