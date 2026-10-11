"use client";

import { useEffect, useRef, useState } from "react";

import { pageSections, type PageSection } from "@/lib/platform-data";

import s from "./platform.module.css";

const DURATION = 900;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

/* Section paging for the landing deck (desktop): one wheel gesture, key press or swipe moves exactly one section,
 * with an eased glide instead of the browser's abrupt CSS snap. Small screens scroll normally.
 * Also: fit (scale a block's content down a little if a short screen can't hold it), reveal on arrival, side rail. */
export function ScrollFx({ sections = pageSections }: { sections?: PageSection[] }) {
  const [active, setActive] = useState(0);
  const goRef = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    const deck = document.querySelector<HTMLElement>(`main.${s.page}`);
    if (!deck) return;
    root.classList.add(s.fx);
    const blocks = sections.map((p) => document.getElementById(p.id)).filter((x): x is HTMLElement => !!x);
    const paged = () => getComputedStyle(deck).overflowY === "auto";
    const scroller = () => (paged() ? deck : document.scrollingElement ?? root);

    let index = 0, anim = 0, busyUntil = 0, lastWheel = 0, landing = 0;

    const fit = () => {
      const on = paged();
      blocks.forEach((b) => {
        const inner = b.querySelector<HTMLElement>("[data-fit]");
        if (!inner) return;
        inner.style.transform = "";
        if (!on) return;
        const cs = getComputedStyle(b);
        const avail = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const need = inner.scrollHeight;
        if (need > avail + 1) inner.style.transform = `scale(${Math.max(0.75, avail / need).toFixed(3)})`;
      });
    };

    const arrive = (i: number) => {
      blocks[i]?.setAttribute("data-in", "");
      setActive(i);
    };

    const nearest = () => {
      const top = scroller().scrollTop;
      let best = 0;
      blocks.forEach((b, i) => { if (Math.abs(b.offsetTop - top) < Math.abs(blocks[best].offsetTop - top)) best = i; });
      return best;
    };

    const go = (i: number) => {
      i = Math.max(0, Math.min(blocks.length - 1, i));
      const el = scroller();
      const from = el.scrollTop, to = blocks[i].offsetTop;
      index = i;
      arrive(i);
      cancelAnimationFrame(anim);
      if (Math.abs(to - from) < 2) return;
      if (!paged()) { blocks[i].scrollIntoView({ behavior: "smooth" }); return; }
      const t0 = performance.now();
      busyUntil = t0 + DURATION + 80;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / DURATION);
        el.scrollTop = from + (to - from) * ease(p);
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
      /* if frames are throttled (background tab), still land exactly on the section */
      window.clearTimeout(landing);
      landing = window.setTimeout(() => { if (index === i) { cancelAnimationFrame(anim); el.scrollTop = to; } }, DURATION + 120);
    };
    goRef.current = go;

    const typing = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']");

    /* one gesture = one section; a trackpad's momentum stream is ignored until it stops */
    const onWheel = (e: WheelEvent) => {
      if (!paged() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      const now = performance.now(), quiet = now - lastWheel > 160;
      lastWheel = now;
      if (now < busyUntil || (!quiet && now < busyUntil + 400)) { busyUntil = Math.max(busyUntil, now); return; }
      if (Math.abs(e.deltaY) < 4) return;
      go(index + (e.deltaY > 0 ? 1 : -1));
    };
    const onKey = (e: KeyboardEvent) => {
      if (!paged() || typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      const d = k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey) ? 1 : k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey) ? -1 : 0;
      if (d) { e.preventDefault(); if (performance.now() >= busyUntil) go(index + d); }
      else if (k === "Home") { e.preventDefault(); go(0); }
      else if (k === "End") { e.preventDefault(); go(blocks.length - 1); }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => { if (paged()) e.preventDefault(); };
    const onTouchEnd = (e: TouchEvent) => {
      if (!paged()) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40 && performance.now() >= busyUntil) go(index + (dy > 0 ? 1 : -1));
    };
    /* same-page links (#catalog, #pricing…) glide too */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const a = (e.target as HTMLElement).closest?.("a[href^='#']");
      if (!a) return;
      const i = blocks.findIndex((b) => `#${b.id}` === a.getAttribute("href"));
      if (i >= 0) { e.preventDefault(); go(i); }
    };
    /* scrollbar drags or small screens: keep the rail and reveals in step; on the deck, settle onto a section */
    let settle = 0;
    const onScroll = () => {
      const i = nearest();
      if (!blocks[i].hasAttribute("data-in")) arrive(i);
      else setActive(i);
      if (!paged()) { index = i; return; }
      window.clearTimeout(settle);
      settle = window.setTimeout(() => { if (performance.now() >= busyUntil && Math.abs(scroller().scrollTop - blocks[nearest()].offsetTop) > 2) go(nearest()); }, 220);
    };
    const onResize = () => {
      fit();
      if (paged()) { cancelAnimationFrame(anim); scroller().scrollTop = blocks[index].offsetTop; }
    };

    fit();
    index = nearest();
    arrive(index);
    document.fonts?.ready.then(fit);
    const late = window.setTimeout(fit, 600);
    const ro = new ResizeObserver(() => fit());
    blocks.forEach((b) => { const inner = b.querySelector("[data-fit]"); if (inner) ro.observe(inner); });

    deck.addEventListener("wheel", onWheel, { passive: false });
    deck.addEventListener("touchstart", onTouchStart, { passive: true });
    deck.addEventListener("touchmove", onTouchMove, { passive: false });
    deck.addEventListener("touchend", onTouchEnd);
    deck.addEventListener("click", onClick);
    deck.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(anim);
      window.clearTimeout(late); window.clearTimeout(settle); window.clearTimeout(landing);
      ro.disconnect();
      deck.removeEventListener("wheel", onWheel);
      deck.removeEventListener("touchstart", onTouchStart);
      deck.removeEventListener("touchmove", onTouchMove);
      deck.removeEventListener("touchend", onTouchEnd);
      deck.removeEventListener("click", onClick);
      deck.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      root.classList.remove(s.fx);
    };
  }, [sections]);

  return (
    <nav className={s.rail} aria-label="Sections">
      {sections.map((p, i) => (
        <a key={p.id} href={`#${p.id}`} onClick={(e) => { e.preventDefault(); goRef.current(i); }} className={i === active ? s.railOn : ""} aria-current={i === active ? "true" : undefined}>
          <span>{p.label}</span>
        </a>
      ))}
    </nav>
  );
}
