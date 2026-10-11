"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { useToast } from "@/components/ui/toast";
import type { DashboardProfile, ProfileStep } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { MaterialSymbol } from "../landing/material-symbol";
import { PollDock } from "../program/poll-dock";
import type { ChecklistSummary } from "./dashboard-types";

/* the setup modal (with Explore's roles and fields) loads only when it opens */
const OnboardingFlow = dynamic(() => import("./onboarding-flow"), { ssr: false });
const FirstRun = dynamic(() => import("./first-run"), { ssr: false });

export type DashboardSection = "overview" | "projects" | "roadmap" | "profile" | "trainees" | "reviews" | "workspace" | "progress" | "kit" | "leaderboard" | "board" | "sessions" | "feed" | "referrals" | "certificates" | "onboarding" | "admin" | "explorer" | "calendar" | "pricing";

type DashboardChromeProps = {
  activeSection: DashboardSection;
  /* page actions, shown in the top bar before the program pill */
  actions?: ReactNode;
  children: ReactNode;
  checklist: ChecklistSummary;
  profile: DashboardProfile;
  user: Session["user"];
};

type NavItem = { section: DashboardSection | null; label: string; icon: string; href: string };

const TITLES: Record<DashboardSection, { title: string; crumb: string }> = {
  overview: { title: "Home", crumb: "Dashboard" },
  roadmap: { title: "My program", crumb: "Learn" },
  profile: { title: "Profile", crumb: "Account" },
  trainees: { title: "Trainees", crumb: "Admin" },
  reviews: { title: "Reviews", crumb: "Admin" },
  workspace: { title: "My workspace", crumb: "Learn" },
  progress: { title: "Progress", crumb: "Program" },
  kit: { title: "Agent kit", crumb: "Learn" },
  leaderboard: { title: "Leaderboard", crumb: "Program" },
  board: { title: "Board", crumb: "Program" },
  feed: { title: "Feed", crumb: "Program" },
  referrals: { title: "Refer & save", crumb: "Account" },
  sessions: { title: "Sessions", crumb: "Admin" },
  projects: { title: "Projects", crumb: "Admin" },
  certificates: { title: "Certificates", crumb: "Admin" },
  onboarding: { title: "Onboarding", crumb: "Admin" },
  admin: { title: "Home", crumb: "Admin" },
  explorer: { title: "Explorer", crumb: "Your roadmap" },
  calendar: { title: "Calendar", crumb: "Live sessions" },
  pricing: { title: "Pricing", crumb: "Admin" },
};

