import type { ReactNode } from "react";

import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialSymbol } from "../landing/material-symbol";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function Eyebrow({ children, className }: EyebrowProps) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-black/6 bg-white shadow-[0_30px_80px_-28px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TopBrandBarProps = {
  actionSlot?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
};

export function TopBrandBar({
  actionSlot,
  ctaHref = "/",
  ctaLabel = "Back Home",
}: TopBrandBarProps) {
  return (
    <header className="fixed inset-x-0 top-[var(--nb,0px)] z-[120] border-b border-black/5 bg-white/82 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <Link className="flex items-center gap-2" href="/">
          <div className="rounded-gem flex size-9 items-center justify-center bg-[var(--primary)]">
            <MaterialSymbol className="text-[20px] text-white" name="dataset" />
          </div>
          <span className="font-heading text-[22px] font-black tracking-tight text-[var(--primary)]">
            Node.
          </span>
        </Link>

        {actionSlot ?? (
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants(),
              "h-auto rounded-full bg-[var(--primary)] px-5 py-3 text-[12px] font-black tracking-[0.08em] text-white shadow-xl shadow-black/10 transition-transform duration-300 hover:scale-105 sm:px-7 sm:text-[13px]",
            )}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </header>
  );
}

type StatChipProps = {
  label: string;
  value: string;
};

export function StatChip({ label, value }: StatChipProps) {
  return (
    <div className="rounded-[1.25rem] border border-black/6 bg-white px-4 py-3 shadow-sm">
      <div className="text-[1.45rem] font-black leading-none text-[var(--primary)]">{value}</div>
      <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--bridge-teal)]">
        {label}
      </div>
    </div>
  );
}

type BulletListProps = {
  accent: string;
  items: string[];
};

export function BulletList({ accent, items }: BulletListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 text-[15px] leading-6 text-[var(--on-surface-variant)]">
          <span
            className="mt-1 size-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function FadeSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <FadeIn className={className}>{children}</FadeIn>;
}
