import type { Skill } from "@/lib/explore/skills";

/* a skill's badge — its short mark on its own colour */
export function Mono({ k, size = 40 }: { k: Pick<Skill, "mono" | "color" | "ink">; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[28%] font-mono font-black tracking-[-0.04em]" style={{ width: size, height: size, background: k.color, color: k.ink ?? "#fff", fontSize: size * (k.mono.length > 2 ? 0.3 : 0.38) }}>
      {k.mono}
    </span>
  );
}
