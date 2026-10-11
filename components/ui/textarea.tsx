import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-[1.1rem] border border-[var(--border)] bg-white px-4 py-3 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--bridge-teal)] focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--bridge-teal)_18%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
