"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { useToast } from "@/components/ui/toast";
import type { CertificateView, IssuedRow } from "@/lib/certificate";
import { cn } from "@/lib/utils";

import { CertificateActions, CertificateCenter } from "./certificate-center";

const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SAMPLES = [["Short", "Ali Raza"], ["Typical", "Ojlal Ahmed"], ["Long", "Muhammad Abdullah Rehman Khan"], ["Very long", "Syeda Fatima Zahra Batool Naqvi Hussaini"]] as const;
const STATES = [["designer", "Designer", "tune"], ["locked", "Not finished", "lock"], ["claim", "Ready to claim", "how_to_reg"], ["issued", "Issued", "workspace_premium"]] as const;
type View = (typeof STATES)[number][0];

/* Admin: the certificate, to see and test every way it looks — and every certificate issued so far */
export function CertificateAdmin({ issued, origin, adminName }: { issued: IssuedRow[]; origin: string; adminName: string }) {
  const [tab, setTab] = useState<"preview" | "issued">("preview");
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className={cn(kicker, "text-[var(--bridge-teal)]")}>Admin · certificates</span>
          <h1 className="text-[24px] font-bold text-[var(--primary)]">Copy, Paste, Go certificate</h1>
          <p className="max-w-2xl text-[13.5px] text-black/55">Trainees claim theirs when they finish Day 30. Preview it here with any name — nothing you do in the preview is issued.</p>
        </div>
        <nav className="flex gap-1 rounded-full bg-[#eceef0] p-1" role="tablist">
          {([["preview", "Preview & test", "visibility"], ["issued", `Issued · ${issued.length}`, "fact_check"]] as const).map(([id, label, icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors", tab === id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/55 hover:text-[var(--primary)]")}>
              <MaterialSymbol className="text-[17px]" name={icon} />{label}
            </button>
          ))}
        </nav>
      </header>
      {tab === "preview" ? <Preview origin={origin} adminName={adminName} /> : <Issued rows={issued} origin={origin} />}
    </div>
  );
}

/* the preview: a designer (any name, any date — download and print it) and the trainee's own screens, in each state */
function Preview({ origin, adminName }: { origin: string; adminName: string }) {
  const [view, setView] = useState<View>("designer");
  const [name, setName] = useState(adminName || "Ojlal Ahmed");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const sample: CertificateView = useMemo(() => ({ number: "NODE-CPG-0000-PREVIEW", name: name.trim() || "Your name", program: "Copy, Paste, Go", issuedAt: new Date(`${date}T12:00:00`).toISOString(), revoked: false }), [name, date]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(kicker, "text-[9.5px] text-black/40")}>Show</span>
        {STATES.map(([id, label, icon]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ring-1 transition-colors", view === id ? "bg-[var(--deep-indigo)] text-white ring-[var(--deep-indigo)]" : "bg-white text-[var(--primary)] ring-black/10 hover:ring-black/30")}>
            <MaterialSymbol className="text-[16px]" name={icon} />{label}
          </button>
        ))}
        {view !== "designer" ? <span className="text-[12px] text-black/45">— the trainee’s page, exactly as they see it{view === "claim" ? " (claiming here is acted out, not issued)" : ""}</span> : null}
      </div>

      {view === "designer" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <CertificateActions cert={sample} origin={origin} />
          <aside className="grid gap-4 rounded-[22px] border border-black/[0.06] bg-white p-5 xl:sticky xl:top-20">
            <span className={cn(kicker, "text-black/45")}>Try it</span>
            <label className="grid gap-1.5">
              <span className="text-[12.5px] font-semibold text-[var(--primary)]">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-10 rounded-xl border border-black/10 px-3 text-[14px] outline-none focus:border-[var(--bridge-teal)]" />
            </label>
            <div className="grid gap-1.5">
              <span className="text-[12.5px] font-semibold text-[var(--primary)]">Name lengths</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map(([label, n]) => <button key={label} type="button" onClick={() => setName(n)} title={n} className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1", name === n ? "bg-[var(--primary)] text-white ring-[var(--primary)]" : "text-black/60 ring-black/10 hover:ring-black/30")}>{label}</button>)}
              </div>
            </div>
            <label className="grid gap-1.5">
              <span className="text-[12.5px] font-semibold text-[var(--primary)]">Issue date</span>
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 rounded-xl border border-black/10 px-3 text-[14px] outline-none focus:border-[var(--bridge-teal)]" />
            </label>
            <p className="rounded-xl bg-[#f6f7f8] px-3 py-2.5 text-[12px] leading-5 text-black/55"><b className="text-[var(--primary)]">Preview only.</b> The number is a placeholder and the verify link won’t find it — real numbers are made when a trainee claims theirs.</p>
          </aside>
        </div>
      ) : (
        <div key={view}>
          <CertificateCenter
            preview
            embedded
            name={name}
            origin={origin}
            totalDays={31}
            status={view === "locked" ? { eligible: false, daysDone: 12, certificate: null } : view === "claim" ? { eligible: true, daysDone: 31, certificate: null } : { eligible: true, daysDone: 31, certificate: sample }}
          />
        </div>
      )}
    </div>
  );
}

