import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]",
        className,
      )}
      {...props}
    />
  );
}
