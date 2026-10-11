import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 rounded-[0.35rem] border border-[var(--outline-variant)] accent-[var(--bridge-teal)]",
        className,
      )}
      {...props}
    />
  );
}
