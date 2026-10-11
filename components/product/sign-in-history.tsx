import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

import { RevokeSessionsButton } from "./revoke-sessions-button";

export type SignIn = { sid: string; at: string; browser: string; os: string; device: string; ip: string; endedAt: string | null; endedReason: "signout" | "replaced" | "blocked" | "revoked" | null };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const ICON: Record<string, string> = { mobile: "smartphone", tablet: "tablet_mac", desktop: "computer" };
const END: Record<string, [string, string]> = {
  signout: ["Signed out", "bg-black/[0.05] text-black/50"],
  replaced: ["Signed in again", "bg-black/[0.05] text-black/50"],
  blocked: ["Blocked", "bg-[#fdecf2] text-[#8a0f3f]"],
  revoked: ["Signed out by admin", "bg-[#eef0f4] text-[#3b4252]"],
};

/* An account's recent sign-ins — one device and browser at a time, so at most one is signed in now; the rest say how
   they ended (signed out, the same browser signing in again, or by an admin), and attempts from another device or
   browser while it was signed in show as blocked */
export function SignInHistory({ items, className, admin, userId }: { items: SignIn[]; className?: string; admin?: boolean; userId?: string }) {
  const live = items.some((s) => !s.endedAt);
  return (
    <section className={cn("grid gap-3 rounded-[22px] border border-black/[0.06] bg-white p-5", className)}>
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/50">Sign-ins</span>
        <span className="flex items-center gap-1 text-[11.5px] text-black/45"><MaterialSymbol className="text-[15px]" name="devices" />One device &amp; browser at a time</span>
      </span>
      {items.length ? (
        <ol className="grid gap-1">
          {items.map((s) => {
            const now = !s.endedAt;
            const [label, tone] = now ? ["Signed in now", "bg-[var(--bridge-teal)] text-white"] : END[s.endedReason ?? "signout"] ?? END.signout;
            return (
              <li key={s.sid} className={cn("flex items-center gap-3 rounded-xl px-2 py-2", now && "bg-[#e6f3f3]")}>
                <span className={cn("flex size-9 flex-none items-center justify-center rounded-xl", now ? "bg-[var(--bridge-teal)] text-white" : s.endedReason === "blocked" ? "bg-[#fdecf2] text-[#a3104a]" : "bg-black/[0.05] text-black/45")}><MaterialSymbol className="text-[19px]" name={s.endedReason === "blocked" ? "block" : ICON[s.device] ?? "devices"} /></span>
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate text-[13px] font-semibold text-[var(--primary)]">{s.browser} on {s.os}</span>
                  <span className="truncate text-[11.5px] text-black/45">{when(s.at)}{admin && s.ip ? ` · ${s.ip}` : ""}</span>
                </span>
                <span className={cn("flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold", tone)}>{label}</span>
              </li>
            );
          })}
        </ol>
      ) : <p className="text-[12.5px] text-black/45">Sign-ins from now on show here.</p>}
      {admin && userId ? (live ? <RevokeSessionsButton userId={userId} /> : null)
        : <p className="text-[11.5px] leading-5 text-black/45">While you’re signed in here, signing in on another device or browser is blocked. A blocked attempt you don’t recognise? Change your password.</p>}
    </section>
  );
}
