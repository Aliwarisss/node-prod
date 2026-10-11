"use client";

import type { FeeStatus } from "@/lib/fee-types";

import { useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

export type ReferralSummary = {
  fee?: FeeStatus; // what's owed, paid so far and the balance (from the server)
  code: string; invited: number; joined: number; due: number; free: boolean; paid: boolean; paidVia: "cash" | "referrals" | null;
  cashback: { earned: number; paidOut: number; owed: number; max: number };
  people: { name: string; joined: boolean; at: string | null }[];
};
export const FULL_FEE = 10000, FEE = 5000, REWARD = 1000, FREE_AT = 5, CASHBACK = REWARD / 2;
export const pkr = (n: number) => `PKR ${n.toLocaleString("en-US")}`;

/* your referral numbers, loaded on the page (they change as friends join) */
export function useReferrals() {
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetch("/api/referrals").then(async (r) => {
      const d = await r.json().catch(() => null);
      if (!live) return;
      if (r.ok && d?.code !== undefined) setData(d as ReferralSummary); else setError((d as { error?: string } | null)?.error ?? "Couldn’t load your referrals.");
    }).catch(() => { if (live) setError("Couldn’t load your referrals."); });
    return () => { live = false; };
  }, []);
  return { data, error };
}

/* five slots — one fills for each friend who joins */
function Slots({ joined }: { joined: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${Math.min(joined, FREE_AT)} of ${FREE_AT} friends joined`}>
      {Array.from({ length: FREE_AT }, (_, i) => (
        <span key={i} className={cn("flex size-9 items-center justify-center rounded-full border-2 transition-colors", i < joined ? "border-[var(--bridge-teal)] bg-[var(--bridge-teal)] text-white" : "border-dashed border-black/15 text-black/25")}>
          <MaterialSymbol className="text-[18px]" name={i < joined ? "check" : "person_add"} />
        </span>
      ))}
    </div>
  );
}

/* the link to share, with copy and WhatsApp */
function ShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState<"" | "link" | "code">("");
  const [origin, setOrigin] = useState("");
  useEffect(() => { const t = setTimeout(() => setOrigin(window.location.origin), 0); return () => clearTimeout(t); }, []);
  const link = origin ? `${origin}/register?ref=${code}` : "";
  const copy = (what: "link" | "code") => void navigator.clipboard.writeText(what === "link" ? link : code).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); });
  const message = `I'm learning to build apps end to end with AI agents on Node's 30-day program, Copy, Paste, Go. Join with my link: ${link}`;
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--primary)]">{link || "…"}</span>
        <button type="button" disabled={!link} onClick={() => copy("link")} className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-2 text-[12.5px] font-bold text-white"><MaterialSymbol className="text-[16px]" name={copied === "link" ? "check" : "content_copy"} />{copied === "link" ? "Copied" : "Copy link"}</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        <span className="text-black/50">Your code</span>
        <button type="button" onClick={() => copy("code")} className="rounded-lg bg-[#f1f2f3] px-2.5 py-1 font-mono font-bold tracking-[0.08em] text-[var(--primary)] hover:bg-[#e8eaec]" title="Copy the code">{code}{copied === "code" ? " ✓" : ""}</button>
        {link ? <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[#25d366] px-2.5 py-1 font-bold text-white"><MaterialSymbol className="text-[15px]" name="chat" />Share on WhatsApp</a> : null}
        {link ? <a href={`mailto:?subject=${encodeURIComponent("Join me on Node")}&body=${encodeURIComponent(message)}`} className="flex items-center gap-1 rounded-lg bg-[#f1f2f3] px-2.5 py-1 font-bold text-[var(--primary)]"><MaterialSymbol className="text-[15px]" name="mail" />Email</a> : null}
      </div>
    </div>
  );
}

/* ---------- refer & save: the fee after discounts, the five slots, the link, and who you've invited ---------- */
export function ReferralPanel({ data, compact }: { data: ReferralSummary; compact?: boolean }) {
  const saved = FEE - data.due;
  const left = Math.max(0, FREE_AT - data.joined);
  const cashPayer = data.paid && data.paidVia === "cash";
  return (
    <div className={cn("grid gap-4 rounded-[22px] border border-black/[0.06] bg-white", compact ? "p-5" : "p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--bridge-teal)]">Refer & save</span>
          <b className="text-[18px] leading-tight text-[var(--primary)]">
            {cashPayer ? `Each friend who joins earns you ${pkr(CASHBACK)} cash back` : data.free ? "Your program is free 🎉" : `Each friend who joins takes ${pkr(REWARD)} off`}
          </b>
          <span className="max-w-xl text-[13px] leading-5 text-[var(--on-surface-variant)]">
            {cashPayer
              ? `You’ve paid, so each friend who joins with your link now earns you half the referral — ${pkr(CASHBACK)} back in cash, up to ${pkr(data.cashback.max)} (half your fee). Your Node admin hands it over.`
              : data.free ? `${data.joined} friends joined with your link, so your fee is fully covered and your program is open.`
              : `The program is ${pkr(FULL_FEE)}; your fee is ${pkr(FEE)} — 50% off. Share your link: when someone signs up with it and joins (their fee is confirmed), ${pkr(REWARD)} more comes off. Five friends and it’s free — your program unlocks on its own.`}
          </span>
        </div>
        {cashPayer ? (
          <div className="grid justify-items-end gap-0.5 text-right">
            <span className="text-[11.5px] font-semibold text-black/45">Cash back</span>
            <b className={cn("text-[26px] font-black leading-none", data.cashback.owed ? "text-[var(--bridge-teal)]" : "text-[var(--primary)]")}>{pkr(data.cashback.earned)}</b>
            <span className="text-[12px] text-black/50">{data.cashback.owed ? <b className="text-[var(--bridge-teal)]">{pkr(data.cashback.owed)} to collect</b> : data.cashback.earned ? "all paid out" : `up to ${pkr(data.cashback.max)}`}{data.cashback.paidOut ? ` · ${pkr(data.cashback.paidOut)} paid out` : ""}</span>
          </div>
        ) : (
          <div className="grid justify-items-end gap-0.5 text-right">
            <span className="text-[11.5px] font-semibold text-black/45">Your fee</span>
            <span className="flex items-baseline gap-2"><s className="text-[13px] text-black/35">{pkr(saved > 0 ? FEE : FULL_FEE)}</s><b className={cn("text-[26px] font-black leading-none", data.due === 0 ? "text-[var(--bridge-teal)]" : "text-[var(--primary)]")}>{data.due === 0 ? "Free" : pkr(data.due)}</b></span>
            <span className="text-[12px] font-semibold text-[var(--bridge-teal)]">{saved > 0 ? `You’ve saved ${pkr(FULL_FEE - data.due)} in all` : `50% off ${pkr(FULL_FEE)}`}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Slots joined={data.joined} />
        <span className="text-[13px] text-[var(--on-surface-variant)]">{cashPayer ? <><b className="text-[var(--primary)]">{data.joined}</b> joined{data.invited > data.joined ? ` · ${data.invited - data.joined} signed up, not joined yet` : ""}</> : data.free ? "All five — fee covered." : <><b className="text-[var(--primary)]">{data.joined}</b> joined{data.invited > data.joined ? ` · ${data.invited - data.joined} signed up, not joined yet` : ""} · <b className="text-[var(--primary)]">{left}</b> more for free</>}</span>
      </div>

      <ShareLink code={data.code} />

      {!compact && data.people.length ? (
        <div className="grid gap-1.5 border-t border-black/[0.06] pt-3">
          <span className="text-[12px] font-bold text-black/50">People you invited</span>
          <ul className="grid gap-1 sm:grid-cols-2">
            {data.people.map((p, i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl bg-[#f8f9fa] px-3 py-2 text-[13px]">
                <span className={cn("flex size-7 items-center justify-center rounded-full text-[11px] font-black text-white", p.joined ? "bg-[var(--bridge-teal)]" : "bg-black/20")}>{p.name.slice(0, 1).toUpperCase()}</span>
                <b className="min-w-0 flex-1 truncate text-[var(--primary)]">{p.name}</b>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", p.joined ? "bg-[#e6f3f3] text-[#005a5a]" : "bg-[#fff6d6] text-[#6b4f00]")}>{p.joined ? (cashPayer ? "Joined" : `Joined · −${pkr(REWARD)}`) : "Signed up — waiting to join"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* the panel, loading its own numbers */
export function ReferralBlock({ compact }: { compact?: boolean }) {
  const { data, error } = useReferrals();
  if (error) return <p className="rounded-2xl bg-[#fdecf2] px-4 py-3 text-[13px] text-[#8a0f3f]">{error}</p>;
  if (!data) return <div className="h-40 animate-pulse rounded-[22px] bg-black/[0.04]" />;
  return <ReferralPanel data={data} compact={compact} />;
}
