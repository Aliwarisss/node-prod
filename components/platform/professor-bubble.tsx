"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/* The Professor, speaking up from the header: a speech bubble pops out of his link — first he's typing, then
 * "I'm coming to connect you soon." It stays a few seconds, then goes, and comes back now and then (three times a
 * page at most, so it never nags). A click opens his page. */
const RED = "#e3051b";

export function ProfessorBubble({ className, tail = "center", suppressed }: { className?: string; tail?: "center" | "right"; suppressed: boolean }) {
  const [phase, setPhase] = useState<"off" | "typing" | "say">("off");
  useEffect(() => {
    const timers: number[] = [];
    let shown = 0;
    const cycle = (delay: number) => {
      timers.push(window.setTimeout(() => {
        setPhase("typing");
        timers.push(window.setTimeout(() => setPhase("say"), 1200));
        timers.push(window.setTimeout(() => { setPhase("off"); if (++shown < 3) cycle(18000); }, 7800));
      }, delay));
    };
    cycle(2400);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  if (phase === "off" || suppressed) return null;
  return (
    <div className={cn("z-[101]", className)}>
      <Link href="/professor" aria-label="The Professor: I’m coming to connect you soon" className={cn("nb-pop relative flex w-max max-w-[min(300px,calc(100vw-32px))] items-center gap-3 rounded-2xl border bg-[#0b0b0c] py-2.5 pl-2.5 pr-4 text-white shadow-[0_20px_50px_-18px_rgba(0,0,0,.85)]", tail === "right" ? "origin-top-right" : "origin-top")} style={{ borderColor: `${RED}66` }}>
        {/* the tail, pointing back at his link */}
        <span className={cn("absolute -top-[7px] size-3 rotate-45 border-l border-t bg-[#0b0b0c]", tail === "right" ? "right-5" : "left-1/2 -translate-x-1/2")} style={{ borderColor: `${RED}66` }} aria-hidden />
        <Face />
        <span className="grid min-w-0 gap-0.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: RED }}>The Professor</span>
          {phase === "typing" ? (
            <span className="flex h-[18px] items-center gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="nb-dot size-1.5 rounded-full bg-white/70" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
          ) : (
            <span className="nb-say text-[13px] font-semibold leading-[18px]">I’m coming to connect you soon.</span>
          )}
        </span>
      </Link>
    </div>
  );
}

/* his face in a circle: the profile in straight lines — hair, glasses, beard */
function Face() {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "#1a0b0d", boxShadow: `0 0 0 1.5px ${RED}` }} aria-hidden>
      <svg viewBox="0 0 36 36" className="size-full">
        <polygon points="9,36 10,24 13,17 18,14 24,15 27,19 27,24 25,30 22,36" fill="#060404" />
        <polyline points="13,17 18,13 24,14 27,18" fill="none" stroke="#ffd98a" strokeOpacity=".55" strokeWidth="1.2" />
        <polygon points="15,25 26,24 25,30 21,33 16,31" fill="#060404" stroke="#d8c3a0" strokeOpacity=".35" strokeWidth=".8" />
        <rect x="15" y="19.5" width="4.6" height="3.2" fill="none" stroke="#f2e6cf" strokeWidth=".9" />
        <rect x="21" y="19.5" width="4.6" height="3.2" fill="none" stroke="#f2e6cf" strokeWidth=".9" />
        <line x1="19.6" y1="21" x2="21" y2="21" stroke="#f2e6cf" strokeWidth=".8" />
      </svg>
    </span>
  );
}
