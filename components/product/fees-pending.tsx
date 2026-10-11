"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { money } from "@/lib/fee-types";
import { programFee } from "@/lib/node-landing-data";
import { cn } from "@/lib/utils";

import { FeeStatement } from "./fee-statement";
import { ReferralPanel, useReferrals } from "./referral-panel";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";

/* Fees are cash on delivery, and can be paid in parts: until payments (and referral discounts) cover the fee, the
   program stays locked — and this shows where it stands: the fee, what's been paid, and the balance */
export function FeesPending({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [checking, startTransition] = useTransition();
  const { data: refs } = useReferrals();
  const fee = refs?.fee;
  const partial = !!fee && fee.paid > 0 && fee.balance > 0;
  const balance = fee ? money(fee.balance) : programFee.amount;

  const steps = [
    { icon: "payments", title: partial ? "Pay the rest" : "Pay your fee", body: `${balance}${partial ? " left" : ""} — all at once or in parts, in cash or by transfer.`, state: "now" },
    { icon: "receipt_long", title: "We record it", body: "Each payment shows up here, with your balance.", state: "waiting" },
    { icon: "lock_open", title: "Your program unlocks", body: "As soon as the balance is cleared — automatically.", state: "next" },
  ];

  return (
    <section className={cn("relative overflow-hidden rounded-[24px] border border-[#e2b13c]/40 bg-[#fffaf0] shadow-[0_24px_60px_-40px_rgba(13,17,23,0.35)]", compact ? "p-6 sm:p-8" : "p-7 sm:p-10")}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="grid content-start gap-3">
          <span className="flex w-fit items-center gap-2 rounded-full bg-[#e2b13c]/20 px-3 py-1.5 text-[12px] font-bold text-[#8a6100]">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#c49000] opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-[#c49000]" /></span>
            {partial ? `Part paid — ${balance} to go` : "Waiting for your fee"}
          </span>
          <h2 className={cn("font-heading font-black uppercase leading-[0.95] tracking-[-0.04em] text-[var(--primary)]", compact ? "text-[26px]" : "text-[clamp(1.8rem,3.4vw,2.6rem)]")}>
            {partial ? <>Almost there — <span className="text-[var(--electric-pink)]">{balance} to go.</span></> : <>Submit your fee <span className="text-[var(--electric-pink)]">to start.</span></>}
          </h2>
          <p className="max-w-[520px] text-[15.5px] leading-7 text-[var(--on-surface-variant)]">
            {partial
              ? <>Thanks — we’ve received <b className="text-[var(--primary)]">{money(fee.paid)}</b> of your <b className="text-[var(--primary)]">{money(fee.total)}</b> fee. Pay the remaining <b className="text-[var(--primary)]">{balance}</b> whenever you’re ready — in one go or in parts — and your program unlocks the moment it’s cleared.</>
              : <>Your fee is <b className="text-[var(--primary)]">{balance}</b> — paid in cash on delivery, all at once or in parts. Every payment is recorded here, and your program unlocks as soon as the balance is cleared.</>}
          </p>
          <ol className="mt-1 grid gap-2">
            {steps.map((s, i) => (
              <li key={s.title} className={cn("flex items-start gap-3 rounded-2xl border bg-white p-3", s.state === "waiting" ? "border-[#e2b13c]/60" : "border-black/[0.06]")}>
                <span className={cn("flex size-9 flex-none items-center justify-center rounded-xl", s.state === "now" ? "bg-[var(--electric-pink)] text-white" : s.state === "waiting" ? "bg-[#e2b13c]/20 text-[#8a6100]" : "bg-[#f1f2f3] text-black/40")}>
                  <MaterialSymbol className="text-[19px]" name={s.icon} />
                </span>
                <span className="grid gap-0.5">
                  <span className={cn(kicker, "text-[var(--on-surface-variant)]")}>Step {i + 1}</span>
                  <b className="text-[14px] text-[var(--primary)]">{s.title}</b>
                  <span className="text-[13px] text-[var(--on-surface-variant)]">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => startTransition(() => router.refresh())} className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-[13px] font-bold text-white disabled:opacity-60" disabled={checking}>
              <MaterialSymbol className={cn("text-[18px]", checking && "animate-spin")} name="refresh" />
              {checking ? "Checking…" : "I’ve paid — check again"}
            </button>
            <span className="text-[13px] text-[var(--on-surface-variant)]">Questions? Contact your Node admin.</span>
          </div>
        </div>

        {/* the statement: the fee, what's been paid, the balance */}
        <div className="grid content-start gap-2">
          <span className={cn(kicker, "text-[#8a6100]")}>Your fee</span>
          {fee ? <FeeStatement fee={fee} /> : <div className="h-[320px] animate-pulse rounded-2xl bg-white/70" />}
        </div>
      </div>
      {refs ? <div className="relative mt-6"><ReferralPanel data={refs} compact /></div> : null}
    </section>
  );
}
