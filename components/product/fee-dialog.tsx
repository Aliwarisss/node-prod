"use client";

import { useState, type FormEvent } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import { money, PAY_METHODS, type FeeStatus, type PayMethod } from "@/lib/fee-types";
import { cn } from "@/lib/utils";

import { FeeStatement } from "./fee-statement";

/* Admin: one trainee's fee — the statement, every payment (remove one recorded by mistake), and recording a new one.
   A payment that clears the balance unlocks their program. */
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const field = "h-11 w-full rounded-[12px] border border-black/10 bg-[#f6f7f8] px-3.5 text-[14.5px] outline-none transition-colors focus:border-[var(--bridge-teal)] focus:bg-white";

export function FeeDialog({ userId, name, initial, onClose, onChanged }: { userId: string; name: string; initial: FeeStatus; onClose: () => void; onChanged: () => void }) {
  const { pushToast } = useToast();
  const [fee, setFee] = useState(initial);
  const [amount, setAmount] = useState(initial.balance ? String(initial.balance) : "");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const n = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const after = Math.max(0, fee.balance - n);

  async function record(e: FormEvent) {
    e.preventDefault();
    if (!n) { setError("Enter the amount received."); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/users/${userId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, method, note, at: new Date(`${date}T12:00:00`).toISOString() }) }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { error?: string; fee?: FeeStatus; unlocked?: boolean } | null;
    setSaving(false);
    if (!res?.ok || !data?.fee) { setError(data?.error ?? "Couldn’t record the payment — try again."); return; }
    setFee(data.fee);
    setAmount(data.fee.balance ? String(data.fee.balance) : ""); setNote("");
    pushToast({ variant: "success", title: `${money(n)} recorded`, description: data.unlocked ? `Paid in full — ${name}’s program is open.` : data.fee.balance ? `${money(data.fee.balance)} still to pay.` : "Recorded." });
    onChanged();
  }

  async function remove(id: string) {
    const p = fee.payments.find((x) => x.id === id);
    if (!p || !window.confirm(`Remove the ${money(p.amount)} payment? Use this only for one recorded by mistake.${fee.settled ? " Their program stays open." : ""}`)) return;
    setRemoving(id);
    const res = await fetch(`/api/admin/users/${userId}/payments/${id}`, { method: "DELETE" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { error?: string; fee?: FeeStatus } | null;
    setRemoving(null);
    if (!res?.ok || !data?.fee) { pushToast({ variant: "error", title: "Couldn’t remove it", description: data?.error ?? "Try again." }); return; }
    setFee(data.fee);
    pushToast({ variant: "success", title: "Payment removed", description: data.fee.settled ? "The record is updated; their program stays open." : `Balance is now ${money(data.fee.balance)}.` });
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${name}’s fee`} onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="grid max-h-[92svh] w-full max-w-[560px] gap-5 overflow-y-auto rounded-[24px] bg-[#fbfbfa] p-6 shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--bridge-teal)]">Fee · cash on delivery</span>
            <h2 className="font-heading text-[24px] font-black uppercase leading-none tracking-[-0.03em] text-[var(--primary)]">{name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button>
        </div>

        <FeeStatement fee={fee} onRemove={(id) => void remove(id)} busy={removing} />

        {!fee.settled ? (
          <form onSubmit={record} className="grid gap-3 rounded-2xl border border-black/[0.07] bg-white p-5">
            <b className="flex items-center gap-2 text-[15px] text-[var(--primary)]"><MaterialSymbol className="text-[19px] text-[#e91e63]" name="add_card" />Record a payment</b>
            {error ? <p role="alert" className="flex items-center gap-2 rounded-[12px] bg-[#fdecf2] px-3.5 py-2.5 text-[13px] font-semibold text-[#b4123f]"><MaterialSymbol className="text-[17px]" name="error" />{error}</p> : null}
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="grid gap-1.5 text-[12.5px] font-bold text-[var(--primary)]">Amount (PKR)
                <input className={field} inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/[^0-9,]/g, "")); setError(""); }} placeholder={String(fee.balance)} autoFocus />
              </label>
              <label className="grid gap-1.5 text-[12.5px] font-bold text-[var(--primary)]">Received on
                <input className={field} type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-1.5" role="group" aria-label="How it was paid">
              <span className="text-[12.5px] font-bold text-[var(--primary)]">How it was paid</span>
              <span className="flex flex-wrap gap-1.5">
                {PAY_METHODS.map(([id, label]) => <button key={id} type="button" aria-pressed={method === id} onClick={() => setMethod(id)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors", method === id ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-black/10 text-black/60 hover:border-black/25")}>{label}</button>)}
              </span>
            </div>
            <label className="grid gap-1.5 text-[12.5px] font-bold text-[var(--primary)]">Note <span className="font-normal text-black/40">— optional, e.g. a receipt number</span>
              <input className={field} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            </label>
            {/* what this payment does */}
            <p className="text-[12.5px] text-black/55">
              {n ? (n >= fee.balance ? <><b className="text-[#0f766e]">This clears the balance</b> — their program unlocks.{n > fee.balance ? ` ${money(n - fee.balance)} over.` : ""}</> : <>Leaves <b className="text-[var(--primary)]">{money(after)}</b> to pay.</>) : `Balance: ${money(fee.balance)}.`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={saving || !n} className="rounded-full bg-[#e91e63] px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 disabled:opacity-50">{saving ? "Recording…" : `Record ${n ? money(n) : "payment"}`}</button>
              {fee.balance && n !== fee.balance ? <button type="button" onClick={() => setAmount(String(fee.balance))} className="rounded-full px-3 py-2 text-[12.5px] font-bold text-black/55 hover:bg-black/5">Full balance</button> : null}
            </div>
          </form>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-[#e7f6ec] px-4 py-3 text-[13px] font-semibold text-[#14632f]"><MaterialSymbol className="text-[18px]" name="check_circle" />Settled — their program is open.</p>
        )}
      </div>
    </div>
  );
}
