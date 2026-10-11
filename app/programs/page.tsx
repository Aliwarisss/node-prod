import type { Metadata } from "next";

import { ProgramsView } from "@/components/platform/programs-view";
import { SiteHeader } from "@/components/platform/site-header";

export const metadata: Metadata = {
  title: "Programs — Node",
  description: "Every Node program: Copy, Paste, Go (live now), Hello, World, Dots, The NODE, the Nano Degree and A Day at NODE masterclasses — from a first look at computer science to a specialisation.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <ProgramsView />
    </>
  );
}
