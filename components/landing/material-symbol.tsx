import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type MaterialSymbolProps = {
  className?: string;
  filled?: boolean;
  name: string;
  style?: CSSProperties;
};

export function MaterialSymbol({
  className,
  filled = false,
  name,
  style,
}: MaterialSymbolProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined leading-none",
        filled && "material-symbols-filled",
        className,
      )}
      style={style}
    >
      {name}
    </span>
  );
}
