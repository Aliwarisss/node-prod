import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import type { getAdminStats } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

type Stats = Awaited<ReturnType<typeof getAdminStats>>;

const card = "rounded-[24px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-40px_rgba(13,17,23,0.35)]";
const kicker = "font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]";
const dots = { backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" };
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const COLORS = ["#e91e63", "#008080", "#6d48d8", "#c49000", "#4fd1c5", "#8f9394"];

/* The admin's overview — real numbers only: trainees, onboarding, goals and the project workspace */
export function AdminOverview({ stats, adminName }: { stats: Stats; adminName: string }) {
  const tiles = [
    { label: "Trainees", value: stats.traineeCount, note: `${stats.paid} paid · ${stats.awaitingFee} awaiting fee`, icon: "group", color: "#e91e63" },
    { label: "New this week", value: stats.newThisWeek, note: "Signed up in the last 7 days", icon: "person_add", color: "#008080" },
    { label: "Onboarded", value: `${stats.onboardedPct}%`, note: `${stats.onboarded} of ${stats.traineeCount} finished setup`, icon: "task_alt", color: "#6d48d8" },
    { label: "Projects", value: stats.productCount, note: `${stats.prdCount} PRDs · ${stats.approvedPrdCount} approved`, icon: "workspaces", color: "#c49000" },
  ];
  const maxGoal = Math.max(1, ...stats.goals.map((g) => g.count));

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] bg-[var(--deep-indigo)] p-7 text-white sm:p-10" style={dots}>
        <div className="pointer-events-none absolute -right-32 -top-40 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(233,30,99,.22),transparent_62%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="grid gap-3">
            <span className={cn(kicker, "text-[#4fd1c5]")}>Admin overview</span>
            <h1 className="font-heading text-[clamp(2rem,4vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.045em]">
              Hello, <span className="text-[var(--electric-pink)]">{adminName.split(/\s+/)[0]}.</span>
            </h1>
            <p className="max-w-[520px] text-[15.5px] leading-7 text-white/65">Who’s joining Node, how far they’ve got with setup, and where the project workspace stands.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/trainees" className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] text-[var(--primary)]">
              <MaterialSymbol className="text-[18px]" name="group" />Trainees
            </Link>
            <Link href="/dashboard/projects" className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] hover:border-white">
              <MaterialSymbol className="text-[18px]" name="workspaces" />Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={cn(card, "grid gap-3 p-6")}>
            <span className="flex items-center justify-between">
              <span className={cn(kicker, "text-[var(--on-surface-variant)]")}>{t.label}</span>
              <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${t.color} 12%, white)`, color: t.color }}>
                <MaterialSymbol className="text-[19px]" name={t.icon} />
              </span>
            </span>
            <span className="font-heading text-[38px] font-black leading-none tracking-[-0.04em] text-[var(--primary)]">{t.value}</span>
            <span className="text-[13px] text-[var(--on-surface-variant)]">{t.note}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={cn(card, "p-6 sm:p-8")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-[20px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Newest trainees</h2>
            <Link href="/dashboard/trainees" className="flex items-center gap-1 text-[13px] font-bold text-[var(--electric-pink)]">See all <MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="rounded-2xl bg-[#f6f7f8] p-6 text-center text-[14px] text-[var(--on-surface-variant)]">No trainees yet. New sign-ups will appear here.</p>
          ) : (
            <ul className="grid">
              {stats.recent.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-t border-black/[0.06] py-3 first:border-t-0">
                  <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-[var(--deep-indigo)] text-[12px] font-black text-white">{(p.name !== "—" ? p.name : p.email).slice(0, 1).toUpperCase()}</span>
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-[14px] font-bold text-[var(--primary)]">{p.name}</span>
                    <span className="truncate text-[12.5px] text-[var(--on-surface-variant)]">{p.email}</span>
                  </span>
                  <span className="hidden truncate text-[13px] text-[var(--on-surface-variant)] sm:block sm:max-w-[180px]">{p.goal || "—"}</span>
                  <span className={cn("rounded-full px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em]", p.paid ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "bg-[#e2b13c]/20 text-[#8a6100]")}>{p.paid ? "Paid" : "Fee pending"}</span>
                  <span className="hidden w-[92px] text-right font-mono text-[11px] text-[var(--on-surface-variant)] md:block">{fmt(p.joined)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn(card, "p-6 sm:p-8")}>
          <h2 className="mb-1 font-heading text-[20px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Why they joined</h2>
          <p className="mb-5 text-[13.5px] text-[var(--on-surface-variant)]">The goal each trainee picked when signing up.</p>
          {stats.goals.length === 0 ? (
            <p className="text-[14px] text-[var(--on-surface-variant)]">No data yet.</p>
          ) : (
            <ul className="grid gap-4">
              {stats.goals.slice(0, 6).map((g, i) => (
                <li key={g.goal} className="grid gap-1.5">
                  <span className="flex justify-between gap-3 text-[13.5px]">
                    <span className="truncate font-semibold text-[var(--primary)]">{g.goal}</span>
                    <span className="font-mono text-[12px] text-[var(--on-surface-variant)]">{g.count}</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#eef0f1]">
                    <span className="block h-full rounded-full" style={{ width: `${(g.count / maxGoal) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={cn(card, "p-6 sm:p-8")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-[20px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">Project workspace</h2>
          <Link href="/dashboard/projects" className="flex items-center gap-1 text-[13px] font-bold text-[var(--electric-pink)]">Open projects <MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link>
        </div>
        {stats.products.length === 0 ? (
          <p className="rounded-2xl bg-[#f6f7f8] p-6 text-center text-[14px] text-[var(--on-surface-variant)]">No projects yet. Create one in Projects.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {stats.products.map((p) => (
              <Link key={p.id} href={`/dashboard/projects?productId=${encodeURIComponent(p.id)}`} className="grid gap-2 rounded-2xl border border-black/[0.06] p-5 transition-colors hover:border-black/15">
                <span className="flex items-center justify-between gap-3">
                  <b className="truncate text-[15.5px] text-[var(--primary)]">{p.title}</b>
                  <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-black/65">{String(p.status)}</span>
                </span>
                {p.summary ? <span className="line-clamp-2 text-[13.5px] text-[var(--on-surface-variant)]">{p.summary}</span> : null}
                <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--on-surface-variant)]">
                  <span>{p.prdCount} PRDs</span><span>{p.approvedPrdCount} approved</span><span>{p.openQuestionCount} open questions</span><span>Updated {fmt(p.updatedAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
