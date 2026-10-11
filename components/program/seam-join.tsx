"use client";

import { useEffect, useId, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  from: string; // the stage before the seam (its background)
  to: string; // the stage after it
  line: [string, string]; // the seam's colour, start → end
  ink: [string, string]; // text colour on the "from" side, on the "to" side
  gate: string;
  note: string;
  lock: string; // the lock's colour
  open?: boolean;
  small?: boolean;
};

/* The join between two stages: a diagonal seam with the gate written along it, the lock at its centre.
   It measures itself so the line and the text keep their true angle at any size. */
export function SeamJoin({ from, to, line, ink, gate, note, lock, open = false, small = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let svg = null;
  if (size && size.w > 0 && size.h > 0) {
    const { w, h } = size;
    const tall = h > w;
    /* the seam runs from p0 to p1 (the direction the text reads); the "from" stage fills the side before it */
    const p0 = tall ? { x: w * 0.3, y: h } : { x: 0, y: h * 0.72 };
    const p1 = tall ? { x: w * 0.7, y: 0 } : { x: w, y: h * 0.28 };
    const poly = tall ? `0,0 ${p1.x},0 ${p0.x},${h} 0,${h}` : `0,0 ${w},0 ${w},${p1.y} 0,${p0.y}`;
    const m = { x: w / 2, y: h / 2 };
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const ux = (p1.x - p0.x) / len, uy = (p1.y - p0.y) / len;
    const gap = small ? 26 : 34; // the line breaks around the lock
    const a = { x: m.x - ux * gap, y: m.y - uy * gap }, b = { x: m.x + ux * gap, y: m.y + uy * gap };
    /* each label shrinks to fit its half of the line (mono glyph + tracking ≈ 0.72em) */
    const room = len / 2 - gap - 10;
    const fit = (s: string) => Math.max(7, Math.min(small ? 9 : 10, room / (s.length * 0.72)));
    const f1 = fit(`GATE · ${gate}`), f2 = fit(note);
    svg = (
      <svg width={w} height={h} className="absolute inset-0" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}>
            <stop offset="0" stopColor={line[0]} />
            <stop offset="1" stopColor={line[1]} />
          </linearGradient>
          <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
          <path id={`${id}s1`} d={`M${p0.x},${p0.y} L${a.x},${a.y}`} />
          <path id={`${id}s2`} d={`M${b.x},${b.y} L${p1.x},${p1.y}`} />
        </defs>
        <polygon points={poly} fill={from} />
        {/* the seam: a soft glow, the line itself, broken around the lock */}
        <path d={`M${p0.x},${p0.y} L${a.x},${a.y} M${b.x},${b.y} L${p1.x},${p1.y}`} stroke={`url(#${id}g)`} strokeWidth="6" opacity=".35" filter={`url(#${id}b)`} />
        <path d={`M${p0.x},${p0.y} L${a.x},${a.y} M${b.x},${b.y} L${p1.x},${p1.y}`} stroke={`url(#${id}g)`} strokeWidth="2" strokeLinecap="round" />
        {/* the gate, written along the seam: its name on the side you're leaving, what's left on the side you're going to */}
        <text fontSize={f1} style={{ fontFamily: "var(--font-geist-mono), monospace" }} fontWeight="700" letterSpacing={f1 * 0.12}>
          <textPath href={`#${id}s1`} startOffset="50%" textAnchor="middle">
            <tspan dy="-7" fill={line[0]}>GATE </tspan>
            <tspan fill={ink[0]}>· {gate.toUpperCase()}</tspan>
          </textPath>
        </text>
        <text fontSize={f2} style={{ fontFamily: "var(--font-geist-mono), monospace" }} fontWeight="700" letterSpacing={f2 * 0.12}>
          <textPath href={`#${id}s2`} startOffset="50%" textAnchor="middle">
            <tspan dy={f2 + 5} fill={ink[1]}>{note}</tspan>
          </textPath>
        </text>
      </svg>
    );
  }

  return (
    <div ref={ref} className={cn("relative flex items-center justify-center", small ? "min-h-[110px]" : "min-h-[140px]", "lg:min-h-0")} style={{ background: to }}>
      {svg}
      <span className={cn("relative flex rotate-45 items-center justify-center shadow-[0_8px_22px_-8px_rgba(0,0,0,.5)] ring-white", small ? "size-9 rounded-lg ring-2" : "size-12 rounded-xl ring-[3px]")} style={{ background: lock }}>
        <MaterialSymbol className={cn("-rotate-45 text-white", small ? "text-[17px]" : "text-[22px]")} name={open ? "lock_open" : "lock"} />
      </span>
    </div>
  );
}
