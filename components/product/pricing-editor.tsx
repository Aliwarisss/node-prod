"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { PricingSection } from "@/components/platform/pricing-section";
import { useNow } from "@/components/program/session-card";
import { money, offerFor, type PackageStatus, type PricePackage, type PricingConfig, type Promotion } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/* Admin: the pricing editor — packages (prices, what's in them, how they're shown), promotions (a percentage or an
 * amount off, on some packages or all, for a window of time), and a preview of the pricing section as it will look.
 * Nothing changes on the site until Save. */
const COLORS = ["#e91e63", "#008080", "#6d48d8", "#c49000", "#0284c7", "#0d1117"];
const STATUS: { id: PackageStatus; label: string }[] = [{ id: "open", label: "On sale" }, { id: "soon", label: "Coming soon" }, { id: "hidden", label: "Hidden" }];
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const toLocal = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocal = (s: string) => (s ? new Date(s).toISOString() : null);
const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s.replace(/[^0-9.]/g, "")) || 0)));

const field = "w-full rounded-xl border border-black/10 bg-[#f6f7f8] px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-[var(--bridge-teal)] focus:bg-white";

export function PricingEditor({ initial }: { initial: PricingConfig }) {
  const router = useRouter();
  const now = useNow();
  const [draft, setDraft] = useState<PricingConfig>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [tab, setTab] = useState<"packages" | "promotions" | "preview">("packages");
  const [open, setOpen] = useState<string | null>(initial.packages[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(draft) !== saved;

  const setPkg = (id: string, patch: Partial<PricePackage>) => setDraft((d) => ({ ...d, packages: d.packages.map((p) => (p.id === id ? { ...p, ...patch } : patch.flagship ? { ...p, flagship: false } : p)) }));
  const renamePkg = (id: string, next: string) => setDraft((d) => ({ packages: d.packages.map((p) => (p.id === id ? { ...p, id: next } : p)), promotions: d.promotions.map((x) => ({ ...x, packageIds: x.packageIds.map((k) => (k === id ? next : k)) })) }));
  const movePkg = (i: number, by: number) => setDraft((d) => { const ps = [...d.packages]; const j = i + by; if (j < 0 || j >= ps.length) return d; [ps[i], ps[j]] = [ps[j], ps[i]]; return { ...d, packages: ps }; });
  const dropPkg = (id: string) => setDraft((d) => {
    const ps = d.packages.filter((p) => p.id !== id);
    if (ps.length && !ps.some((p) => p.flagship)) ps[0] = { ...ps[0], flagship: true };
    return { packages: ps, promotions: d.promotions.map((x) => ({ ...x, packageIds: x.packageIds.filter((k) => k !== id) })) };
  });
  const addPkg = () => {
    let n = draft.packages.length + 1, id = `package-${n}`;
    while (draft.packages.some((p) => p.id === id)) id = `package-${++n}`;
    const p: PricePackage = { id, name: "New package", tagline: "", price: null, compareAt: null, currency: draft.packages[0]?.currency ?? "PKR", suffix: "one-time", features: [], badge: "", status: "soon", ctaLabel: "", ctaHref: "/register", featured: false, flagship: !draft.packages.length, color: COLORS[draft.packages.length % COLORS.length] };
    setDraft((d) => ({ ...d, packages: [...d.packages, p] }));
    setOpen(id); setTab("packages");
  };
  const setPromo = (id: string, patch: Partial<Promotion>) => setDraft((d) => ({ ...d, promotions: d.promotions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const addPromo = () => {
    const week = 7 * 24 * 3600 * 1000;
    const p: Promotion = { id: `promo-${Math.random().toString(36).slice(2, 8)}`, label: "Launch offer", kind: "percent", value: 20, packageIds: [], startsAt: null, endsAt: now ? new Date(now + week).toISOString() : null, active: true };
    setDraft((d) => ({ ...d, promotions: [...d.promotions, p] }));
    setTab("promotions");
  };

  const save = async (body: unknown) => {
    setBusy(true); setNote(null);
    const r = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setBusy(false);
    const data = await r?.json().catch(() => null);
    if (!r?.ok) { setNote({ ok: false, text: data?.error ?? "Couldn’t save — try again." }); return; }
    setDraft(data); setSaved(JSON.stringify(data));
    setNote({ ok: true, text: "Saved — the site shows the new pricing now." });
    router.refresh();
  };

  return (
    <div className="grid gap-5">
      {/* the bar: tabs, and save */}
      <div className="sticky top-[calc(var(--nb,0px)+76px)] z-[20] flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/[0.06] bg-white/90 p-2 backdrop-blur-xl">
        <span className="flex gap-1">
          {([["packages", "Packages", draft.packages.length], ["promotions", "Promotions", draft.promotions.length], ["preview", "Preview", null]] as const).map(([id, label, n]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors", tab === id ? "bg-[var(--primary)] text-white" : "text-black/55 hover:bg-black/[0.05]")}>
              {label}{n !== null ? <span className={cn("rounded-full px-1.5 text-[11px]", tab === id ? "bg-white/20" : "bg-black/[0.06]")}>{n}</span> : null}
            </button>
          ))}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {note ? <span role="status" className={cn("text-[12.5px] font-semibold", note.ok ? "text-[#0f766e]" : "text-[#b4123f]")}>{note.text}</span> : dirty ? <span className="text-[12.5px] font-semibold text-[#a86b00]">Unsaved changes</span> : null}
          <button type="button" disabled={!dirty || busy} onClick={() => { setDraft(JSON.parse(saved)); setNote(null); }} className="rounded-full px-3.5 py-2 text-[12.5px] font-bold text-black/55 hover:bg-black/[0.05] disabled:opacity-35">Discard</button>
          <button type="button" disabled={!dirty || busy} onClick={() => save({ ...draft, packages: draft.packages.map((p) => ({ ...p, features: p.features.map((f) => f.trim()).filter(Boolean) })) })} className="flex items-center gap-1.5 rounded-full bg-[#e91e63] px-5 py-2 text-[12.5px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 disabled:opacity-40 disabled:shadow-none">
            <MaterialSymbol className="text-[17px]" name={busy ? "progress_activity" : "cloud_upload"} />{busy ? "Saving" : "Save"}
          </button>
        </span>
      </div>

      {tab === "packages" ? (
        <div className="grid gap-3">
          {draft.packages.map((p, i) => {
            const o = offerFor(p, draft.promotions, now);
            const isOpen = open === p.id;
            return (
              <section key={i} className={cn("overflow-hidden rounded-[22px] border bg-white transition-shadow", isOpen ? "border-black/10 shadow-[0_24px_50px_-36px_rgba(13,17,23,.45)]" : "border-black/[0.06]")}>
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button type="button" onClick={() => setOpen(isOpen ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="grid min-w-0">
                      <b className="flex flex-wrap items-center gap-2 text-[15px] text-[var(--primary)]">{p.name || "Untitled"}
                        {p.flagship ? <Chip tone="pink">Flagship</Chip> : null}{p.featured ? <Chip tone="ink">Big card</Chip> : null}
                        <Chip tone={p.status === "open" ? "green" : p.status === "soon" ? "amber" : "grey"}>{STATUS.find((s) => s.id === p.status)?.label}</Chip>
                      </b>
                      <span className="truncate text-[12.5px] text-black/50">
                        {o.final === null ? "No price yet" : <>{money(o.final, p.currency)}{o.was ? <> · <s>{money(o.was, p.currency)}</s> · {o.offPct}% off</> : null}{o.promo ? <> · <b className="text-[#e91e63]">{o.promo.label}</b></> : null}</>}
                      </span>
                    </span>
                  </button>
                  <span className="flex items-center gap-1">
                    <Icon label="Move up" icon="arrow_upward" disabled={i === 0} onClick={() => movePkg(i, -1)} />
                    <Icon label="Move down" icon="arrow_downward" disabled={i === draft.packages.length - 1} onClick={() => movePkg(i, 1)} />
                    <Icon label={`Delete ${p.name}`} icon="delete" disabled={draft.packages.length === 1} onClick={() => { if (window.confirm(`Delete “${p.name}”? It goes when you save.`)) dropPkg(p.id); }} />
                    <Icon label={isOpen ? "Collapse" : "Edit"} icon={isOpen ? "expand_less" : "edit"} onClick={() => setOpen(isOpen ? null : p.id)} />
                  </span>
                </div>

                {isOpen ? (
                  <div className="grid gap-4 border-t border-black/[0.06] bg-[#fbfbfa] p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                      <L label="Name"><input className={field} value={p.name} maxLength={80} onChange={(e) => setPkg(p.id, { name: e.target.value })} /></L>
                      <L label="Id" hint="in links, e.g. ?interest="><input className={cn(field, "font-mono text-[12.5px]")} value={p.id} onChange={(e) => { const v = slug(e.target.value); if (v && !draft.packages.some((x) => x.id === v && x !== p)) { renamePkg(p.id, v); setOpen(v); } }} /></L>
                    </div>
                    <L label="Tagline"><input className={field} value={p.tagline} maxLength={200} onChange={(e) => setPkg(p.id, { tagline: e.target.value })} /></L>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <L label="Price" hint="empty = not priced yet"><input className={field} inputMode="numeric" value={p.price ?? ""} placeholder="—" onChange={(e) => setPkg(p.id, { price: num(e.target.value) })} /></L>
                      <L label="Full price" hint="shown struck through"><input className={field} inputMode="numeric" value={p.compareAt ?? ""} placeholder="—" onChange={(e) => setPkg(p.id, { compareAt: num(e.target.value) })} /></L>
                      <L label="Currency"><input className={field} value={p.currency} maxLength={8} onChange={(e) => setPkg(p.id, { currency: e.target.value.toUpperCase() })} /></L>
                      <L label="After the price"><input className={field} value={p.suffix} maxLength={40} placeholder="one-time" onChange={(e) => setPkg(p.id, { suffix: e.target.value })} /></L>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <L label="Status" group>
                        <span className="flex rounded-xl border border-black/10 bg-[#f6f7f8] p-1">
                          {STATUS.map((s) => <button key={s.id} type="button" onClick={() => setPkg(p.id, { status: s.id })} className={cn("flex-1 rounded-lg px-2 py-1.5 text-[12px] font-bold transition-colors", p.status === s.id ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/45")}>{s.label}</button>)}
                        </span>
                      </L>
                      <L label="Badge" hint="e.g. Most popular"><input className={field} value={p.badge} maxLength={30} onChange={(e) => setPkg(p.id, { badge: e.target.value })} /></L>
                      <L label="Colour" group>
                        <span className="flex items-center gap-1.5 py-1">
                          {COLORS.map((c) => <button key={c} type="button" aria-label={`Colour ${c}`} onClick={() => setPkg(p.id, { color: c })} className={cn("size-7 rounded-full ring-offset-2 transition-transform hover:scale-110", p.color === c && "ring-2 ring-black/40")} style={{ background: c }} />)}
                          <input type="color" aria-label="Another colour" value={p.color} onChange={(e) => setPkg(p.id, { color: e.target.value })} className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                        </span>
                      </L>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <L label="Button label"><input className={field} value={p.ctaLabel} maxLength={40} placeholder={p.status === "open" ? "Enroll now" : "Tell me when it opens"} onChange={(e) => setPkg(p.id, { ctaLabel: e.target.value })} /></L>
                      <L label="Button link"><input className={field} value={p.ctaHref} maxLength={300} onChange={(e) => setPkg(p.id, { ctaHref: e.target.value })} /></L>
                    </div>
                    <L label="What’s included" hint="one per line">
                      <textarea className={cn(field, "min-h-[120px] resize-y leading-6")} value={p.features.join("\n")} onChange={(e) => setPkg(p.id, { features: e.target.value.split("\n").map((x) => x.replace(/^\s*[-•]\s*/, "")).filter((x, k, all) => x.trim() || k === all.length - 1).slice(0, 20) })} />
                    </L>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <Check on={p.featured} onChange={(v) => setPkg(p.id, { featured: v })} label="Show as the big card" />
                      <Check on={p.flagship} onChange={(v) => v && setPkg(p.id, { flagship: true })} label="Flagship — its price is quoted across the site" />
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
          <button type="button" onClick={addPkg} className="flex items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-black/10 p-4 text-[13.5px] font-bold text-black/50 transition-colors hover:border-[#e91e63]/40 hover:text-[#e91e63]"><MaterialSymbol className="text-[20px]" name="add" />Add a package</button>
        </div>
      ) : null}

      {tab === "promotions" ? (
        <div className="grid gap-3">
          {draft.promotions.length ? null : (
            <div className="grid justify-items-center gap-2 rounded-[22px] border border-black/[0.06] bg-white p-8 text-center">
              <MaterialSymbol className="text-[34px] text-[#e91e63]" name="local_fire_department" />
              <b className="text-[15px] text-[var(--primary)]">No promotions running</b>
              <span className="max-w-[44ch] text-[13px] text-black/50">A promotion takes a percentage or an amount off — on one package or all of them — for as long as you set, with a countdown on the site.</span>
            </div>
          )}
          {draft.promotions.map((x) => {
            const st = !x.active ? ["Paused", "grey"] : x.startsAt && now < Date.parse(x.startsAt) ? ["Scheduled", "amber"] : x.endsAt && now >= Date.parse(x.endsAt) ? ["Ended", "grey"] : ["Running", "green"];
            return (
              <section key={x.id} className="grid gap-4 rounded-[22px] border border-black/[0.06] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><MaterialSymbol className="text-[20px] text-[#e91e63]" name="sell" /><b className="text-[15px] text-[var(--primary)]">{x.label || "Untitled"}</b><Chip tone={st[1] as "grey"}>{st[0]}</Chip></span>
                  <span className="flex items-center gap-2">
                    <Check on={x.active} onChange={(v) => setPromo(x.id, { active: v })} label="Active" />
                    <Icon label={`Delete ${x.label}`} icon="delete" onClick={() => { if (window.confirm(`Delete “${x.label}”? It goes when you save.`)) setDraft((d) => ({ ...d, promotions: d.promotions.filter((y) => y.id !== x.id) })); }} />
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <L label="Label" hint="shown on the site"><input className={field} value={x.label} maxLength={60} onChange={(e) => setPromo(x.id, { label: e.target.value })} /></L>
                  <L label="Discount" group>
                    <span className="flex gap-2">
                      <span className="flex rounded-xl border border-black/10 bg-[#f6f7f8] p-1">
                        {(["percent", "amount"] as const).map((k) => <button key={k} type="button" onClick={() => setPromo(x.id, { kind: k })} className={cn("rounded-lg px-3 py-1.5 text-[12px] font-bold", x.kind === k ? "bg-white text-[var(--primary)] shadow-sm" : "text-black/45")}>{k === "percent" ? "%" : draft.packages[0]?.currency ?? "PKR"}</button>)}
                      </span>
                      <input className={field} inputMode="numeric" value={x.value} onChange={(e) => setPromo(x.id, { value: Math.min(x.kind === "percent" ? 100 : 1e8, num(e.target.value) ?? 0) })} />
                    </span>
                  </L>
                </div>
                <L label="On" group>
                  <span className="flex flex-wrap gap-1.5">
                    <Pill on={!x.packageIds.length} onClick={() => setPromo(x.id, { packageIds: [] })}>Every package</Pill>
                    {draft.packages.map((p) => <Pill key={p.id} on={x.packageIds.includes(p.id)} onClick={() => setPromo(x.id, { packageIds: x.packageIds.includes(p.id) ? x.packageIds.filter((k) => k !== p.id) : [...x.packageIds, p.id] })}>{p.name}</Pill>)}
                  </span>
                </L>
                <div className="grid gap-3 sm:grid-cols-2">
                  <L label="Starts" hint="empty = now"><input type="datetime-local" className={field} value={toLocal(x.startsAt)} onChange={(e) => setPromo(x.id, { startsAt: fromLocal(e.target.value) })} /></L>
                  <L label="Ends" hint="empty = until you stop it"><input type="datetime-local" className={field} value={toLocal(x.endsAt)} onChange={(e) => setPromo(x.id, { endsAt: fromLocal(e.target.value) })} /></L>
                </div>
                <span className="text-[12.5px] text-black/50">
                  {draft.packages.filter((p) => p.price !== null && (!x.packageIds.length || x.packageIds.includes(p.id))).map((p) => { const base = p.price!; const off = x.kind === "percent" ? Math.round((base * x.value) / 100) : Math.min(base, x.value); return `${p.name}: ${money(base, p.currency)} → ${money(base - off, p.currency)}`; }).join(" · ") || "No priced package is in this promotion."}
                </span>
              </section>
            );
          })}
          <button type="button" onClick={addPromo} className="flex items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-black/10 p-4 text-[13.5px] font-bold text-black/50 transition-colors hover:border-[#e91e63]/40 hover:text-[#e91e63]"><MaterialSymbol className="text-[20px]" name="add" />Add a promotion</button>
        </div>
      ) : null}

      {tab === "preview" ? (
        <div className="grid gap-3 rounded-[26px] border border-black/[0.06] bg-[#f3f1ec] p-4 sm:p-8">
          <span className="text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/40">{dirty ? "Preview — not saved yet" : "As it is on the site"}</span>
          <PricingSection config={draft} now={now} />
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" disabled={busy} onClick={() => { if (window.confirm("Put the pricing back to Node’s standard packages, with no promotions? This saves straight away.")) void save({ reset: true }); }} className="text-[12px] font-semibold text-black/40 underline-offset-4 hover:text-black/70 hover:underline">Reset to the standard pricing</button>
      </div>
    </div>
  );
}

/* a field: a <label> round one input; a named group round a set of buttons (a label would name the first button) */
function L({ label, hint, children, group }: { label: string; hint?: string; children: ReactNode; group?: boolean }) {
  const head = <span className="text-[12px] font-semibold text-black/55">{label}{hint ? <span className="font-normal text-black/35"> — {hint}</span> : null}</span>;
  return group ? <div role="group" aria-label={label} className="grid content-start gap-1.5">{head}{children}</div> : <label className="grid content-start gap-1.5">{head}{children}</label>;
}
function Chip({ tone, children }: { tone: "pink" | "ink" | "green" | "amber" | "grey"; children: ReactNode }) {
  const t = { pink: "bg-[#fde7ef] text-[#b4123f]", ink: "bg-[#0d1117] text-white", green: "bg-[#e7f6ec] text-[#14632f]", amber: "bg-[#fff4d6] text-[#8a5a00]", grey: "bg-black/[0.06] text-black/50" }[tone];
  return <span className={cn("rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em]", t)}>{children}</span>;
}
function Icon({ label, icon, onClick, disabled }: { label: string; icon: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex size-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/[0.05] hover:text-[var(--primary)] disabled:opacity-25"><MaterialSymbol className="text-[19px]" name={icon} /></button>;
}
function Check({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2 text-[13px] font-semibold text-black/65">
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-[#0f766e]" : "bg-black/15")}><span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]", on ? "left-[18px]" : "left-0.5")} /></span>{label}
    </button>
  );
}
function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors", on ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-black/10 text-black/55 hover:border-black/25")}>{children}</button>;
}
