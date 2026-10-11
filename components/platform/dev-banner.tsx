import { DEFAULT_BANNER, type Banner } from "@/lib/site-banner";

/* The thin strip across the top of every page while Node is under development (admins switch it off in the panel).
 * Fixed, so it's always there; the page makes room for it through --nb, which the root layout sets. */
export const BANNER_H = "28px";

export function DevBanner({ banner }: { banner: Banner }) {
  if (!banner.enabled) return null;
  const isDefault = banner.message === DEFAULT_BANNER;
  return (
    <div role="status" title={banner.message} className="fixed inset-x-0 top-0 z-[140] flex h-[var(--nb)] items-center justify-center gap-2.5 border-b border-white/10 bg-[#0d1117] px-3 text-[11.5px] font-medium text-white/80">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f2b705]/15 px-2 py-px font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#f2b705]">
        <span className="size-1.5 animate-pulse rounded-full bg-[#f2b705]" />In development
      </span>
      {/* on narrow screens the default message has a shorter version; a custom one is cut to a line */}
      <span className={isDefault ? "hidden min-w-0 truncate sm:block" : "min-w-0 truncate"}>{banner.message}</span>
      {isDefault ? <span className="min-w-0 truncate sm:hidden">Bugs or hiccups possible — thank you!</span> : null}
    </div>
  );
}
