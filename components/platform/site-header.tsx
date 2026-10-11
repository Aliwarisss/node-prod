"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { flagship as flagshipInfo } from "@/lib/node-landing-data";
import { exploreHref, exploreLink, menuCounts, menuDomains, menuPopular, menuRoles, menuSkills, menuSubjects } from "@/lib/explore/menu";
import { useFlagship } from "@/components/providers/pricing-provider";
import { flagshipHref, masterclasses, moreToCome, programPath, programsHref } from "@/lib/platform-data";
import { cn } from "@/lib/utils";

import { ProfessorBubble } from "./professor-bubble";
import { Mono } from "./skill-mono";

/* Sections of the home page the header links to (on other pages they become "/#…" links) */
const LINKS = [
  { id: "pricing", label: "Pricing" },
];
const live = programPath.find((p) => p.live);
const upcoming = programPath.filter((p) => !p.live);
/* Node's site header: a floating pill, centred, that contrasts with the section under it
 * (dark over light sections, white over dark ones). Programs opens a panel with the flagship program featured. */
export function SiteHeader() {
  const path = usePathname();
  const plan = useFlagship();
  const home = path === "/";
  const href = (id: string) => (home ? `#${id}` : `/#${id}`);
  const [menu, setMenu] = useState<"programs" | "explore" | "mobile" | null>(null);
  /* a menu's contents are only built once it's first opened (then kept, so it can animate closed) — the closed
     menus were most of every public page's markup and hydration */
  const [seen, setSeen] = useState<{ programs?: true; explore?: true; mobile?: true }>({});
  const toggle = (name: "programs" | "explore" | "mobile") => {
    setSeen((s) => (s[name] ? s : { ...s, [name]: true }));
    setMenu((m) => (m === name ? null : name));
  };
  const [dark, setDark] = useState(true);
  /* who's signed in (if anyone) — so the header offers the dashboard instead of sign-in */
  const [me, setMe] = useState<{ name: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/auth/session").then((r) => r.json()).then((s: { user?: { name?: string | null; email?: string | null } } | null) => {
      if (live && s?.user) setMe({ name: s.user.name || s.user.email || "" });
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  const navRef = useRef<HTMLElement>(null);

  /* contrast: read the background of whatever sits under the header's middle */
  useEffect(() => {
    const isDarkAt = (x: number, y: number) => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (navRef.current?.contains(el)) continue;
        for (let n: Element | null = el; n; n = n.parentElement) {
          const m = getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/);
          if (!m) continue;
          const [r, g, b, a = 1] = m[1].split(",").map((v) => parseFloat(v));
          if (a < 0.5) continue;
          return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
        }
        return false;
      }
      return false;
    };
    const check = () => {
      const bar = navRef.current?.firstElementChild;
      if (!bar) return;
      const r = bar.getBoundingClientRect();
      setDark(!isDarkAt(r.left + r.width / 2, r.top + r.height / 2));
    };
    const first = window.setTimeout(check, 0);
    document.addEventListener("scroll", check, { capture: true, passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.clearTimeout(first);
      document.removeEventListener("scroll", check, { capture: true });
      window.removeEventListener("resize", check);
    };
  }, []);

  /* close menus on outside click / Escape */
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!navRef.current?.contains(e.target as Node)) setMenu(null); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, []);

  const close = () => setMenu(null);
  const gate = (href: string) => (me ? href : `/login?callbackUrl=${encodeURIComponent(href)}`);
  const linkCls = dark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[var(--primary)]/70 hover:text-[var(--primary)] hover:bg-white";
  const pillLink = "flex items-center gap-0.5 rounded-full px-4 py-2 text-[13.5px] font-bold transition-colors";
  /* the programs panel follows the header: dark over light sections, light over dark ones */
  const t = dark
    ? { panel: "border-white/10 bg-[#0b0f15] text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)]", rule: "border-white/[0.07]", band: "bg-white/[0.02]", tile: "border-white/10 bg-white/[0.04]", muted: "text-white/70", faint: "text-white/50", accent: "text-[#4fd1c5]", pill: "border-white/15 text-white/65", rowHover: "hover:border-white/10 hover:bg-white/[0.04]" }
    : { panel: "border-black/[0.06] bg-white text-[#0d1117] shadow-[0_40px_90px_-30px_rgba(13,17,23,0.35)]", rule: "border-black/[0.06]", band: "bg-[#f7f8f9]", tile: "border-black/[0.07] bg-white/80", muted: "text-black/60", faint: "text-black/45", accent: "text-[#007373]", pill: "border-black/10 text-black/55", rowHover: "hover:border-black/[0.06] hover:bg-black/[0.025]" };

  return (
    <nav ref={navRef} data-theme={dark ? "dark" : "light"} className="fixed left-1/2 top-[calc(var(--nb,0px)+12px)] z-[100] w-[min(1040px,calc(100%-24px))] -translate-x-1/2">
      {/* the pill */}
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-full border py-2 pl-3 pr-2 lg:grid lg:grid-cols-[1fr_auto_1fr] backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500",
          dark ? "border-white/10 bg-[#0d1117]/90 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)]" : "border-black/5 bg-white/90 shadow-[0_18px_40px_-28px_rgba(13,17,23,0.35)]",
        )}
      >
        <Link href="/" onClick={close} className="flex w-fit items-center gap-2" aria-label="Node — home">
          <span className={cn("rounded-gem flex size-9 items-center justify-center transition-colors duration-500", dark ? "bg-white" : "bg-[var(--primary)]")}>
            <MaterialSymbol className={cn("text-[20px] transition-colors duration-500", dark ? "text-[var(--primary)]" : "text-white")} name="dataset" />
          </span>
          <span className={cn("font-heading text-[22px] font-black tracking-tight transition-colors duration-500", dark ? "text-white" : "text-[var(--primary)]")}>Node.</span>
        </Link>

        {/* desktop links */}
        <div className={cn("hidden items-center gap-0.5 rounded-full p-1 transition-colors duration-500 lg:flex", dark ? "bg-white/[0.06]" : "bg-black/[0.04]")}>
          <button
            type="button"
            onClick={() => toggle("programs")}
            aria-expanded={menu === "programs"}
            aria-haspopup="true"
            className={cn(pillLink, linkCls, menu === "programs" && (dark ? "bg-white/10 text-white" : "bg-white text-[var(--primary)] shadow-sm"))}
          >
            Programs
            <MaterialSymbol className={cn("text-[17px] transition-transform", menu === "programs" && "rotate-180")} name="expand_more" />
          </button>
          <button
            type="button"
            onClick={() => toggle("explore")}
            aria-expanded={menu === "explore"}
            aria-haspopup="true"
            className={cn(pillLink, linkCls, menu === "explore" && (dark ? "bg-white/10 text-white" : "bg-white text-[var(--primary)] shadow-sm"))}
          >
            Explore
            <MaterialSymbol className={cn("text-[17px] transition-transform", menu === "explore" && "rotate-180")} name="expand_more" />
          </button>
          <Link href="/why" onClick={close} className={cn(pillLink, linkCls, "whitespace-nowrap")}>Why Node</Link>
          {LINKS.map((l) => (
            <a key={l.id} href={href(l.id)} onClick={close} className={cn(pillLink, linkCls)}>{l.label}</a>
          ))}
          <span className="relative">
            <Link href="/professor" onClick={close} className={cn(pillLink, linkCls, "gap-1.5")}>Professor<span className="size-1.5 animate-pulse rounded-full bg-[#e3051b]" title="Coming soon" /></Link>
            <ProfessorBubble className="absolute left-1/2 top-[calc(100%+16px)] hidden -translate-x-1/2 lg:block" suppressed={menu !== null || path === "/professor"} />
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          {me ? (
            /* signed in: straight back to the dashboard */
            <Link href="/dashboard" onClick={close} className="group flex items-center gap-2 rounded-full bg-[var(--electric-pink)] py-1.5 pl-1.5 pr-4 text-[12.5px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25 transition-transform duration-300 hover:scale-[1.03] active:scale-95" title={me.name ? `Signed in as ${me.name}` : "Signed in"}>
              <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-[12px] font-black normal-case">{(me.name || "?").slice(0, 1).toUpperCase()}</span>
              <span className="hidden sm:inline">Go to dashboard</span><span className="sm:hidden">Dashboard</span>
              <MaterialSymbol className="text-[16px] transition-transform group-hover:translate-x-0.5" name="arrow_forward" />
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={close} className={cn("hidden rounded-full px-3 py-2 text-[13.5px] font-bold transition-colors sm:block", linkCls)}>Sign in</Link>
              <Link
                href="/register"
                onClick={close}
                className="rounded-full bg-[var(--electric-pink)] px-5 py-2.5 text-[12.5px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-pink-500/25 transition-transform duration-300 hover:scale-105 active:scale-95"
              >
                Join now
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => toggle("mobile")}
            aria-expanded={menu === "mobile"}
            aria-label="Menu"
            className={cn("flex size-10 items-center justify-center rounded-full transition-colors lg:hidden", dark ? "bg-white/10 text-white" : "bg-black/5 text-[var(--primary)]")}
          >
            <MaterialSymbol className="text-[22px]" name={menu === "mobile" ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <ProfessorBubble className="absolute right-1 top-[calc(100%+12px)] lg:hidden" tail="right" suppressed={menu !== null || path === "/professor"} />

      {/* programs panel — the flagship featured, the path after it, masterclasses and what's still to come.
          It takes the header's theme: dark over light sections, light over dark ones. */}
      <div
        className={cn(
          "absolute left-1/2 top-[calc(100%+12px)] hidden w-[min(980px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[28px] border transition-[opacity,transform,background-color,border-color,color] duration-300 lg:block",
          t.panel,
          menu === "programs" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        style={{ backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,.05)" : "rgba(13,17,23,.06)"} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}
      >
        {seen.programs ? (<>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* the flagship */}
          <div className={cn("relative isolate grid content-between gap-6 overflow-hidden border-r p-7", t.rule)}>
            <span className={cn("absolute -left-16 -top-20 -z-10 size-64 rounded-full blur-3xl", dark ? "bg-[var(--electric-pink)]/35" : "bg-[var(--electric-pink)]/15")} aria-hidden />
            <span className={cn("absolute -bottom-24 right-[-40px] -z-10 size-56 rounded-full blur-3xl", dark ? "bg-[#4fd1c5]/20" : "bg-[#4fd1c5]/25")} aria-hidden />
            <span className="grid gap-3">
              <span className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-2.5 py-1 font-mono text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white"><span className="size-1.5 animate-pulse rounded-full bg-white" />Live now</span>
                <span className={cn("font-mono text-[10px] font-bold uppercase tracking-[0.16em]", t.faint)}>Flagship · {flagshipInfo.kind}</span>
              </span>
              <span className="font-heading text-[40px] font-black uppercase leading-[0.9] tracking-[-0.045em]">Copy, Paste, <span className="text-[var(--electric-pink)]">Go.</span></span>
              <span className={cn("max-w-[34ch] text-[13.5px] leading-6", t.muted)}>{live?.line} One real project, requirements to deployment — no team needed.</span>
              <span className="mt-1 grid grid-cols-3 gap-2">
                {[["30", "days"], ["8", "acts"], ["1", "real app"]].map(([n, l]) => (
                  <span key={l} className={cn("grid rounded-2xl border px-3 py-2.5", t.tile)}><b className="font-heading text-[22px] font-black leading-none">{n}</b><span className={cn("text-[11.5px] font-semibold", t.faint)}>{l}</span></span>
                ))}
              </span>
            </span>
            <span className="grid gap-3">
              <span className="flex items-baseline gap-2"><b className="font-heading text-[24px] font-black">{plan.price}</b><s className={cn("text-[13px]", t.faint)}>{plan.was}</s><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", dark ? "bg-[#4fd1c5]/15 text-[#4fd1c5]" : "bg-[#e6f3f3] text-[#007373]")}>{plan.off}</span></span>
              <span className="flex gap-2">
                <Link href={flagshipHref} onClick={close} className={cn("group flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.06em]", dark ? "bg-white text-[#0b0f15]" : "bg-[#0d1117] text-white")}>Explore<MaterialSymbol className="text-[16px] transition-transform group-hover:translate-x-0.5" name="arrow_forward" /></Link>
                <Link href="/register" onClick={close} className="rounded-full bg-[var(--electric-pink)] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/30">Enroll now</Link>
              </span>
            </span>
          </div>

          {/* the path after it */}
          <div className="grid content-start gap-1 p-5">
            <span className="flex items-baseline justify-between px-2 pb-1">
              <span className={cn("font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]", t.accent)}>The path · coming next</span>
              <span className={cn("text-[11.5px]", t.faint)}>15 days → 6 months</span>
            </span>
            {upcoming.map((p) => (
              <a key={p.id} href={`${programsHref}#${p.id}`} onClick={close} className={cn("group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-transparent px-3 py-2.5 transition-colors", t.rowHover)} style={{ "--c": p.color } as CSSProperties}>
                <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-[var(--c)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] text-[var(--c)]" style={{ background: `color-mix(in srgb, ${p.color} ${dark ? 16 : 14}%, transparent)` }}>
                  <MaterialSymbol className="text-[22px]" name={p.icon} />
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="font-heading text-[15px] font-black uppercase tracking-[-0.02em]">{p.title}</b>
                    <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--c)]" style={{ background: `color-mix(in srgb, ${p.color} 13%, transparent)`, filter: dark ? undefined : "saturate(1.2) brightness(.8)" }}>{p.length}</span>
                  </span>
                  <span className={cn("line-clamp-2 text-[12.5px] leading-[1.45]", t.muted)}>{p.line}</span>
                </span>
                {p.status === "building"
                  ? <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--c)]/40 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--c)]"><span className="size-1.5 animate-pulse rounded-full bg-[var(--c)]" />In the making</span>
                  : <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em]", t.pill)}>Coming soon</span>}
              </a>
            ))}
          </div>
        </div>

        {/* masterclasses, and more to come */}
        <div className={cn("grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] border-t", t.rule, t.band)}>
          <a href={`${programsHref}#${masterclasses.id}`} onClick={close} className={cn("group flex items-center gap-3.5 border-r px-7 py-4 transition-colors", t.rule, dark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]")} style={{ "--c": masterclasses.color } as CSSProperties}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--c)]" style={{ background: `color-mix(in srgb, ${masterclasses.color} 18%, transparent)` }}><MaterialSymbol className="text-[21px]" name={masterclasses.icon} /></span>
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <b className="font-heading text-[14.5px] font-black uppercase tracking-[-0.02em]">{masterclasses.title}</b>
                <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]", dark ? "bg-[#f2b705]/15 text-[#f2b705]" : "bg-[#fff4cc] text-[#8a6500]")}>{masterclasses.kind} · {masterclasses.length}</span>
              </span>
              <span className="flex flex-wrap gap-1.5">{masterclasses.classes.slice(0, 3).map((c) => <span key={c.title} className={cn("rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold", t.pill)}>{c.title} · {c.hours}h</span>)}<span className={cn("px-1 py-0.5 text-[11.5px] font-semibold", t.faint)}>+ many more</span></span>
            </span>
          </a>
          <div className="flex items-center gap-3.5 px-6 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#4fd1c5,#e91e63,#6d48d8)" }}><MaterialSymbol className="text-[19px]" name="auto_awesome" /></span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <b className="text-[13.5px] font-black uppercase tracking-[-0.01em]">{moreToCome.title}</b>
              <span className={cn("text-[12px] leading-5", t.muted)}>{moreToCome.ideas.slice(0, 3).join(" · ")}…</span>
            </span>
            <a href={programsHref} onClick={close} className={cn("flex shrink-0 items-center gap-1 text-[12px] font-black uppercase tracking-[0.06em] transition-all hover:gap-2", t.accent)}>All<MaterialSymbol className="text-[16px]" name="arrow_forward" /></a>
          </div>
        </div>
        </>) : null}
      </div>

      {/* explore panel — a map of computer science: skills, roles, subjects and industries; the explorer is its own page */}
      <div
        className={cn(
          "absolute left-1/2 top-[calc(100%+12px)] hidden w-[min(1060px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[28px] border transition-[opacity,transform,background-color,border-color,color] duration-300 lg:block",
          t.panel,
          menu === "explore" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        style={{ backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,.05)" : "rgba(13,17,23,.06)"} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}
      >
        {seen.explore ? (<>
        <div className={cn("flex items-end justify-between gap-4 border-b px-7 pb-4 pt-6", t.rule)}>
          <span className="grid gap-1">
            <span className="flex items-center gap-2"><span className={cn("font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]", t.accent)}>Node Explorer</span>{me ? null : <span className={cn("flex items-center gap-1 rounded-full border px-2 py-px font-mono text-[9.5px] font-bold uppercase tracking-[0.12em]", t.pill)}><MaterialSymbol className="text-[12px]" name="lock" />Members · free</span>}</span>
            <span className="font-heading text-[26px] font-black uppercase leading-none tracking-[-0.04em]">Explore computer <span className="text-[var(--electric-pink)]">science.</span></span>
          </span>
          <span className="flex gap-2">
            {([["skills", menuCounts.skills, "skills & tools"], ["roles", menuCounts.roles, "roles"], ["subjects", menuCounts.subjects, "subjects"], ["domains", menuCounts.domains, "industries"]] as const).map(([id, n, l]) => (
              <Link key={id} prefetch={false} href={gate(`${exploreHref}?path=${id}`)} onClick={close} className={cn("grid rounded-2xl border px-3.5 py-2 text-right transition-colors", t.tile, dark ? "hover:border-white/25" : "hover:border-black/20")}><b className="font-heading text-[20px] font-black leading-none">{n}</b><span className={cn("text-[11px] font-semibold", t.faint)}>{l}</span></Link>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-[1.1fr_1fr_1.15fr]">
          {/* skills: folders, with a few badges each */}
          <div className={cn("grid content-start gap-0.5 border-r p-4", t.rule)}>
            <span className={cn("px-2 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]", t.faint)}>Skills & tools</span>
            {menuSkills.map((f) => (
              <div key={f.folder} className={cn("group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors", t.rowHover)}>
                <Link prefetch={false} href={gate(`${exploreHref}?path=skills/${f.folder}`)} onClick={close} className="flex min-w-0 flex-1 items-center gap-2.5"><MaterialSymbol className={cn("text-[17px]", t.faint)} name={f.icon} /><span className="truncate text-[13px] font-bold">{f.name}</span></Link>
                <span className="flex -space-x-1">{f.picks.slice(0, 4).map((k) => <Link key={k.id} prefetch={false} href={gate(exploreLink("skill", k.id))} onClick={close} title={k.name} className={cn("rounded-[30%] ring-2 transition-transform hover:z-10 hover:-translate-y-0.5", dark ? "ring-[#0b0f15]" : "ring-white")}><Mono k={{ mono: k.mono ?? "", color: k.color ?? "#555", ink: k.ink }} size={21} /></Link>)}</span>
              </div>
            ))}
            <Link prefetch={false} href={gate(`${exploreHref}?path=stacks`)} onClick={close} className={cn("mt-1 flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12.5px] font-bold", t.accent, t.rowHover)}><MaterialSymbol className="text-[17px]" name="stacks" />Popular stacks →</Link>
          </div>
          {/* roles */}
          <div className={cn("grid content-start gap-0.5 border-r p-4", t.rule)}>
            <span className={cn("px-2 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]", t.faint)}>Roles & careers</span>
            {menuRoles.map((f) => (
              <div key={f.folder} className="grid gap-0.5 rounded-xl px-2 py-1">
                <Link prefetch={false} href={gate(`${exploreHref}?path=roles/${f.folder}`)} onClick={close} className="flex items-center gap-2 hover:underline"><span className="size-2 rounded-full" style={{ background: f.color }} /><b className="text-[13px]">{f.name}</b></Link>
                <span className="flex flex-wrap gap-x-2 pl-4 text-[11.5px]">{f.picks.map((r) => <Link key={r.id} prefetch={false} href={gate(exploreLink("role", r.id))} onClick={close} className={cn("hover:underline", t.muted)}>{r.name}</Link>)}</span>
              </div>
            ))}
          </div>
          {/* subjects, and industries */}
          <div className="grid content-start gap-1 p-4">
            <span className={cn("px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]", t.faint)}>Subjects</span>
            {menuSubjects.map((a) => (
              <div key={a.folder} className="grid gap-1 rounded-xl px-2 py-1" style={{ "--c": a.color } as CSSProperties}>
                <Link prefetch={false} href={gate(`${exploreHref}?path=subjects/${a.folder}`)} onClick={close} className="flex items-center gap-2 hover:underline"><MaterialSymbol className="text-[16px] text-[var(--c)]" name={a.icon} /><b className="text-[13px]">{a.name}</b></Link>
                <span className="flex flex-wrap gap-1 pl-6">{a.picks.map((x) => <Link key={x.id} prefetch={false} href={gate(exploreLink("subject", x.id))} onClick={close} className={cn("rounded-full border px-2 py-px text-[10.5px] font-semibold transition-colors", t.pill, dark ? "hover:border-white/30 hover:text-white" : "hover:border-black/30 hover:text-black")}>{x.name}</Link>)}</span>
              </div>
            ))}
            <span className={cn("px-2 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em]", t.faint)}>Industries</span>
            <span className="flex flex-wrap gap-1 px-2">{menuDomains.map((d) => <Link key={d.id} prefetch={false} href={gate(exploreLink("domain", d.id))} onClick={close} className={cn("rounded-full border px-2 py-px text-[10.5px] font-semibold transition-colors", t.pill, dark ? "hover:border-white/30 hover:text-white" : "hover:border-black/30 hover:text-black")}>{d.name}</Link>)}</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-3 border-t px-7 py-4", t.rule, t.band)}>
          <span className={cn("font-mono text-[10px] font-bold uppercase tracking-[0.14em]", t.faint)}>Popular</span>
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {menuPopular.map((p) => <Link key={p.id} prefetch={false} href={gate(exploreLink(p.kind, p.id))} onClick={close} className={cn("rounded-full border px-3 py-1 text-[12px] font-bold transition-colors", t.pill, dark ? "hover:border-white/30 hover:text-white" : "hover:border-black/30 hover:text-black")}>{p.label}</Link>)}
          </span>
          <Link prefetch={false} href={gate(exploreHref)} onClick={close} className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--electric-pink)] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.06em] text-white shadow-lg shadow-pink-500/25">{me ? "Open the explorer" : "Sign in to explore"}<MaterialSymbol className="text-[16px]" name={me ? "arrow_forward" : "lock_open"} /></Link>
        </div>
        </>) : null}
      </div>

      {/* mobile menu */}
      <div
        className={cn(
          "absolute left-0 top-[calc(100%+10px)] w-full overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-2xl transition-all duration-200 lg:hidden",
          menu === "mobile" ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        {seen.mobile ? <div className="grid gap-1 p-3">
          <Link href={flagshipHref} onClick={close} className="grid gap-1 rounded-2xl bg-[var(--deep-indigo)] p-4 text-white">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#4fd1c5]">Flagship program · live now</span>
            <span className="font-heading text-[18px] font-black uppercase tracking-[-0.02em]">{flagshipInfo.name}</span>
            <span className="flex items-center gap-1 text-[12.5px] font-bold text-white/70">{plan.price} · {plan.off} · explore <MaterialSymbol className="text-[16px]" name="arrow_forward" /></span>
          </Link>
          <div className="grid gap-0.5 rounded-2xl bg-black/[0.03] p-2">
            <span className="px-2 pb-1 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">Coming next</span>
            {upcoming.map((p) => (
              <a key={p.id} href={`${programsHref}#${p.id}`} onClick={close} className="flex items-center gap-2.5 rounded-xl px-2 py-2" style={{ "--c": p.color } as CSSProperties}>
                <MaterialSymbol className="text-[19px] text-[var(--c)]" name={p.icon} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--primary)]">{p.title}</span>
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--c)]">{p.status === "building" ? "In the making" : p.length}</span>
              </a>
            ))}
            <a href={`${programsHref}#${masterclasses.id}`} onClick={close} className="flex items-center gap-2.5 rounded-xl px-2 py-2" style={{ "--c": masterclasses.color } as CSSProperties}>
              <MaterialSymbol className="text-[19px] text-[var(--c)]" name={masterclasses.icon} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--primary)]">{masterclasses.title}</span>
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a6500]">{masterclasses.length}</span>
            </a>
            <span className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[12px] font-semibold text-black/45"><MaterialSymbol className="text-[15px]" name="auto_awesome" />{moreToCome.title}</span>
          </div>
          <a href={programsHref} onClick={close} className="rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">All programs</a>
          <Link href="/why" onClick={close} className="rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">Why Node — our philosophy</Link>
          <Link prefetch={false} href={gate(exploreHref)} onClick={close} className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">Explore computer science<span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] text-black/40">{me ? `${menuCounts.roles} roles` : "Members · free"}</span></Link>
          {LINKS.map((l) => (
            <a key={l.id} href={href(l.id)} onClick={close} className="rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">{l.label}</a>
          ))}
          <Link href="/professor" onClick={close} className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">The Professor<span className="rounded-full bg-[#e3051b] px-1.5 py-px font-mono text-[9px] font-black uppercase tracking-[0.1em] text-white">Soon</span></Link>
          {me
            ? <Link href="/dashboard" onClick={close} className="rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">Go to dashboard</Link>
            : <Link href="/login" onClick={close} className="rounded-xl px-4 py-3 text-[15px] font-bold text-[var(--primary)] hover:bg-black/5">Sign in</Link>}
        </div> : null}
      </div>
    </nav>
  );
}
