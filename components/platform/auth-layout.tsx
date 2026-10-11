import type { ReactNode } from "react";

import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { lessonCount, modules } from "@/lib/course-data";
import { FlagshipPrice } from "@/components/providers/pricing-provider";
import { flagshipHref } from "@/lib/platform-data";

type AuthLayoutProps = {
  children: ReactNode;
  kicker: string;
  title: ReactNode;
  lead: string;
  alternate: { text: string; label: string; href: string };
};

const points = [
  "Real projects, not toy exercises",
  "AI agents as your team — you make the calls",
  "Experts who review your work and your gates",
];

/* Sign-in and sign-up: Node's dark story panel on the left, a calm white form on the right */
export function AuthLayout({ children, kicker, title, lead, alternate }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[100svh] bg-white lg:grid-cols-[1fr_1.05fr]">
      {/* story panel */}
      <aside
        className="relative flex flex-col justify-between gap-10 overflow-hidden bg-[var(--deep-indigo)] px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      >
        <div className="pointer-events-none absolute -left-40 bottom-[-30%] size-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,128,128,.32),transparent_62%)]" />
        <div className="pointer-events-none absolute -right-40 top-[-25%] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(233,30,99,.22),transparent_62%)]" />

        <Link href="/" className="relative flex w-fit items-center gap-2.5">
          <span className="rounded-gem flex size-10 items-center justify-center bg-white">
            <MaterialSymbol className="text-[22px] text-[var(--primary)]" name="dataset" />
          </span>
          <span className="font-heading text-[24px] font-black tracking-tight">Node.</span>
          <span className="ml-1 hidden font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4fd1c5] sm:inline">Bridging the gap</span>
        </Link>

        <div className="relative grid max-w-[520px] gap-5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#4fd1c5]">{kicker}</span>
          <h1 className="font-heading text-[clamp(2.2rem,4vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[-0.045em]">{title}</h1>
          <p className="text-[17px] leading-7 text-white/65">{lead}</p>
          <ul className="mt-2 hidden gap-3 lg:grid">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[15px] text-white/80">
                <MaterialSymbol className="text-[20px] text-[var(--electric-pink)]" name="check_circle" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* the flagship program */}
        <Link
          href={flagshipHref}
          className="group relative hidden max-w-[520px] gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-[#4fd1c5]/40 lg:grid"
        >
          <span className="w-fit rounded-full bg-[var(--electric-pink)] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em]">● Flagship program</span>
          <span className="font-heading text-[22px] font-black uppercase tracking-[-0.03em]">Copy, Paste, Go</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-white/60">
            <span>30 days</span><span>{modules.length} modules</span><span>{lessonCount} lessons</span><span><FlagshipPrice part="price" /><FlagshipPrice part="off" before=" · " /></span>
          </span>
          <span className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.08em] text-[#4fd1c5] transition-all group-hover:gap-3">
            Explore the program <MaterialSymbol className="text-[18px]" name="arrow_forward" />
          </span>
        </Link>
      </aside>

      {/* form */}
      <main className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-end gap-4 text-[14px]">
          <span className="text-[var(--on-surface-variant)]">{alternate.text}</span>
          <Link href={alternate.href} className="rounded-full border border-black/10 px-4 py-2 font-bold text-[var(--primary)] transition-colors hover:border-[var(--primary)]">
            {alternate.label}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-6 lg:py-10">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--on-surface-variant)]">
          <Link href="/" className="flex items-center gap-1.5 font-semibold transition-colors hover:text-[var(--primary)]">
            <MaterialSymbol className="text-[17px]" name="arrow_back" />Back to Node
          </Link>
          <span className="font-mono text-[11px]">© {new Date().getFullYear()} Node</span>
        </div>
      </main>
    </div>
  );
}
