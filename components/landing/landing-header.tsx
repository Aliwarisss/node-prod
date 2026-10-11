"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  curriculumTracks,
  mentorCategories,
  navLinks,
  programLinks,
} from "@/lib/node-landing-data";
import { flagshipHref } from "@/lib/platform-data";
import { cn } from "@/lib/utils";

import { MaterialSymbol } from "./material-symbol";

export function LandingHeader() {
  const [openMenu, setOpenMenu] = useState<"Roadmap" | "Mentors" | null>(null);
  const [dark, setDark] = useState(true); // the header is dark over light sections, white over dark ones
  const navRef = useRef<HTMLElement>(null);

  /* contrast with the section underneath: read the background of whatever sits under the header's middle */
  useEffect(() => {
    const isDarkAt = (x: number, y: number) => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (navRef.current?.contains(el)) continue;
        for (let n: Element | null = el; n; n = n.parentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          const m = bg.match(/rgba?\(([^)]+)\)/);
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
      const nav = navRef.current;
      if (!nav) return;
      const r = nav.getBoundingClientRect();
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleMenu(menu: "Roadmap" | "Mentors") {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  return (
    <nav
      ref={navRef}
      data-theme={dark ? "dark" : "light"}
      className={cn(
        "fixed left-1/2 top-3 z-[100] w-[min(1180px,calc(100%-24px))] -translate-x-1/2 rounded-full border backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500",
        dark
          ? "border-white/10 bg-[#0d1117]/90 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)]"
          : "border-black/5 bg-white/90 shadow-[0_18px_40px_-28px_rgba(13,17,23,0.35)]",
      )}
    >
      <div className="flex items-center justify-between py-2 pl-3 pr-2">
        <Link href="/" className="flex items-center gap-2">
          <div className={cn("rounded-gem flex size-9 items-center justify-center transition-colors duration-500", dark ? "bg-white" : "bg-[var(--primary)]")}>
            <MaterialSymbol className={cn("text-[20px] transition-colors duration-500", dark ? "text-[var(--primary)]" : "text-white")} name="dataset" />
          </div>
          <span className={cn("font-heading text-[22px] font-black tracking-tight transition-colors duration-500", dark ? "text-white" : "text-[var(--primary)]")}>
            Node.
          </span>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => {
            const menuLabel =
              link.label === "Roadmap" || link.label === "Mentors"
                ? link.label
                : null;

            return (
              <button
                key={link.label}
                type="button"
                onClick={
                  menuLabel ? () => toggleMenu(menuLabel) : () => setOpenMenu(null)
                }
                aria-expanded={menuLabel ? openMenu === menuLabel : undefined}
                aria-haspopup={menuLabel ? "menu" : undefined}
                className={cn(
                  "flex items-center gap-1 text-[14px] font-bold transition-colors",
                  link.accent
                    ? dark ? "text-[#4fd1c5]" : "text-[var(--bridge-teal)]"
                    : dark ? "text-white/70 hover:text-white" : "text-[color:color-mix(in_srgb,var(--on-surface)_80%,transparent)] hover:text-[var(--bridge-teal)]",
                  menuLabel && openMenu === menuLabel && (dark ? "text-[#4fd1c5]" : "text-[var(--bridge-teal)]"),
                )}
              >
                {link.label}
                {link.icon ? (
                  <MaterialSymbol
                    className={cn(
                      "text-[16px] transition-transform",
                      menuLabel && openMenu === menuLabel && "rotate-180",
                    )}
                    name={link.icon}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href="/login"
            className={cn("hidden text-[14px] font-bold transition-colors hover:text-[var(--electric-pink)] sm:block", dark ? "text-white/85" : "text-[var(--on-surface)]")}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "h-auto rounded-full bg-[var(--electric-pink)] px-5 py-3 text-[12px] font-black tracking-[0.08em] text-white shadow-xl shadow-pink-500/30 transition-transform duration-300 hover:scale-105 hover:bg-[var(--electric-pink)] active:scale-95 sm:px-7 sm:text-[13px]",
            )}
          >
            JOIN NOW
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "absolute left-0 top-[calc(100%+10px)] hidden w-full overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-2xl transition-all duration-200 lg:block",
          openMenu
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        {openMenu === "Roadmap" ? (
          <div className="flex gap-12 px-12 py-10">
            <div className="w-1/2 border-r border-black/5 pr-12">
              <div className="eyebrow mb-8 text-[var(--bridge-teal)]">
                Roadmap_Tracks
              </div>
              <div className="grid gap-6">
                {curriculumTracks.map((track, index) => {
                  const Tag = track.href ? "a" : "div";
                  return (
                  <div key={track.title}>
                    <Tag
                      href={track.href ?? undefined}
                      onClick={() => setOpenMenu(null)}
                      className={cn("group flex items-center justify-between rounded-gem p-4 transition-all", track.href && "hover:bg-[var(--soft-stone)]")}
                    >
                      <div>
                        <div className="font-heading text-[18px] font-black uppercase tracking-tight text-[var(--primary)]">
                          {track.title}
                        </div>
                        <div className="font-mono text-[12px] text-[var(--on-surface-variant)]">
                          {track.subtitle}
                        </div>
                      </div>
                      {track.href ? (
                        <MaterialSymbol
                          className="text-[var(--outline)]/20 transition-colors group-hover:text-[var(--bridge-teal)]"
                          name="arrow_forward"
                        />
                      ) : null}
                    </Tag>
                    {index < curriculumTracks.length - 1 ? (
                      <div className="mt-2 h-px bg-black/5" />
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </div>
            <div className="flex w-1/2 flex-col justify-center gap-6">
              <div className="eyebrow text-[var(--electric-pink)]">The_Full_Outline</div>
              <p className="font-heading text-[28px] font-black uppercase leading-[1.05] tracking-tight text-[var(--primary)]">
                Eight acts. Thirty days. One agent kit.
              </p>
              <p className="text-[15px] leading-7 text-[var(--on-surface-variant)]">
                Four weeks, eight acts and a capstone — one real project, with discovery and delivery side by side.
              </p>
              <div className="flex flex-wrap gap-3">
                {programLinks.roadmap ? (
                  <a
                    href={programLinks.roadmap}
                    onClick={() => setOpenMenu(null)}
                    className="rounded-full bg-[var(--electric-pink)] px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5"
                  >
                    See the full roadmap
                  </a>
                ) : (
                  <a
                    href={flagshipHref}
                    onClick={() => setOpenMenu(null)}
                    className="rounded-full bg-[var(--electric-pink)] px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5"
                  >
                    Explore the program
                  </a>
                )}
                {programLinks.preview ? (
                  <a
                    href={programLinks.preview}
                    onClick={() => setOpenMenu(null)}
                    className="rounded-full border-2 border-[var(--primary)] px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                  >
                    Try Act I free
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {openMenu === "Mentors" ? (
          <div className="px-12 py-10">
            <div className="max-w-[50%] bg-[color:color-mix(in_srgb,var(--soft-stone)_50%,white)] p-12">
              <div className="eyebrow mb-8 text-[var(--electric-pink)]">
                Mentor_Categories
              </div>
              <div className="grid gap-6">
                {mentorCategories.map((category) => (
                  <a
                    key={category.title}
                    href="#"
                    onClick={() => setOpenMenu(null)}
                    className="group flex items-center gap-4 rounded-gem p-4 shadow-sm transition-all hover:bg-white"
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        category.accentClass,
                      )}
                    >
                      <MaterialSymbol name={category.icon} />
                    </div>
                    <div>
                      <div className="text-[16px] font-black text-[var(--primary)]">
                        {category.title}
                      </div>
                      <div className="font-mono text-[11px] uppercase text-[var(--on-surface-variant)]">
                        {category.subtitle}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
