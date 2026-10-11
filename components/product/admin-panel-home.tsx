import Link from "next/link";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { cn } from "@/lib/utils";

import { BannerSwitch } from "./banner-switch";

export type PanelStats = {
  trainees: number; paid: number; onboarded: number; joinedWeek: number;
  waiting: number; unanswered: number; upcoming: number; nextSession: string | null;
  certificates: number; referred: number;
};

type Tile = { href: string; icon: string; color: string; title: string; line: string; big?: string; small?: string; alert?: boolean };

/* The admin panel's home: what needs you now, then every tool with its numbers */
export function AdminPanelHome({ stats: s, adminName, banner, bannerDefault }: { stats: PanelStats; adminName: string; banner: { enabled: boolean; message: string }; bannerDefault: string }) {
  const first = adminName.trim().split(/\s+/)[0] || "Admin";
  const now: Tile[] = [
    { href: "/dashboard/reviews", icon: "rate_review", color: "#d81b60", title: "Reviews waiting", line: s.waiting ? "Trainees are waiting on your decision." : "Nothing waiting — all reviewed.", big: String(s.waiting), alert: s.waiting > 0 },
    { href: "/dashboard/board?filter=unanswered", icon: "forum", color: "#0284c7", title: "Unanswered questions", line: s.unanswered ? "Questions on the board with no answer yet." : "Every question has an answer.", big: String(s.unanswered), alert: s.unanswered > 0 },
    { href: "/dashboard/sessions", icon: "videocam", color: "#6d48d8", title: "Upcoming sessions", line: s.nextSession ? `Next: ${s.nextSession}` : "No live session scheduled.", big: String(s.upcoming) },
  ];
  const groups: { name: string; tiles: Tile[] }[] = [
    { name: "People", tiles: [
      { href: "/dashboard/trainees", icon: "group", color: "#007373", title: "Trainees", line: "Accounts, fees, onboarding and grades — confirm payments here.", big: String(s.trainees), small: `${s.paid} paid · ${s.onboarded} onboarded · ${s.joinedWeek} new this week` },
      { href: "/dashboard/referrals", icon: "redeem", color: "#c49000", title: "Referrals", line: "Who referred whom, what’s still owed and cash back to hand over.", big: String(s.referred), small: "joined through a referral" },
    ] },
    { name: "Learning", tiles: [
      { href: "/dashboard/reviews", icon: "rate_review", color: "#d81b60", title: "Reviews", line: "Grade submitted work against its rubric, as the role it reports to.", big: String(s.waiting), small: "waiting" },
      { href: "/dashboard/sessions", icon: "videocam", color: "#6d48d8", title: "Sessions", line: "Schedule live sessions and run the time polls.", big: String(s.upcoming), small: "upcoming" },
      { href: "/dashboard/progress", icon: "insights", color: "#0f766e", title: "Program stats", line: "Where the cohort is, day by day, and where it gets stuck." },
      { href: "/dashboard/projects", icon: "workspaces", color: "#475569", title: "Projects", line: "The practice projects and product roadmaps trainees work on." },
    ] },
    { name: "Set-up", tiles: [
      { href: "/dashboard/pricing", icon: "sell", color: "#e91e63", title: "Pricing", line: "Packages, prices, discounts and promotions — what the site sells and for how much." },
      { href: "/dashboard/certificate", icon: "workspace_premium", color: "#b7791f", title: "Certificates", line: "Preview the certificate, and see, revoke or restore every one issued.", big: String(s.certificates), small: "issued" },
      { href: "/dashboard/onboarding", icon: "waving_hand", color: "#e91e63", title: "Onboarding", line: "Preview the first sign-in exactly as a new trainee sees it." },
      { href: "/dashboard", icon: "space_dashboard", color: "#334155", title: "Overview", line: "The program at a glance — sign-ups, activity and grades." },
    ] },
  ];

  return (
    <div className="grid gap-6">
      <section className="relative grid gap-5 overflow-hidden rounded-[24px] bg-[var(--deep-indigo)] p-6 text-white sm:p-7" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <span className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[var(--electric-pink)] opacity-25 blur-[80px]" />
        <div className="relative grid gap-1">
          <span className="flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4fd1c5]"><MaterialSymbol className="text-[16px]" name="admin_panel_settings" />Admin panel</span>
          <h1 className="font-heading text-[28px] font-black tracking-[-0.03em] sm:text-[34px]">Hi {first} — here’s what needs you.</h1>
        </div>
        <div className="relative grid gap-3 md:grid-cols-3">
          {now.map((x) => (
            <Link key={x.title} href={x.href} className={cn("group grid gap-2 rounded-2xl border p-4 transition-all hover:-translate-y-0.5", x.alert ? "border-white/25 bg-white/[0.12]" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.09]")}>
              <span className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: x.color }}><MaterialSymbol className="text-[19px]" name={x.icon} /></span>
                <span className="flex items-center gap-1.5 font-heading text-[30px] font-black leading-none">{x.alert ? <span className="size-2 animate-pulse rounded-full bg-[var(--electric-pink)]" /> : null}{x.big}</span>
              </span>
              <b className="text-[14px]">{x.title}</b>
              <span className="flex items-center justify-between gap-2 text-[12.5px] text-white/55">{x.line}<MaterialSymbol className="text-[18px] text-white/40 transition-transform group-hover:translate-x-0.5" name="arrow_forward" /></span>
            </Link>
          ))}
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.name} className="grid gap-3">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/45">{g.name}</span>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {g.tiles.map((x) => (
              <Link key={x.title} href={x.href} className="group grid min-w-0 grid-cols-[minmax(0,1fr)] content-between gap-4 rounded-[20px] border border-black/[0.06] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(13,17,23,.45)]">
                <span className="grid gap-3">
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ background: x.color }}><MaterialSymbol className="text-[20px]" name={x.icon} /></span>
                    {x.big !== undefined ? <span className="grid justify-items-end leading-none"><b className="font-heading text-[26px] font-black text-[var(--primary)]">{x.big}</b>{x.small && !x.small.includes("·") ? <span className="pt-1 text-[11px] text-black/45">{x.small}</span> : null}</span> : null}
                  </span>
                  <span className="grid gap-1">
                    <b className="text-[15px] text-[var(--primary)]">{x.title}</b>
                    <span className="text-[12.5px] leading-5 text-black/55">{x.line}</span>
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3 text-[12px] font-semibold text-black/45">
                  <span className="min-w-0 truncate">{x.small?.includes("·") ? x.small : "Open"}</span>
                  <MaterialSymbol className="text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" name="arrow_forward" />
                </span>
              </Link>
            ))}
          </div>
          {g.name === "Set-up" ? <BannerSwitch initial={banner} fallback={bannerDefault} /> : null}
        </section>
      ))}
    </div>
  );
}
