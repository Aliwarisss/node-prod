import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionIntroProps = {
  align?: "center" | "left";
  body?: string;
  bodyClassName?: string;
  className?: string;
  eyebrow: string;
  eyebrowClassName?: string;
  title: ReactNode;
  titleClassName?: string;
};

export function SectionIntro({
  align = "center",
  body,
  bodyClassName,
  className,
  eyebrow,
  eyebrowClassName,
  title,
  titleClassName,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        "mb-24",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <span className={cn("eyebrow mb-4 block", eyebrowClassName)}>{eyebrow}</span>
      <h2
        className={cn(
          "section-title text-[3rem] leading-none md:text-[4rem]",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={cn(
            "mt-6 text-lg leading-8 text-[var(--on-surface-variant)]",
            align === "center" && "mx-auto max-w-2xl",
            bodyClassName,
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
