import { MaterialSymbol } from "@/components/landing/material-symbol";
import { methodLabel, money, type FeeStatus } from "@/lib/fee-types";
import { cn } from "@/lib/utils";

/* A trainee's fee, as a statement: the program, the 50% off, referral discounts, what's owed, what's been paid (each
   payment, dated) and the balance — with a bar for how far along it is. Used by the trainee and by admins. */
const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function FeeStatement({ fee, onRemove, busy, compact = false }: { fee: FeeStatus; onRemove?: (id: string) => void; busy?: string | null; compact?: boolean }) {
  const pct = fee.total ? Math.min(100, Math.round((fee.paid / fee.total) * 100)) : 100;
  const line = (label: string, value: string, cls?: string, sub?: string) => (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", cls)}>
      <span className="grid"><span>{label}</span>{sub ? <span className="text-[11.5px] font-normal text-black/45">{sub}</span> : null}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
  return (
    <div className={cn("grid rounded-2xl border border-black/[0.07] bg-white", compact ? "p-4" : "p-5")}>
      <div className="grid divide-y divide-black/[0.06] text-[13.5px] text-[var(--on-surface-variant)]">
        {line("Program", money(fee.full), "", "the full price")}
        {line("50% off", `− ${money(fee.full - fee.fee)}`)}
        {fee.discount ? line("Referral discount", `− ${money(fee.discount)}`, "text-[#0f766e]", `${Math.round(fee.discount / 1000)} friend${fee.discount === 1000 ? "" : "s"} joined`) : null}
        {line("Your fee", fee.total ? money(fee.total) : "Free", "font-bold text-[var(--primary)]")}
        {line("Paid so far", money(fee.paid), "", fee.implied ? "settled before payments were recorded" : `${fee.payments.length} payment${fee.payments.length === 1 ? "" : "s"}`)}
      </div>

      {/* the balance, and how far along */}
      <div className="mt-2 grid gap-2 rounded-xl bg-[#f6f7f8] p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/45">{fee.settled ? "Settled" : "Balance"}</span>
          <b className={cn("font-heading text-[26px] font-black leading-none tracking-[-0.03em]", fee.settled ? "text-[#0f766e]" : fee.paid ? "text-[#a86b00]" : "text-[var(--primary)]")}>
            {fee.settled ? (!fee.total ? "Free" : fee.waived ? "Settled" : "Paid in full") : money(fee.balance)}
          </b>
        </div>
        <span className="h-2 overflow-hidden rounded-full bg-black/[0.08]"><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${fee.settled ? 100 : pct}%`, background: fee.settled ? "#0f766e" : "linear-gradient(90deg,#e91e63,#f2b705)" }} /></span>
        <span className="flex flex-wrap justify-between gap-2 text-[11.5px] text-black/50">
          <span>{fee.settled ? (fee.waived ? `${money(fee.waived)} waived` : "Nothing left to pay") : `${pct}% paid`}</span>
          {fee.over ? <span className="font-semibold text-[#b4123f]">{money(fee.over)} over — to refund or credit</span> : !fee.settled && fee.paid ? <span>{money(fee.paid)} of {money(fee.total)}</span> : null}
        </span>
      </div>

      {/* every payment */}
      {fee.payments.length ? (
        <ol className="mt-3 grid gap-1.5">
          {fee.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-black/[0.05] px-3 py-2 text-[13px]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e7f6ec] text-[#14632f]"><MaterialSymbol className="text-[17px]" name="payments" /></span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <b className="text-[var(--primary)]">{money(p.amount)}</b>
                <span className="truncate text-[11.5px] text-black/50">{day(p.at)} · {methodLabel(p.method)}{p.note ? ` · ${p.note}` : ""}</span>
              </span>
              {onRemove ? (
                <button type="button" disabled={busy === p.id} onClick={() => onRemove(p.id)} aria-label={`Remove the ${money(p.amount)} payment of ${day(p.at)}`} title="Remove — recorded by mistake" className="flex size-8 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/5 hover:text-[#b4123f] disabled:opacity-40"><MaterialSymbol className="text-[18px]" name={busy === p.id ? "progress_activity" : "delete"} /></button>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