/* The dashboard's frame for trainees and admins: Node's dark sidebar, a quiet top bar, room for the page */
export function DashboardChrome({ activeSection, actions, checklist, children, profile, user }: DashboardChromeProps) {
  const [open, setOpen] = useState(false);
  /* on a day of the program the sidebar folds to an icon rail (wide screens), to give the lesson the room; it can be expanded again */
  const pathname = usePathname();
  const isDay = pathname.startsWith("/dashboard/roadmap/day/");
  const [pref, setPref] = useState<{ path: string; rail: boolean } | null>(null);
  const rail = pref?.path === pathname ? pref.rail : isDay;
  const setRail = (v: boolean) => setPref({ path: pathname, rail: v });
  const isAdmin = (profile.role ?? user.role) === "admin";
  const locked = !isAdmin && profile.paymentStatus !== "paid"; // fee not received yet
  const displayName = profile.name || user.name || "Node trainee";

  /* the onboarding / profile setup: opens by itself once for a new trainee (until they finish or skip it), from
     "Complete your profile", or from anywhere that dispatches "node:setup" (with an optional step) */
  const router = useRouter();

  /* one device at a time: a tab left open here learns it was signed in elsewhere when it's looked at again, or
     within a minute — and goes to sign in, which says why */
  useEffect(() => {
    let gone = false;
    const check = () => {
      if (gone || document.visibilityState !== "visible") return;
      fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).then((s: { user?: unknown; ended?: string } | null) => {
        if (!gone && !s?.user) { gone = true; window.location.href = `/login?${s?.ended ? "ended=elsewhere&" : ""}callbackUrl=${encodeURIComponent(window.location.pathname)}`; }
      }).catch(() => {});
    };
    const t = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);
  const [setup, setSetup] = useState<{ step?: ProfileStep; first?: boolean } | null>(null);
  const openSetup = (step?: ProfileStep) => setSetup({ step });
  const dismissKey = `node:setup-dismissed:${profile.id}`;
  const closeSetup = () => {
    try { sessionStorage.setItem(dismissKey, "1"); } catch { /* no storage */ }
    setSetup(null);
  };
  useEffect(() => {
    const onAsk = (e: Event) => openSetup((e as CustomEvent<{ step?: ProfileStep }>).detail?.step);
    window.addEventListener("node:setup", onAsk);
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(dismissKey) === "1"; } catch { /* no storage */ }
    if (!isAdmin && !profile.onboardingCompleted && !profile.onboardingSkipped && !dismissed) {
      const t = window.setTimeout(() => setSetup({ first: true }), 400); // the first sign-in: the full-screen welcome, after the page has painted
      return () => { window.clearTimeout(t); window.removeEventListener("node:setup", onAsk); };
    }
    return () => window.removeEventListener("node:setup", onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "N";

  /* the sidebar's counts — work waiting for review (admins), work sent back to fix (trainees) — and a trainee's level;
     anything newly earned since the last visit (a badge, a level) gets a moment of celebration */
  type GameSummary = { xp: number; level: number; pct: number; toNext: number; title: string; titleFx?: "shine" | null; ring: string; animated?: boolean; streak?: number; earned: { id: string; name: string; icon: string }[]; reactions?: Reaction[] };
  type Reaction = { id: string; at: string; person: string; role: string; text: string; kind: "approved" | "changes"; artifact: string };
  const [badges, setBadges] = useState<{ reviews: number; fixes: number; openQuestions?: number; game?: GameSummary | null }>({ reviews: 0, fixes: 0 });
  const { pushToast } = useToast();
  useEffect(() => {
    let live = true;
    const celebrate = (g: GameSummary) => {
      try {
        const key = `node:game:${profile.id ?? user.email}`;
        const seen = JSON.parse(localStorage.getItem(key) ?? "null") as { level: number; earned: string[] } | null;
        if (seen) {
          const fresh = g.earned.filter((b) => !seen.earned.includes(b.id));
          fresh.slice(0, 3).forEach((b) => pushToast({ variant: "success", title: `Badge earned: ${b.name}`, description: "See it on your profile." }));
          if (g.level > seen.level) pushToast({ variant: "success", title: `Level ${g.level} — ${g.title}`, description: `${g.xp.toLocaleString("en-US")} XP so far. Keep going.` });
        }
        localStorage.setItem(key, JSON.stringify({ level: g.level, earned: g.earned.map((b) => b.id) }));
        /* the client's reactions to decisions made while they were away */
        const rkey = `node:reactions:${profile.id ?? user.email}`;
        const lastSeen = localStorage.getItem(rkey);
        const fresh = (g.reactions ?? []).filter((r) => lastSeen !== null && r.at > lastSeen);
        fresh.slice(0, 2).forEach((r) => pushToast({ variant: r.kind === "approved" ? "success" : "error", title: `${r.person.split(",")[0]}: “${r.text}”`, description: `${r.kind === "approved" ? "Approved" : "Sent back"} · ${r.artifact}` }));
        const newest = g.reactions?.[0]?.at;
        if (newest && (lastSeen === null || newest > lastSeen)) localStorage.setItem(rkey, newest);
        else if (lastSeen === null) localStorage.setItem(rkey, new Date().toISOString());
      } catch { /* no storage — no celebration */ }
    };
    const load = () => fetch("/api/program/badges").then((r) => (r.ok ? r.json() : null)).then((b) => { if (live && b) { setBadges(b); if (b.game) celebrate(b.game); } }).catch(() => {});
    void load();
    /* pages that change the counts (a review decided, work resubmitted) ask for a refresh */
    window.addEventListener("node:badges", load);
    return () => { live = false; window.removeEventListener("node:badges", load); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const game = badges.game;
  /* work sent back to fix shows on My program, where the submissions are */
  const countOf = (s: DashboardSection | null) => (s === "reviews" || s === "admin" ? badges.reviews : s === "roadmap" && !isAdmin ? badges.fixes : s === "board" && isAdmin ? badges.openQuestions ?? 0 : 0);

  const learn: NavItem[] = [
    { section: "overview", label: isAdmin ? "Overview" : "Home", icon: "space_dashboard", href: "/dashboard" },
    { section: "feed", label: "Feed", icon: "dynamic_feed", href: "/dashboard/feed" },
    { section: "roadmap", label: "My program", icon: "menu_book", href: "/dashboard/roadmap" },
    { section: "calendar", label: "Calendar", icon: "calendar_month", href: "/dashboard/calendar" },
    { section: "kit", label: "Agent kit", icon: "smart_toy", href: "/dashboard/kit" },
    { section: "board", label: "Board", icon: "forum", href: "/dashboard/board" },
    { section: "leaderboard", label: "Leaderboard", icon: "leaderboard", href: "/dashboard/leaderboard" },
    { section: "explorer", label: "Explorer", icon: "travel_explore", href: "/dashboard/explorer" },
    ...(isAdmin ? [] : [{ section: "referrals" as const, label: "Refer & save", icon: "redeem", href: "/dashboard/referrals" }]),
  ];
  /* the profile (with a trainee's progress in it) opens from the avatar or the name at the bottom */
  const onProfile = activeSection === "profile";
  const admin: NavItem[] = [
    { section: "progress", label: "Program stats", icon: "insights", href: "/dashboard/progress" },
    { section: "trainees", label: "Trainees", icon: "group", href: "/dashboard/trainees" },
    { section: "referrals", label: "Referrals", icon: "redeem", href: "/dashboard/referrals" },
    { section: "reviews", label: "Reviews", icon: "rate_review", href: "/dashboard/reviews" },
    { section: "sessions", label: "Sessions", icon: "videocam", href: "/dashboard/sessions" },
    { section: "projects", label: "Projects", icon: "workspaces", href: "/dashboard/projects" },
    { section: "certificates", label: "Certificates", icon: "workspace_premium", href: "/dashboard/certificate" },
    { section: "onboarding", label: "Onboarding", icon: "waving_hand", href: "/dashboard/onboarding" },
    { section: "pricing", label: "Pricing", icon: "sell", href: "/dashboard/pricing" },
  ];
  /* the admin panel: everything admin, in one place with its own menu — the main sidebar keeps one entry for it */
  const panel: { group: string; items: NavItem[] }[] = [
    { group: "Panel", items: [{ section: "admin", label: "Panel home", icon: "admin_panel_settings", href: "/dashboard/admin" }, { section: "overview", label: "Overview", icon: "space_dashboard", href: "/dashboard" }] },
    { group: "People", items: admin.filter((x) => x.section === "trainees" || x.section === "referrals") },
    { group: "Learning", items: admin.filter((x) => x.section === "reviews" || x.section === "sessions" || x.section === "progress" || x.section === "projects") },
    { group: "Set-up", items: admin.filter((x) => x.section === "pricing" || x.section === "certificates" || x.section === "onboarding") },
  ];
  const inPanel = isAdmin && panel.some((g) => g.items.some((x) => x.section === activeSection));
  const explore: NavItem[] = [
    { section: null, label: "All programs", icon: "explore", href: "/programs" },
    { section: null, label: "Node website", icon: "public", href: "/" },
  ];
  const { title, crumb } = activeSection === "referrals" && isAdmin ? { title: "Referrals", crumb: "Admin panel" } : activeSection === "overview" && isAdmin ? { title: "Overview", crumb: "Admin panel" } : { ...TITLES[activeSection], crumb: inPanel ? "Admin panel" : TITLES[activeSection].crumb };

  const navGroup = (label: string, items: NavItem[]) => (
    <div key={label} className="grid gap-1">
      <span className={cn("px-3 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55", rail && "lg:sr-only")}>{label}</span>
      {items.map((item) => {
        const on = item.section === "admin" ? inPanel : item.section === activeSection;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setOpen(false)}
            title={rail ? item.label : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
              rail && "lg:justify-center lg:px-0",
              on ? "bg-white text-[var(--deep-indigo)]" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <MaterialSymbol className={cn("text-[20px]", on ? "text-[var(--electric-pink)]" : "")} name={item.icon} />
            <span className={cn(rail && "lg:sr-only")}>{item.label}</span>
            {countOf(item.section) ? <span title={item.section === "reviews" ? "Waiting for review" : "Sent back to fix"} className={cn("ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--electric-pink)] px-1.5 text-[10.5px] font-black text-white", rail && "lg:absolute lg:right-0.5 lg:top-0.5 lg:ml-0 lg:h-4 lg:min-w-4 lg:px-1 lg:text-[9px]")}>{countOf(item.section)}</span> : null}
            {item.section === "roadmap" && locked ? <MaterialSymbol className={cn("ml-auto text-[16px] text-[#e2b13c]", rail && "lg:absolute lg:right-1 lg:top-1 lg:text-[12px]")} name="lock" /> : null}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-[var(--nb,0px)] z-[130] flex w-[264px] flex-col bg-[var(--deep-indigo)] text-white transition-[transform,width] duration-300 lg:translate-x-0",
          rail && "lg:w-[76px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      >
        <div className={cn("flex items-center justify-between px-5 pb-6 pt-6", rail && "lg:flex-col lg:gap-3 lg:px-0")}>
          <Link href="/" className="flex items-center gap-2.5" title="Node">
            <span className="rounded-gem flex size-9 items-center justify-center bg-white">
              <MaterialSymbol className="text-[20px] text-[var(--primary)]" name="dataset" />
            </span>
            <span className={cn("grid leading-none", rail && "lg:hidden")}>
              <span className="font-heading text-[21px] font-black tracking-tight">Node.</span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#4fd1c5]">{isAdmin ? "Admin" : "Trainee"}</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-white/10 lg:hidden" aria-label="Close menu">
            <MaterialSymbol className="text-[20px]" name="close" />
          </button>
          <button type="button" onClick={() => setRail(!rail)} className="hidden size-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white lg:flex" aria-label={rail ? "Expand the sidebar" : "Collapse the sidebar"} title={rail ? "Expand" : "Collapse"}>
            <MaterialSymbol className="text-[20px]" name={rail ? "left_panel_open" : "left_panel_close"} />
          </button>
        </div>

        <nav className={cn("flex flex-1 flex-col gap-6 overflow-y-auto px-3", rail && "lg:gap-3")}>
          {isAdmin ? navGroup("Admin", [{ section: "admin", label: "Admin panel", icon: "admin_panel_settings", href: "/dashboard/admin" }]) : null}
          {navGroup("Learn", isAdmin ? learn.slice(1) : learn)}
          {navGroup("Explore", explore)}
        </nav>

        {/* profile completion + account */}
        <div className="grid gap-3 p-3">
          {!checklist.isComplete && !isAdmin && !rail ? (
            <button type="button" onClick={() => { setOpen(false); openSetup(checklist.remainingItems[0]?.step); }} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]">
              <span className="flex items-center justify-between text-[12.5px] font-bold">
                Complete your profile <span className="font-mono text-[11px] text-[#4fd1c5]">{checklist.percentage ?? 0}%</span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-[#4fd1c5]" style={{ width: `${checklist.percentage ?? 0}%` }} />
              </span>
              <span className="text-[11px] text-white/45">{checklist.remainingItems.length} left · {checklist.remainingItems.slice(0, 2).map((x) => x.label).join(", ")}{checklist.remainingItems.length > 2 ? "…" : ""}</span>
            </button>
          ) : null}
          <div className={cn("flex items-center gap-3 rounded-2xl p-3 transition-colors", onProfile ? "bg-white/[0.14] ring-1 ring-white/20" : "bg-white/[0.06]", rail && "lg:flex-col lg:gap-2 lg:bg-transparent lg:p-0 lg:ring-0")}>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} aria-label="Your profile" title={game ? `Your profile · Level ${game.level} · ${game.title}` : "Your profile"} className="relative flex size-10 flex-none rounded-xl">
              {game && game.ring !== "transparent" ? <span className="absolute inset-0 overflow-hidden rounded-xl"><span className={cn("absolute -inset-1/4", game.animated && "frame-spin")} style={{ background: game.ring }} /></span> : null}
              <span className={cn("relative flex h-full w-full items-center justify-center rounded-[10px] bg-[var(--electric-pink)] text-[13px] font-black", game && game.ring !== "transparent" && "m-[2px] h-[calc(100%-4px)] w-[calc(100%-4px)]")}>{initials}</span>
              {game ? <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[var(--deep-indigo)] bg-white px-1 text-[9.5px] font-black leading-[13px] text-[var(--deep-indigo)]">{game.level}</span> : null}
            </Link>
            <span className={cn("grid min-w-0 flex-1 leading-tight", rail && "lg:hidden")}>
              <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="truncate text-[14px] font-bold hover:underline" title="Your profile">{displayName}</Link>
              {game ? (
                <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="grid gap-1 pt-0.5" title={`${game.toNext.toLocaleString("en-US")} XP to level ${game.level + 1}`}>
                  <span className="truncate text-[11.5px] text-[#4fd1c5]">Lv {game.level} · <span className={cn(game.titleFx === "shine" && "title-shine")}>{game.title}</span>{game.streak ? <> · <span className="text-[#ffb74d]">🔥{game.streak}</span></> : null}</span>
                  <span className="block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-[#4fd1c5] to-[var(--electric-pink)]" style={{ width: `${game.pct}%` }} /></span>
                </Link>
              ) : <span className="truncate text-[12px] text-white/50">{profile.email ?? user.email}</span>}
            </span>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="flex size-9 flex-none items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <MaterialSymbol className="text-[19px]" name="logout" />
            </button>
          </div>
        </div>
      </aside>
      {open ? <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-[125] bg-black/40 lg:hidden" /> : null}

      {/* main */}
      <div className={cn("transition-[padding] duration-300 lg:pl-[264px]", rail && "lg:pl-[76px]")}>
        <header className="sticky top-[var(--nb,0px)] z-[110] border-b border-black/5 bg-[#f6f7f8]/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button type="button" onClick={() => setOpen(true)} className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm lg:hidden" aria-label="Open menu">
              <MaterialSymbol className="text-[22px]" name="menu" />
            </button>
            <div className="grid leading-tight">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--bridge-teal)]">{crumb}</span>
              <span className="font-heading text-[18px] font-black uppercase tracking-[-0.03em] text-[var(--primary)]">{title}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {actions}
              <Link href="/programs/30-day-agentic-delivery" className="hidden items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-[13px] font-bold text-[var(--primary)] transition-colors hover:border-[var(--primary)] sm:flex">
                <MaterialSymbol className="text-[17px]" name="rocket_launch" />Copy, Paste, Go
              </Link>
            </div>
          </div>
        </header>
        {inPanel ? (
          <div className="grid items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* the admin panel's menu: a sticky card on wide screens, a row of tabs on small ones */}
            <nav aria-label="Admin panel" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:sticky lg:top-[calc(var(--nb,0px)+84px)] lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:rounded-[22px] lg:border lg:border-black/[0.06] lg:bg-white lg:p-3">
              <span className="hidden items-center gap-2 px-2 pt-1 lg:flex"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--deep-indigo)] text-white"><MaterialSymbol className="text-[18px]" name="admin_panel_settings" /></span><span className="grid leading-tight"><b className="text-[14px] text-[var(--primary)]">Admin panel</b><span className="text-[11px] text-black/45">Run the program</span></span></span>
              {panel.map((g) => (
                <div key={g.group} className="flex gap-1 lg:grid lg:gap-0.5">
                  <span className="hidden px-2 pb-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-black/40 lg:block">{g.group}</span>
                  {g.items.map((item) => {
                    const on = item.section === activeSection;
                    return (
                      <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={cn("flex flex-none items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors", on ? "bg-[var(--deep-indigo)] text-white" : "bg-white text-black/60 hover:bg-[#f1f2f3] hover:text-[var(--primary)] lg:bg-transparent")}>
                        <MaterialSymbol className={cn("text-[18px]", on ? "text-[#4fd1c5]" : "text-black/40")} name={item.icon} />{item.label}
                        {countOf(item.section) ? <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--electric-pink)] px-1.5 text-[10.5px] font-black text-white">{countOf(item.section)}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">{children}</main>
          </div>
        ) : <main className="grid grid-cols-[minmax(0,1fr)] gap-5 px-4 py-5 sm:px-6">{children}</main>}
        {/* a session time poll waiting for the trainee's vote floats at the bottom right */}
        {!isAdmin && !locked ? <PollDock /> : null}
        {setup ? (
          setup.first ? <FirstRun profile={profile} onClose={() => { closeSetup(); router.refresh(); }} onSaved={() => router.refresh()} /> : <OnboardingFlow profile={profile} checklist={checklist} startStep={setup.step} onClose={closeSetup} onSaved={() => router.refresh()} />
        ) : null}
      </div>
    </div>
  );
}
