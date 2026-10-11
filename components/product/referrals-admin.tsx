"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { ReferralEvent, ReferralReport, ReferrerRow, Reward } from "@/lib/referral-report";
import { cn } from "@/lib/utils";

const pkr = (n: number) => `PKR ${n.toLocaleString("en-US")}`;
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const stamp = (s: string) => new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]";

const STATUS: Record<ReferrerRow["status"], { label: string; cls: string }> = {
  unpaid: { label: "Fee pending", cls: "bg-[#fff6d6] text-[#6b4f00]" },
  cash: { label: "Paid cash", cls: "bg-[#eef0f2] text-[var(--primary)]" },
  free: { label: "Free via referrals", cls: "bg-[#e6f3f3] text-[#005a5a]" },
  admin: { label: "Admin", cls: "bg-[#efe9ff] text-[#4b2a99]" },
};
const REWARD: Record<Reward, { label: string; cls: string }> = {
  discount: { label: "−PKR 1,000 fee", cls: "bg-[#e6f3f3] text-[#005a5a]" },
  cashback: { label: "PKR 500 cash back", cls: "bg-[#e7f6ec] text-[#14632f]" },
  none: { label: "No reward", cls: "bg-black/[0.05] text-black/45" },
};
const EVENT: Record<ReferralEvent["kind"], { icon: string; label: string; cls: string }> = {
  signup: { icon: "person_add", label: "Sign-ups", cls: "bg-[#eef0f2] text-[var(--primary)]" },
  join: { icon: "how_to_reg", label: "Joins", cls: "bg-[#e6f3f3] text-[#005a5a]" },
  paid: { icon: "payments", label: "Payments", cls: "bg-[#fff6d6] text-[#6b4f00]" },
  free: { icon: "celebration", label: "Free unlocks", cls: "bg-[#efe9ff] text-[#4b2a99]" },
  cashout: { icon: "currency_exchange", label: "Cash back paid", cls: "bg-[#e7f6ec] text-[#14632f]" },
};
const FILTERS = [
  { id: "all", label: "All" },
  { id: "owed", label: "Cash back owed" },
  { id: "unpaid", label: "Fee pending" },
  { id: "free", label: "Free" },
  { id: "cash", label: "Paid cash" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

function Stat({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: "teal" | "amber" }) {
  return (
    <div className="grid content-start gap-1 rounded-2xl border border-black/[0.06] bg-white p-4">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-black/50"><MaterialSymbol className="text-[17px]" name={icon} />{label}</span>
      <b className={cn("text-[24px] font-black leading-none tracking-[-0.02em]", tone === "teal" ? "text-[var(--bridge-teal)]" : tone === "amber" ? "text-[#b7791f]" : "text-[var(--primary)]")}>{value}</b>
      {sub ? <span className="text-[12px] text-black/45">{sub}</span> : null}
    </div>
  );
}

/* Admin: referrals — where people came from and what came of it */
export function ReferralsAdmin({ report }: { report: ReferralReport }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [kinds, setKinds] = useState<ReferralEvent["kind"][]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { totals: t } = report;

  const counts = useMemo(() => ({
    all: report.rows.length,
    owed: report.rows.filter((r) => r.cashback.owed > 0).length,
    unpaid: report.rows.filter((r) => r.status === "unpaid").length,
    free: report.rows.filter((r) => r.status === "free").length,
    cash: report.rows.filter((r) => r.status === "cash").length,
  }), [report.rows]);

  const needle = q.trim().toLowerCase();
  const rows = report.rows.filter((r) => {
    if (filter === "owed" && !(r.cashback.owed > 0)) return false;
    if (filter !== "all" && filter !== "owed" && r.status !== filter) return false;
    return !needle || `${r.name} ${r.email} ${r.code} ${r.referees.map((k) => `${k.name} ${k.email}`).join(" ")}`.toLowerCase().includes(needle);
  });
  const events = report.events.filter((e) => (!kinds.length || kinds.includes(e.kind)) && (!needle || `${e.who} ${e.referrer}`.toLowerCase().includes(needle)));

  async function payOut(r: ReferrerRow) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/users/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cashbackPaidOut: true }) });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? "Couldn’t record the cash back.");
      pushToast({ variant: "success", title: "Cash back paid out", description: `${pkr(r.cashback.owed)} handed to ${r.name}.` });
      startTransition(() => router.refresh());
    } catch (e) {
      pushToast({ variant: "error", title: "Update failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5">
      <header className="grid gap-1">
        <span className={cn(kicker, "text-black/40")}>Admin · Referrals</span>
        <h1 className="text-[26px] font-black leading-none tracking-[-0.03em] text-[var(--primary)]">Where people came from</h1>
        <p className="text-[13.5px] text-[var(--on-surface-variant)]">Every member’s referral code, the friends who signed up with it, who joined, and what it earned — fee discounts, free unlocks and cash back.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon="campaign" label="Referrers" value={String(t.referrers)} sub="members whose code was used" />
        <Stat icon="person_add" label="Referred sign-ups" value={String(t.signups)} />
        <Stat icon="how_to_reg" label="Joined" value={String(t.joined)} sub={`${t.conversion}% of sign-ups`} tone="teal" />
        <Stat icon="sell" label="Fee discounts" value={pkr(t.discountGiven)} sub={t.discountPending ? `+ ${pkr(t.discountPending)} pending` : "given on paid fees"} />
        <Stat icon="celebration" label="Free unlocks" value={String(t.freeUnlocks)} sub="reached 5 friends" />
        <Stat icon="currency_exchange" label="Cash back" value={pkr(t.cashbackOwed)} sub={`owed · ${pkr(t.cashbackPaid)} paid of ${pkr(t.cashbackEarned)}`} tone={t.cashbackOwed ? "amber" : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white px-3">
          <MaterialSymbol className="text-[18px] text-black/40" name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a person, email or code" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
          {q ? <button type="button" onClick={() => setQ("")} className="text-black/40" aria-label="Clear"><MaterialSymbol className="text-[17px]" name="close" /></button> : null}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-bold", filter === f.id ? "bg-[var(--primary)] text-white" : "bg-white text-black/60 ring-1 ring-black/10")}>
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* referrers and their friends */}
        <section className="grid gap-2">
          {rows.length ? rows.map((r) => {
            const isOpen = open === r.id;
            return (
              <article key={r.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                <button type="button" onClick={() => setOpen(isOpen ? null : r.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-black/[0.015]" aria-expanded={isOpen}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-black text-white">{r.name.slice(0, 1).toUpperCase()}</span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex flex-wrap items-center gap-2"><b className="truncate text-[14.5px] text-[var(--primary)]">{r.name}</b><span className="rounded-md bg-[#f1f2f3] px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-[0.06em] text-black/60">{r.code || "—"}</span><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", STATUS[r.status].cls)}>{STATUS[r.status].label}</span></span>
                    <span className="truncate text-[12.5px] text-black/45">{r.email} · last activity {day(r.lastActivity)}</span>
                  </span>
                  <span className="grid justify-items-end gap-0.5 text-right">
                    <span className="text-[13px] text-black/60"><b className="text-[var(--bridge-teal)]">{r.joined}</b> joined · {r.invited} signed up</span>
                    <span className="text-[12px] text-black/45">
                      {r.status === "unpaid" ? `${pkr(r.discount)} off · owes ${pkr(r.due)}` : r.status === "free" ? "fee fully covered" : r.status === "cash" ? `${r.discount ? `${pkr(r.discount)} off · ` : ""}cash back ${pkr(r.cashback.earned)}` : "no reward"}
                    </span>
                  </span>
                  <MaterialSymbol className={cn("text-[20px] text-black/30 transition-transform", isOpen && "rotate-180")} name="expand_more" />
                </button>
                {r.cashback.owed > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.05] bg-[#fffaf0] px-4 py-2.5">
                    <span className="text-[13px] text-[#6b4f00]"><b>{pkr(r.cashback.owed)}</b> cash back owed{r.cashback.paidOut ? ` · ${pkr(r.cashback.paidOut)} already paid` : ""}</span>
                    <button type="button" disabled={busy === r.id} onClick={() => void payOut(r)} className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50">{busy === r.id ? "Saving…" : "Mark paid out"}</button>
                  </div>
                ) : null}
                {isOpen ? (
                  <div className="grid gap-1.5 border-t border-black/[0.05] bg-[#fafbfb] p-3">
                    <div className="flex items-center justify-between px-1"><span className={cn(kicker, "text-black/40")}>Friends referred</span><Link href={`/dashboard/trainees/${r.id}`} className="text-[12px] font-bold text-[var(--bridge-teal)]">Open {r.name}’s profile →</Link></div>
                    {r.referees.map((k) => (
                      <div key={k.id} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-white px-3 py-2 ring-1 ring-black/[0.04]">
                        <span className={cn("flex size-8 items-center justify-center rounded-full text-[12px] font-black text-white", k.joinedAt ? "bg-[var(--bridge-teal)]" : "bg-black/20")}>{k.name.slice(0, 1).toUpperCase()}</span>
                        <span className="grid min-w-0 flex-1">
                          <Link href={`/dashboard/trainees/${k.id}`} className="truncate text-[13.5px] font-bold text-[var(--primary)] hover:underline">{k.name}</Link>
                          <span className="truncate text-[12px] text-black/45">{k.email}</span>
                        </span>
                        <span className="grid justify-items-end text-right text-[12px] text-black/50">
                          <span>Signed up {day(k.signedUpAt)}</span>
                          <span>{k.joinedAt ? <>Joined <b className="text-[var(--primary)]">{day(k.joinedAt)}</b></> : <i>not joined yet</i>}</span>
                        </span>
                        {k.reward ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", REWARD[k.reward].cls)}>{REWARD[k.reward].label}</span> : <span className="rounded-full bg-[#fff6d6] px-2 py-0.5 text-[11px] font-bold text-[#6b4f00]">Waiting on fee</span>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          }) : (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-[13.5px] text-black/45">{report.rows.length ? "No one matches." : "No referrals yet — when someone signs up with a member’s code, it shows here."}</p>
          )}
        </section>

        {/* what happened, newest first */}
        <aside className="grid gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between"><b className="text-[15px] text-[var(--primary)]">Activity</b><span className="text-[12px] text-black/40">{events.length} events</span></div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EVENT) as ReferralEvent["kind"][]).map((k) => {
              const on = kinds.includes(k);
              return (
                <button key={k} type="button" onClick={() => setKinds(on ? kinds.filter((x) => x !== k) : [...kinds, k])} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold", on ? "bg-[var(--primary)] text-white" : "bg-[#f1f2f3] text-black/55")}>
                  <MaterialSymbol className="text-[14px]" name={EVENT[k].icon} />{EVENT[k].label}
                </button>
              );
            })}
          </div>
          <ol className="grid max-h-[70vh] gap-0.5 overflow-y-auto pr-1">
            {events.length ? events.map((e, i) => (
              <li key={`${e.at}-${e.kind}-${e.whoId}-${i}`} className="flex gap-2.5 rounded-xl px-1.5 py-2 hover:bg-black/[0.02]">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", EVENT[e.kind].cls)}><MaterialSymbol className="text-[17px]" name={EVENT[e.kind].icon} /></span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="text-[13px] leading-5 text-[var(--on-surface-variant)]">
                    <button type="button" onClick={() => setQ(e.who)} className="font-bold text-[var(--primary)] hover:underline">{e.who}</button> {e.note}
                  </span>
                  <span className="text-[11.5px] text-black/40">{stamp(e.at)}{e.kind !== "free" && e.amount ? ` · ${pkr(e.amount)}` : ""}</span>
                </span>
              </li>
            )) : <li className="py-6 text-center text-[13px] text-black/40">Nothing here yet.</li>}
          </ol>
        </aside>
      </div>
    </div>
  );
}
