"use client";

import type { FormEvent } from "react";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { TraineeRow } from "@/lib/admin-stats";
import { money } from "@/lib/fee-types";
import { cn } from "@/lib/utils";

import { FeeDialog } from "./fee-dialog";

const FILTERS = [
  { id: "all", label: "Everyone" },
  { id: "pending", label: "Fee pending" },
  { id: "partial", label: "Part paid" },
  { id: "paid", label: "Paid" },
  { id: "admins", label: "Admins" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]";
const badge = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em]";
const inputCls = "h-11 w-full rounded-[12px] border border-black/10 bg-[#f6f7f8] px-3.5 text-[14.5px] outline-none transition-colors focus:border-[var(--bridge-teal)] focus:bg-white";

/* Admin: every account — search, filter, add people, and mark fees received (cash on delivery) */
export function TraineesTable({ rows }: { rows: TraineeRow[] }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feeFor, setFeeFor] = useState<TraineeRow | null>(null);
  const [, startTransition] = useTransition();

  const trainees = rows.filter((r) => r.role !== "admin");
  const counts = useMemo(() => ({
    all: rows.length,
    pending: trainees.filter((r) => !r.paid).length,
    partial: trainees.filter((r) => !r.paid && r.fee.paid > 0).length,
    paid: trainees.filter((r) => r.paid).length,
    admins: rows.length - trainees.length,
  }), [rows, trainees]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "pending" && (r.role === "admin" || r.paid)) return false;
      if (filter === "partial" && (r.role === "admin" || r.paid || !r.fee.paid)) return false;
      if (filter === "paid" && (r.role === "admin" || !r.paid)) return false;
      if (filter === "admins" && r.role !== "admin") return false;
      return !needle || `${r.name} ${r.email} ${r.goal}`.toLowerCase().includes(needle);
    });
  }, [rows, q, filter]);

  async function setPaid(row: TraineeRow, paid: boolean) {
    if (paid && row.fee.paid > 0 && row.fee.balance > 0 && !window.confirm(`${money(row.fee.paid)} of ${money(row.fee.total)} has been paid. Mark it paid anyway and waive the ${money(row.fee.balance)} balance?`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: paid ? "paid" : "unpaid" }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn’t update the payment.");
      pushToast({ variant: "success", title: paid ? "Marked as paid" : "Marked as unpaid", description: paid ? `${row.name !== "—" ? row.name : row.email} can now open their program.${row.fee.balance ? ` The ${money(row.fee.balance)} balance is waived.` : ""}` : "Their program is locked until the fee is received." });
      startTransition(() => router.refresh());
    } catch (e) {
      pushToast({ variant: "error", title: "Update failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function payCashback(row: TraineeRow) {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cashbackPaidOut: true }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn’t record the cash back.");
      pushToast({ variant: "success", title: "Cash back paid out", description: `PKR ${row.cashbackOwed.toLocaleString("en-US")} handed to ${row.name !== "—" ? row.name : row.email}.` });
      startTransition(() => router.refresh());
    } catch (e) {
      pushToast({ variant: "error", title: "Update failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <section className="rounded-[24px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-40px_rgba(13,17,23,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] p-5 sm:p-6">
          <div className="flex flex-wrap gap-1 rounded-full bg-[#f1f2f3] p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors", filter === f.id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/65 hover:text-[var(--primary)]")}
              >
                {f.label}<span className="font-mono text-[11px] text-black/40">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-black/10 bg-[#f6f7f8] px-4 py-2.5 sm:w-[260px] sm:flex-none">
              <MaterialSymbol className="text-[19px] text-black/40" name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or goal" className="w-full bg-transparent text-[14px] outline-none placeholder:text-black/40" aria-label="Search trainees" />
            </label>
            <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-pink-500/25">
              <MaterialSymbol className="text-[18px]" name="person_add" />Add user
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead>
              <tr className={cn(kicker, "text-[var(--on-surface-variant)]")}>
                <th className="px-6 py-3 font-bold">Person</th>
                <th className="px-4 py-3 font-bold">Goal</th>
                <th className="px-4 py-3 font-bold">Account</th>
                <th className="px-4 py-3 font-bold">Grade</th>
                <th className="px-4 py-3 font-bold">Fee · paid · balance</th>
                <th className="px-6 py-3 text-right font-bold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-black/[0.06] text-[14px] transition-colors hover:bg-[#fafbfb]">
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className={cn("flex size-9 flex-none items-center justify-center rounded-xl text-[12px] font-black text-white", r.role === "admin" ? "bg-[var(--electric-pink)]" : "bg-[var(--deep-indigo)]")}>
                        {(r.name !== "—" ? r.name : r.email).slice(0, 1).toUpperCase()}
                      </span>
                      <span className="grid min-w-[180px] leading-tight">
                        <span className="flex items-center gap-2 truncate font-bold text-[var(--primary)]">
                          {r.role === "admin" ? r.name : <Link href={`/dashboard/trainees/${r.id}`} className="hover:underline" title="Open their progress">{r.name}</Link>}
                          {r.role === "admin" ? <span className={cn(badge, "bg-[color:color-mix(in_srgb,var(--electric-pink)_10%,white)] text-[#a3104a]")}>Admin</span> : null}
                        </span>
                        <span className="truncate text-[12.5px] text-[var(--on-surface-variant)]">{r.email}{r.referredBy ? <> · referred by <b className="font-semibold text-[var(--primary)]">{r.referredBy}</b></> : null}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[var(--on-surface-variant)]">{r.goal || "—"}</td>
                  <td className="px-4 py-3.5">
                    {r.passwordPending ? (
                      <span className={cn(badge, "bg-[#f1f2f3] text-black/65")} title="Added by an admin — creates a password at first sign-in"><MaterialSymbol className="text-[13px]" name="schedule" />Awaiting first sign-in</span>
                    ) : (
                      <span className={cn(badge, r.onboarded ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "bg-[#f1f2f3] text-black/65")}>{r.onboarded ? "Active · onboarded" : "Active"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {r.grades.graded ? (
                      <span className="grid gap-0.5 leading-tight" title={`Average of ${r.grades.graded} graded deliverable${r.grades.graded === 1 ? "" : "s"}`}>
                        <span className={cn(badge, "justify-self-start", r.grades.passed === r.grades.graded ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "bg-[#fdecf2] text-[#a3104a]")}>{r.grades.avg}%</span>
                        <span className="text-[11.5px] text-[var(--on-surface-variant)]">{r.grades.passed}/{r.grades.graded} passed{r.grades.waiting ? ` · ${r.grades.waiting} in review` : ""}</span>
                      </span>
                    ) : (
                      <span className="text-[13px] text-[var(--on-surface-variant)]">{r.grades.waiting ? `${r.grades.waiting} in review` : "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {r.role === "admin" ? (
                      <span className="text-[13px] text-[var(--on-surface-variant)]">—</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="grid min-w-[150px] gap-1">
                          <span className="flex items-center gap-1.5">
                            <span className={cn(badge, r.paid ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : r.fee.paid ? "bg-[#fff1d6] text-[#8a5a00]" : "bg-[#e2b13c]/20 text-[#8a6100]")} title={r.paidAt ? `Settled ${fmt(r.paidAt)}` : undefined}>
                              {r.paid ? (r.paidVia === "referrals" && !r.fee.paid ? "Free via referrals" : r.fee.waived ? "Paid · part waived" : "Paid") : r.fee.paid ? "Part paid" : "Pending"}
                            </span>
                            {r.fee.over ? <span className={cn(badge, "bg-[#fdecf2] text-[#b4123f]")} title="Received more than the fee — refund or credit it">+{money(r.fee.over)}</span> : null}
                          </span>
                          {r.paid ? (
                            <span className="text-[11.5px] text-[var(--on-surface-variant)]">{r.fee.total ? (r.fee.implied ? `${money(r.fee.total)} · before tracking` : `${money(r.fee.paid)} of ${money(r.fee.total)}`) : "No fee to pay"}</span>
                          ) : (
                            <>
                              <span className="text-[11.5px] text-[var(--on-surface-variant)]"><b className="text-[var(--primary)]">{money(r.fee.balance)}</b> to go{r.fee.paid ? ` · ${money(r.fee.paid)} of ${money(r.fee.total)} paid` : r.fee.discount ? ` · ${money(r.fee.discount)} off` : ""}</span>
                              <span className="h-1 w-full overflow-hidden rounded-full bg-black/[0.07]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#e91e63,#f2b705)]" style={{ width: `${r.fee.total ? Math.round((r.fee.paid / r.fee.total) * 100) : 0}%` }} /></span>
                            </>
                          )}
                        </span>
                        <button type="button" onClick={() => setFeeFor(r)} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors", r.paid ? "text-black/65 hover:bg-black/5 hover:text-[var(--primary)]" : "bg-[#e91e63] text-white hover:brightness-110")}>
                          <MaterialSymbol className="text-[16px]" name={r.paid ? "receipt_long" : "add_card"} />{r.paid ? `Payments${r.fee.payments.length ? ` (${r.fee.payments.length})` : ""}` : "Record payment"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void setPaid(r, !r.paid)}
                          className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-50", r.paid ? "text-black/65 hover:bg-black/5 hover:text-[var(--primary)]" : "border border-black/15 text-[var(--primary)] hover:bg-black/5")}
                        >
                          {busyId === r.id ? "Saving…" : r.paid ? "Undo" : r.fee.paid ? "Mark paid · waive rest" : "Mark paid"}
                        </button>
                        {r.cashbackOwed > 0 ? (
                          <button type="button" disabled={busyId === r.id} onClick={() => void payCashback(r)} title="Cash back for friends who joined after they paid — mark it handed over" className="rounded-full bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] px-3 py-1.5 text-[12px] font-bold text-[var(--bridge-teal)] disabled:opacity-50">
                            PKR {r.cashbackOwed.toLocaleString("en-US")} cash back · mark paid out
                          </button>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-[12px] text-[var(--on-surface-variant)]">{fmt(r.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 ? <p className="p-10 text-center text-[14px] text-[var(--on-surface-variant)]">No one matches that.</p> : null}
        </div>
      </section>

      {feeFor ? <FeeDialog key={feeFor.id} userId={feeFor.id} name={feeFor.name !== "—" ? feeFor.name : feeFor.email} initial={feeFor.fee} onClose={() => setFeeFor(null)} onChanged={() => startTransition(() => router.refresh())} /> : null}
      {adding ? <AddUserDialog onClose={() => setAdding(false)} onCreated={() => startTransition(() => router.refresh())} /> : null}
    </>
  );
}

/* Add a person: they get no password — they create one the first time they sign in with this email */
function AddUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, role, paid }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error ?? "Couldn’t add this person."); return; }
      setCreated(email.trim().toLowerCase());
      pushToast({ variant: "success", title: "User added", description: "They can now sign in and create their password." });
      onCreated();
    } catch {
      setError("Couldn’t reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add user" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        {created ? (
          <div className="grid gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]"><MaterialSymbol className="text-[26px]" name="check_circle" /></span>
            <h2 className="font-heading text-[24px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">User added</h2>
            <p className="text-[15px] leading-7 text-[var(--on-surface-variant)]">
              Ask them to open the sign-in page and enter <b className="text-[var(--primary)]">{created}</b>. They’ll be asked to create their password, then they’re in.
              {role === "student" && !paid ? " Their program stays locked until you mark their fee as paid." : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setCreated(null); setName(""); setEmail(""); setPaid(false); setRole("student"); }} className="rounded-full border border-black/10 px-5 py-2.5 text-[13.5px] font-bold text-[var(--primary)]">Add another</button>
              <button type="button" onClick={onClose} className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13.5px] font-bold text-white">Done</button>
            </div>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="font-heading text-[24px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Add a user</h2>
                <p className="text-[14px] text-[var(--on-surface-variant)]">They’ll create their own password the first time they sign in.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 flex-none items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button>
            </div>
            {error ? <p className="flex items-center gap-2 rounded-[12px] bg-[color:color-mix(in_srgb,var(--electric-pink)_8%,white)] px-3.5 py-2.5 text-[13.5px] font-semibold text-[var(--electric-pink)]"><MaterialSymbol className="text-[17px]" name="error" />{error}</p> : null}
            <label className="grid gap-1.5 text-[13px] font-bold text-[var(--primary)]">Full name
              <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Full name" autoFocus />
            </label>
            <label className="grid gap-1.5 text-[13px] font-bold text-[var(--primary)]">Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@example.com" />
            </label>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-bold text-[var(--primary)]">Role</span>
              <div className="grid grid-cols-2 gap-2">
                {([["student", "Trainee", "school"], ["admin", "Admin", "admin_panel_settings"]] as const).map(([value, label, icon]) => (
                  <button key={value} type="button" onClick={() => setRole(value)} aria-pressed={role === value} className={cn("flex items-center gap-2 rounded-[12px] border px-3.5 py-3 text-[14px] font-bold transition-colors", role === value ? "border-[var(--primary)] bg-[#f6f7f8] text-[var(--primary)]" : "border-black/10 text-black/65")}>
                    <MaterialSymbol className="text-[19px]" name={icon} />{label}
                  </button>
                ))}
              </div>
            </div>
            {role === "student" ? (
              <label className="flex items-center gap-3 rounded-[12px] border border-black/10 px-3.5 py-3 text-[14px]">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="size-4 accent-[var(--bridge-teal)]" />
                <span className="grid">
                  <span className="font-bold text-[var(--primary)]">Fee already received</span>
                  <span className="text-[12.5px] text-[var(--on-surface-variant)]">Unlocks their program straight away. You can change this later.</span>
                </span>
              </label>
            ) : null}
            <button type="submit" disabled={saving} className="mt-1 rounded-full bg-[var(--electric-pink)] py-3.5 text-[13.5px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-pink-500/25 disabled:opacity-60">
              {saving ? "Adding…" : "Add user"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
