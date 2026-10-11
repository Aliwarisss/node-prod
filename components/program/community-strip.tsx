import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";

const pill = "flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-2 text-[13px] font-bold text-[var(--primary)] transition-colors hover:border-[var(--primary)] sm:px-4";
const badge = "rounded-full px-1.5 py-px text-[10.5px] font-bold text-white";

/* the community, in the program's top bar: the feed and the board, one tap away (icons only on phones) */
export function CommunityStrip({ open, today }: { open: number; today: number }) {
  return (
    <nav className="flex items-center gap-2" aria-label="Community">
      <Link href="/dashboard/feed" className={pill} aria-label="Feed">
        <MaterialSymbol className="text-[17px]" name="dynamic_feed" /><span className="hidden sm:inline">Feed</span>
        {today ? <span className={badge} style={{ background: "var(--electric-pink)" }} title={`${today} new today`}>{today}</span> : null}
      </Link>
      <Link href="/dashboard/board" className={pill} aria-label="Board">
        <MaterialSymbol className="text-[17px]" name="forum" /><span className="hidden sm:inline">Board</span>
        {open ? <span className={badge} style={{ background: "#a3104a" }} title={`${open} question${open === 1 ? "" : "s"} waiting for an answer`}>{open}</span> : null}
      </Link>
    </nav>
  );
}