/* every certificate issued: whose, the number, when — check it, or withdraw it */
function Issued({ rows: initial, origin }: { rows: IssuedRow[]; origin: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const shown = rows.filter((r) => !q || `${r.name} ${r.email} ${r.number}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = async (r: IssuedRow) => {
    if (!r.revoked && !window.confirm(`Withdraw ${r.name}'s certificate ${r.number}? Its verify page will say it's been withdrawn.`)) return;
    setBusy(r.number);
    const res = await fetch(`/api/admin/certificates/${r.number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revoked: !r.revoked }) });
    setBusy(null);
    if (!res.ok) { pushToast({ variant: "error", title: "Not changed", description: "Try again in a moment." }); return; }
    setRows((all) => all.map((x) => (x.number === r.number ? { ...x, revoked: !r.revoked } : x)));
    pushToast({ variant: "success", title: r.revoked ? "Certificate restored" : "Certificate withdrawn", description: r.number });
    router.refresh();
  };

  if (!rows.length) {
    return (
      <section className="grid justify-items-center gap-2 rounded-[22px] border border-black/[0.06] bg-white p-10 text-center">
        <MaterialSymbol className="text-[34px] text-black/25" name="workspace_premium" />
        <b className="text-[16px] text-[var(--primary)]">No certificates issued yet</b>
        <p className="max-w-md text-[13.5px] text-black/55">They appear here as trainees finish Day 30 and claim theirs.</p>
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-3">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-[#f6f7f8] px-3 py-2"><MaterialSymbol className="text-[18px] text-black/40" name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or number" className="w-full bg-transparent text-[13px] outline-none" /></label>
        <span className="text-[12px] text-black/45">{rows.filter((r) => !r.revoked).length} valid · {rows.filter((r) => r.revoked).length} withdrawn</span>
      </div>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_120px_110px_210px] gap-3 border-b border-black/[0.06] bg-[#fafafa] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40 md:grid">
        <span>Trainee</span><span>Number</span><span>Issued</span><span>Status</span><span />
      </div>
      <ul>
        {shown.map((r) => (
          <li key={r.number} className="grid items-center gap-x-3 gap-y-1 border-b border-black/[0.05] px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_120px_110px_210px]">
            <span className="grid min-w-0 leading-tight"><b className="truncate text-[13.5px] text-[var(--primary)]">{r.name}</b><span className="truncate text-[12px] text-black/45">{r.email}</span></span>
            <span className="font-mono text-[12px] text-black/60">{r.number}</span>
            <span className="text-[12.5px] text-black/55">{fmtDate(r.issuedAt)}</span>
            <span><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", r.revoked ? "bg-[#fdecf2] text-[#8a0f3f]" : "bg-[#e6f3f3] text-[#005a5a]")}>{r.revoked ? "Withdrawn" : "Valid"}</span></span>
            <span className="flex items-center gap-1.5 md:justify-end">
              <a href={`${origin}/certificate/${r.number}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold text-[var(--bridge-teal)] hover:bg-[#e6f3f3]"><MaterialSymbol className="text-[15px]" name="open_in_new" />View</a>
              <button type="button" onClick={() => void toggle(r)} disabled={busy === r.number} className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 disabled:opacity-50", r.revoked ? "text-[var(--primary)] ring-black/15 hover:ring-black/40" : "text-[#a3104a] ring-[#a3104a]/30 hover:bg-[#fdecf2]")}>{r.revoked ? "Restore" : "Withdraw"}</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
