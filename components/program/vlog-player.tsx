"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { applyCommunity } from "@/lib/program/book/community";
import type { ReelItem } from "@/lib/program/book/reel";
import type { BookLang } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

import { CommunityPanel, type CommunityData } from "./vlog-community";

/* The vlog: one continuous programme made of curated pieces — talk clips, article cards and the book's own sections —
   in Discover's order. Our own player drives YouTube's (its controls hidden): one seek bar across the whole programme,
   the playlist on the right, show notes below that jump to any moment. Cards stay on screen for a set time. */

/* ---- the slice of the YouTube IFrame API we use ---- */
type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  cueVideoById(o: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number; getPlayerState(): number; getVideoData(): { video_id?: string };
  mute(): void; unMute(): void; isMuted(): boolean; setPlaybackRate(r: number): void; destroy(): void;
};
type YTNamespace = { Player: new (el: HTMLElement, o: object) => YTPlayer; PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number } };
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }
function loadYT(): Promise<YTNamespace> {
  return new Promise((ok) => {
    if (window.YT?.Player) return ok(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); ok(window.YT!); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; document.head.appendChild(s);
    }
  });
}

const T = {
  en: { programme: "The programme", nowPlaying: "Now playing", upNext: "Up next", clip: "Clip", article: "Article", book: "From the book", title: "Topic", openArticle: "Open the article", readBook: "Read it in the book", showNotes: "Show notes", play: "Play", pause: "Pause", prev: "Previous", next: "Next", mute: "Mute", unmute: "Unmute", speed: "Speed", full: "Full screen", items: (n: number, m: number) => `${n} pieces · ${Math.floor(m / 60)} h ${m % 60} min`, legend: { video: "Talk clip", article: "Article", book: "The book", sub: "Subtopic", title: "Topic" }, onScreen: (s: number) => `on screen for ${s}s`, start: "Start the programme", answers: "This subtopic answers", subtopic: "Subtopic", more: "...more", less: "Show less" },
  ur: { programme: "Programme", nowPlaying: "Ab chal raha", upNext: "Agla", clip: "Clip", article: "Article", book: "Kitaab se", title: "Topic", openArticle: "Article kholein", readBook: "Kitaab mein parhein", showNotes: "Show notes", play: "Chalayein", pause: "Rokein", prev: "Pichhla", next: "Agla", mute: "Awaaz band", unmute: "Awaaz kholein", speed: "Raftaar", full: "Poori screen", items: (n: number, m: number) => `${n} hisse · ${Math.floor(m / 60)} ghante ${m % 60} min`, legend: { video: "Talk clip", article: "Article", book: "Kitaab", sub: "Subtopic", title: "Topic" }, onScreen: (s: number) => `${s}s screen par`, start: "Programme shuru karein", answers: "Yeh subtopic in sawalon ka jawab deta hai", subtopic: "Subtopic", more: "...mazeed", less: "Kam dikhayein" },
} as const;
const KIND_COLOR = { video: "#d81b60", article: "#0f766e", book: "#c2410c", sub: "#7c3aed", title: "#475569", slot: "#475569" } as const;
const KIND_ICON = { video: "smart_display", article: "article", book: "menu_book", sub: "bookmark", title: "flag", slot: "add_link" } as const;
const clock = (s: number) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };

export function VlogPlayer({ base, community, me, isAdmin, bookId, lang, color, bookPath, title, intro }: { base: ReelItem[]; community: CommunityData; me: string; isAdmin: boolean; bookId: string; lang: BookLang; color: string; bookPath: string; title: string; intro: string }) {
  const [data, setData] = useState(community);
  const [picks, setPicks] = useState<Record<string, string>>({});
  /* the running order with everyone's links applied — the most-voted option of each slot plays, unless you picked one */
  const items = useMemo(() => applyCommunity(base, data.links, data.curated, lang, picks).filter((x) => x.dur > 0), [base, data, lang, picks]);
  const panel = (cur: ReelItem) => <CommunityPanel cur={cur} base={base} data={data} me={me} isAdmin={isAdmin} bookId={bookId} lang={lang} color={color} onData={setData} onPick={(slot, id) => setPicks((p) => ({ ...p, [slot]: id }))} />;
  return <Programme items={items} lang={lang} color={color} bookPath={bookPath} title={title} intro={intro} panel={panel} />;
}

function Programme({ items, lang, color, bookPath, title, intro, panel }: { items: ReelItem[]; lang: BookLang; color: string; bookPath: string; title: string; intro: string; panel: (cur: ReelItem) => React.ReactNode }) {
  const ui = T[lang];
  /* the programme's shape: computed when the running order changes, not on every tick of the clock */
  const { offsets, total, chapters, topics } = useMemo(() => {
    const offsets = items.reduce<number[]>((a, it, k) => { a.push(k ? a[k - 1] + items[k - 1].dur : 0); return a; }, []);
    const total = items.length ? offsets[items.length - 1] + items[items.length - 1].dur : 0;
    /* chapters for the seek bar: one per subtopic (and one per topic title) */
    const chapters: { from: number; to: number }[] = [];
    items.forEach((it, k) => { const prev = items[k - 1]; const same = prev && (prev.section?.id ?? `t:${prev.topic}`) === (it.section?.id ?? `t:${it.topic}`) && it.kind !== "title" && it.kind !== "sub"; if (same) chapters[chapters.length - 1].to = k; else chapters.push({ from: k, to: k }); });
    const topics = [...new Map(items.map((x, k) => [x.topic, { topic: x.topic, title: x.topicTitle, at: offsets[k] }])).values()];
    return { offsets, total, chapters, topics };
  }, [items]);
  const [i, setI] = useState(0);
  const [t, setT] = useState(0); // seconds into the current piece
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [hover, setHover] = useState<{ x: number; s: number } | null>(null);
  const [more, setMore] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const st = useRef({ i: 0, t: 0, playing: false, key: items[0]?.key ?? "", vid: "" }); // what the intervals read
  const list = useRef<HTMLOListElement>(null);
  const jumpRef = useRef<(n: number, offset?: number, play?: boolean) => void>(() => {});
  const cur = items[i];

  /* the running order as it is now, for the player's callbacks (they outlive renders) */
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  /* the player, once. Its methods only exist after onReady, so it isn't handed to the rest of the component until then;
     on ready it loads whatever piece we're on (a seek or a click may already have moved us). */
  useEffect(() => {
    let alive = true;
    let made: { destroy?: () => void } | null = null;
    const first = items.find((x) => x.video);
    void loadYT().then((YT) => {
      if (!alive || !host.current) return;
      const el = document.createElement("div");
      host.current.appendChild(el);
      made = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "100%", height: "100%",
        videoId: first?.video?.id,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3, fs: 0, cc_load_policy: 0, start: first?.video?.start },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (!alive) return;
            yt.current = e.target;
            setReady(true);
            const s = st.current;
            if (itemsRef.current[s.i]?.video) jumpRef.current(s.i, s.t, s.playing);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED && itemsRef.current[st.current.i]?.kind === "video" && st.current.playing) jumpRef.current(st.current.i + 1, 0, true);
          },
        },
      });
    });
    return () => { alive = false; yt.current = null; if (made && typeof made.destroy === "function") made.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* move to a piece (and a moment inside it) */
  const jump = useCallback((n: number, offset = 0, play = st.current.playing) => {
    if (n >= items.length) { st.current.playing = false; setPlaying(false); yt.current?.pauseVideo(); return; }
    const k = Math.max(0, n), it = items[k];
    st.current = { i: k, t: offset, playing: play, key: it.key, vid: it.video ? `${it.video.id}:${it.video.start}` : "" };
    setI(k); setT(offset); setPlaying(play);
    const p = yt.current;
    if (it.video && p) {
      const o = { videoId: it.video.id, startSeconds: it.video.start + offset, endSeconds: it.video.end };
      if (play) p.loadVideoById(o); else p.cueVideoById(o);
    } else p?.pauseVideo();
    list.current?.querySelector(`[data-k="${k}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [items]);
  useEffect(() => { jumpRef.current = jump; }, [jump]);
  /* stable handlers for the memoised parts (they never change, so those parts don't re-render with the clock) */
  const onJump = useCallback((k: number, play?: boolean) => jumpRef.current(k, 0, play), []);
  const sig = items.map((x) => `${x.key}|${x.video ? `${x.video.id}:${x.video.start}` : ""}`).join(",");
  useEffect(() => {
    const s = st.current;
    const n = items.findIndex((x) => x.key === s.key);
    if (n < 0) { if (s.i >= items.length) jump(items.length - 1, 0, false); return; }
    const it = items[n], vid = it.video ? `${it.video.id}:${it.video.start}` : "";
    if (vid !== s.vid) jump(n, 0, s.playing); // what plays here changed: start the new choice
    else if (n !== s.i) { s.i = n; setI(n); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  const seek = (s: number) => { const s2 = Math.max(0, Math.min(total - 0.1, s)); let n = offsets.findIndex((o, j) => s2 >= o && s2 < o + items[j].dur); if (n < 0) n = items.length - 1; jump(n, s2 - offsets[n]); };
  const toggle = () => {
    const play = !st.current.playing;
    st.current.playing = play; setPlaying(play);
    if (cur.video) { const p = yt.current; if (!p) return; if (play) { const vid = p.getVideoData()?.video_id; if (vid !== cur.video.id) jump(st.current.i, st.current.t, true); else p.playVideo(); } else p.pauseVideo(); }
  };

  /* the clock: clips report their own time, cards count down */
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = st.current, it = items[s.i];
      if (!it || !s.playing) return;
      if (it.video) {
        const p = yt.current; if (!p) return;
        const vid = p.getVideoData()?.video_id;
        if (vid !== it.video.id) return;
        const ct = p.getCurrentTime();
        const into = Math.max(0, ct - it.video.start);
        s.t = into; setT(into);
        if (ct >= it.video.end - 0.35) jump(s.i + 1, 0, true);
      } else {
        s.t += 0.25 * rate; setT(s.t);
        if (s.t >= it.dur) jump(s.i + 1, 0, true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [items, jump, rate]);

  useEffect(() => { yt.current?.setPlaybackRate(rate); }, [rate, i]);
  /* a link from the book: #k=<piece key> opens the programme at that piece */
  useEffect(() => {
    const key = decodeURIComponent(window.location.hash.match(/k=([^&]+)/)?.[1] ?? "");
    if (!key) return;
    const id = window.requestAnimationFrame(() => { const n = itemsRef.current.findIndex((x) => x.key === key); if (n >= 0) jumpRef.current(n, 0, false); });
    return () => window.cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowRight") { e.preventDefault(); seek(offsets[st.current.i] + st.current.t + 10); }
      if (e.key === "ArrowLeft") { e.preventDefault(); seek(offsets[st.current.i] + st.current.t - 10); }
      if (e.key === "n") jump(st.current.i + 1);
      if (e.key === "p") jump(st.current.i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cur) return null;
  const now = offsets[i] + t;
  const hoverN = hover ? offsets.findIndex((o, j) => hover.s >= o && hover.s < o + items[j].dur) : -1;

  const desc = (
    <div className="grid gap-1 text-[14px] leading-[1.6] text-[#0f0f0f]">
      <b className="text-[14px]">{ui.items(items.length, Math.round(total / 60))} · {title}</b>
      <p className={cn("whitespace-pre-line", !more && "line-clamp-2")}>{intro}</p>
    </div>
  );

  return (
    <div className="mx-auto grid w-full max-w-[1720px] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_402px]">
      {/* the watch column */}
      <div className="grid min-w-0 gap-3">
        <div ref={stage} className="group/stage @container relative aspect-video overflow-hidden rounded-xl bg-black">
          <div ref={host} className={cn("absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full", cur.video ? "" : "invisible")} />
          {/* the YouTube player takes no clicks: ours do */}
          {cur.video ? <button type="button" aria-label={playing ? ui.pause : ui.play} onClick={toggle} className="absolute inset-0 z-[1]" /> : null}
          {!cur.video ? <Card it={cur} ui={ui} color={color} bookPath={bookPath} t={t} /> : null}
          {!playing && now === 0 ? (
            <button type="button" onClick={toggle} disabled={!ready && !!cur.video} aria-label={ui.start} className="absolute inset-0 z-[3] grid place-items-center bg-black/40">
              <span className="flex size-[68px] items-center justify-center rounded-2xl bg-[#ff0033]/95 shadow-xl transition-transform hover:scale-105"><MaterialSymbol className="text-[44px] text-white" name="play_arrow" filled /></span>
            </button>
          ) : null}

          {/* the controls, over the bottom of the picture */}
          <div className={cn("absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-1.5 pt-10 text-white transition-opacity duration-200", playing ? "opacity-0 group-hover/stage:opacity-100 focus-within:opacity-100" : "opacity-100")}>
            <div className="group/bar relative h-4 cursor-pointer" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(now)} tabIndex={0}
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = Math.max(0, e.clientX - r.left); setHover({ x, s: (x / r.width) * total }); }}
              onMouseLeave={() => setHover(null)}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * total); }}>
              <Segments items={items} offsets={offsets} total={total} chapters={chapters} i={i} hoverN={hoverN} />
              <span className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 bg-[#ff0033] transition-[height] group-hover/bar:h-[5px]" style={{ left: `${(offsets[i] / total) * 100}%`, width: `${(Math.min(t, cur.dur) / total) * 100}%`, background: cur.community ? "#3b82f6" : "#ff0033" }} />
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[#ff0033] transition-transform group-hover/bar:scale-100" style={{ left: `${(now / total) * 100}%` }} />
              {hover ? (() => { const n = offsets.findIndex((o, j) => hover.s >= o && hover.s < o + items[j].dur); const h = items[n]; return h ? <span className="pointer-events-none absolute bottom-6 z-10 w-max max-w-[260px] -translate-x-1/2 rounded-md bg-black/85 px-2 py-1 text-center text-[11.5px] leading-snug text-white" style={{ left: Math.max(60, hover.x) }}><b className="block">{clock(hover.s)}</b>{h.section ? `${h.section.code} ${h.section.title}` : h.topic}<span className="block text-white/70">{h.label ?? h.title}{h.community ? " · community" : ""}</span></span> : null; })() : null}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={toggle} aria-label={playing ? ui.pause : ui.play} className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[28px]" name={playing ? "pause" : "play_arrow"} filled /></button>
              <button type="button" onClick={() => jump(i + 1)} aria-label={ui.next} className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[24px]" name="skip_next" filled /></button>
              <button type="button" onClick={() => { const p = yt.current; if (!p) return; if (muted) p.unMute(); else p.mute(); setMuted(!muted); }} aria-label={muted ? ui.unmute : ui.mute} className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[22px]" name={muted ? "volume_off" : "volume_up"} /></button>
              <span className="px-1.5 font-mono text-[12.5px] tabular-nums text-white/90">{clock(now)} / {clock(total)}</span>
              <span className="ml-1 hidden min-w-0 truncate text-[12.5px] text-white/80 @md:inline">· {cur.topic}{cur.section ? ` · ${cur.section.code}` : ""} · {cur.label ?? cur.title}</span>
              <span className="ml-auto flex items-center gap-0.5">
                <button type="button" onClick={() => setRate((r) => (r >= 2 ? 1 : r === 1 ? 1.25 : r === 1.25 ? 1.5 : 2))} title={ui.speed} className="rounded-md px-2 py-1 font-mono text-[12px] font-bold hover:bg-white/10">{rate}×</button>
                <button type="button" onClick={() => { const el = stage.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen(); }} aria-label={ui.full} className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"><MaterialSymbol className="text-[24px]" name="fullscreen" /></button>
              </span>
            </div>
          </div>
        </div>

        {/* title, channel line, description — as on a watch page */}
        <h1 className="text-[20px] font-bold leading-[1.3] text-[#0f0f0f]">{cur.kind === "book" ? `${cur.section?.code ?? cur.topic} · ${cur.label ?? cur.title}` : cur.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: KIND_COLOR[cur.kind] }}><MaterialSymbol className="text-[20px]" name={KIND_ICON[cur.kind]} /></span>
          <span className="grid min-w-0 leading-tight">
            <b className="truncate text-[15px] text-[#0f0f0f]">{cur.by ?? (cur.kind === "book" || cur.kind === "sub" ? ui.book : cur.topicTitle)}</b>
            <span className="truncate text-[12px] text-black/55">{cur.source ?? `${cur.topic} · ${cur.topicTitle}`}</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => jump(i - 1)} className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3.5 py-2 text-[13.5px] font-semibold hover:bg-black/[0.1]"><MaterialSymbol className="text-[18px]" name="skip_previous" />{ui.prev}</button>
            <button type="button" onClick={() => jump(i + 1)} className="flex items-center gap-1 rounded-full bg-[#0f0f0f] px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-black"><MaterialSymbol className="text-[18px]" name="skip_next" />{ui.next}</button>
            {cur.kind === "article" && cur.url ? <a href={cur.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3.5 py-2 text-[13.5px] font-semibold hover:bg-black/[0.1]">{ui.openArticle}<MaterialSymbol className="text-[16px]" name="arrow_outward" /></a> : null}
            {cur.section ? <Link href={`${bookPath}#${cur.section.id}`} className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3.5 py-2 text-[13.5px] font-semibold hover:bg-black/[0.1]"><MaterialSymbol className="text-[18px]" name="menu_book" />{ui.readBook}</Link> : null}
          </span>
        </div>
        {panel(cur)}
        <div className="grid gap-2 rounded-xl bg-black/[0.05] p-3">
          {cur.text ? <p className="text-[14px] leading-[1.6] text-[#0f0f0f]">{cur.text}</p> : null}
          {desc}
          <button type="button" onClick={() => setMore((m) => !m)} className="justify-self-start text-[14px] font-semibold text-[#0f0f0f]">{more ? ui.less : ui.more}</button>
          {more ? <ShowNotes items={items} offsets={offsets} topics={topics} onJump={onJump} heading={ui.showNotes} /> : null}
        </div>
      </div>

      {/* the playlist, as on a watch page */}
      <aside className="overflow-hidden rounded-xl border border-black/10 xl:sticky xl:top-[calc(var(--nb,0px)+80px)]">
        <div className="grid gap-0.5 border-b border-black/10 bg-black/[0.03] px-4 py-3">
          <b className="truncate text-[17px] leading-tight text-[#0f0f0f]">{title}</b>
          <span className="text-[12px] text-black/55">{ui.programme} · {i + 1} / {items.length}</span>
        </div>
        <Playlist items={items} i={i} color={color} subtopicWord={ui.subtopic} onJump={onJump} listRef={list} />
      </aside>
    </div>
  );
}

/* a card piece: a topic title, an article, or a section from the book */
function Card({ it, ui, color, bookPath, t }: { it: ReelItem; ui: (typeof T)[BookLang]; color: string; bookPath: string; t: number }) {
  const left = Math.max(0, Math.ceil(it.dur - t));
  if (it.kind === "title") return (
    <div className="absolute inset-0 grid place-items-center px-8 text-center text-white" style={{ background: `radial-gradient(120% 140% at 50% 0%, ${color} 0%, #1b1530 55%, #0d1117 100%)` }}>
      <div className="grid max-w-[720px] gap-3">
        <span className="font-mono text-[13px] font-bold uppercase tracking-[0.24em] text-white/60">{ui.title} {it.topic}</span>
        <b className="text-[clamp(18px,5.4cqw,44px)] leading-[1.08] tracking-[-0.02em]">{it.title}</b>
        {it.text ? <span className="text-[clamp(12px,2.1cqw,18px)] text-white/75">{it.text}</span> : null}
      </div>
    </div>
  );
  if (it.kind === "sub") return (
    <div className="absolute inset-0 grid content-center gap-3 overflow-y-auto bg-[#0d1117] px-[7%] py-6 text-white">
      <span className="font-mono text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "#c4b5fd" }}>{ui.subtopic} {it.section?.code} · {it.topic} {it.topicTitle}</span>
      <b className="text-[clamp(17px,4.4cqw,38px)] leading-[1.08] tracking-[-0.02em]">{it.title}</b>
      {it.text ? <p className="max-w-[820px] text-[clamp(11.5px,1.9cqw,17px)] leading-[1.55] text-white/75">{it.text}</p> : null}
      {it.bullets?.length ? (
        <div className="mt-1 grid max-w-[820px] gap-1.5 rounded-xl bg-white/[0.07] p-4">
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/50">{ui.answers}</span>
          {it.bullets.map((b, k) => <span key={k} className="flex gap-2 text-[clamp(11px,1.7cqw,15px)] leading-[1.45]"><MaterialSymbol className="mt-0.5 shrink-0 text-[17px] text-[#c4b5fd]" name="help" />{b}</span>)}
        </div>
      ) : null}
    </div>
  );
  const accent = it.kind === "article" ? KIND_COLOR.article : KIND_COLOR.book;
  return (
    <div className="absolute inset-0 grid content-center gap-3 overflow-y-auto bg-[#fbfaf7] px-[7%] py-6">
      <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
        <MaterialSymbol className="text-[18px]" name={KIND_ICON[it.kind]} />{it.kind === "article" ? ui.article : ui.book} · {it.section ? `${it.section.code} ${it.section.title}` : `${it.topic} ${it.topicTitle}`}
      </span>
      <b className="text-[clamp(16px,3.9cqw,32px)] leading-[1.12] tracking-[-0.015em] text-[#0d1117]">{it.title}</b>
      {it.by ? <span className="text-[13px] text-black/50">{it.by} · {it.source}</span> : null}
      {it.text ? <p className="max-w-[820px] text-[clamp(11.5px,1.9cqw,17px)] leading-[1.55] text-[#24292f]">{it.text}</p> : null}
      {it.bullets?.length ? <ul className="grid max-w-[820px] gap-1">{it.bullets.map((b, k) => <li key={k} className="flex gap-2 text-[clamp(10.5px,1.65cqw,14.5px)] leading-[1.5] text-black/70"><span className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: accent }} />{b}</li>)}</ul> : null}
      <span className="mt-1 flex flex-wrap items-center gap-3">
        {it.kind === "article" && it.url ? <a href={it.url} target="_blank" rel="noopener noreferrer" className="relative z-[4] flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white" style={{ background: accent }}>{ui.openArticle}<MaterialSymbol className="text-[16px]" name="arrow_outward" /></a> : null}
        {it.kind === "book" ? <Link href={`${bookPath}#${it.section ? it.section.id : ""}`} className="relative z-[4] flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white" style={{ background: accent }}>{ui.readBook}<MaterialSymbol className="text-[16px]" name="arrow_forward" /></Link> : null}
        <span className="font-mono text-[11px] text-black/40">{ui.onScreen(left)}</span>
      </span>
    </div>
  );
}

/* ---- parts that only change with the piece, not with the clock ---- */
const Segments = memo(function Segments({ items, offsets, total, chapters, i, hoverN }: { items: ReelItem[]; offsets: number[]; total: number; chapters: { from: number; to: number }[]; i: number; hoverN: number }) {
  return (
    <>
      {chapters.map((ch) => {
        const hov = hoverN >= ch.from && hoverN <= ch.to;
        const span = offsets[ch.to] + items[ch.to].dur - offsets[ch.from];
        return (
          <div key={ch.from} className={cn("absolute top-1/2 flex -translate-y-1/2 overflow-hidden transition-[height]", hov ? "h-[7px]" : "h-[3px] group-hover/bar:h-[5px]")} style={{ left: `${(offsets[ch.from] / total) * 100}%`, width: `calc(${(span / total) * 100}% - 3px)` }}>
            {items.slice(ch.from, ch.to + 1).map((it, j) => {
              const k = ch.from + j;
              const base = it.community ? "rgba(96,165,250,.55)" : it.kind === "video" ? "rgba(255,255,255,.38)" : "rgba(255,255,255,.2)";
              return (
                <span key={it.key} className={cn("relative h-full", k > ch.from && "border-l border-black/50")} style={{ width: `${(it.dur / span) * 100}%`, background: k < i ? (it.community ? "#3b82f6" : "#ff0033") : base }}>
                  {it.options && it.options.length > 1 ? <span className="absolute -top-[5px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#facc15]" /> : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
});

const ShowNotes = memo(function ShowNotes({ items, offsets, topics, onJump, heading }: { items: ReelItem[]; offsets: number[]; topics: { topic: string; title: string }[]; onJump: (k: number, play?: boolean) => void; heading: string }) {
  return (
    <div className="grid gap-4 border-t border-black/10 pt-3">
      <b className="text-[14px]">{heading}</b>
      {topics.map((x) => (
        <section key={x.topic} className="grid gap-1">
          <b className="text-[14px] text-[#0f0f0f]">{x.topic} · {x.title}</b>
          {items.map((it, k) => it.topic !== x.topic || it.kind === "title" ? null : (
            <button key={it.key} type="button" onClick={() => { onJump(k, true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={cn("flex items-baseline gap-2 text-left text-[13.5px] leading-[1.5] hover:underline", it.kind === "sub" ? "mt-1.5 font-semibold text-[#0f0f0f]" : "pl-4 text-black/75")}>
              <span className="shrink-0 font-mono text-[12.5px] text-[#065fd4]">{clock(offsets[k])}</span>
              <span>{it.kind === "sub" ? `${it.section?.code} ${it.title}` : it.kind === "book" ? it.label ?? it.title : `${it.title} — ${it.by}`}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
});

/* the playlist: the topic that's playing is open, the others fold to a header (open any of them) — far fewer rows to draw */
const Playlist = memo(function Playlist({ items, i, color, subtopicWord, onJump, listRef }: { items: ReelItem[]; i: number; color: string; subtopicWord: string; onJump: (k: number) => void; listRef: React.RefObject<HTMLOListElement | null> }) {
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const curTopic = items[i]?.topic;
  const groups = useMemo(() => {
    const g: { topic: string; from: number; to: number; dur: number }[] = [];
    items.forEach((it, k) => { const last = g[g.length - 1]; if (!last || last.topic !== it.topic) g.push({ topic: it.topic, from: k, to: k, dur: it.dur }); else { last.to = k; last.dur += it.dur; } });
    return g;
  }, [items]);
  return (
    <ol ref={listRef} className="grid max-h-[calc(100vh-var(--nb,0px)-190px)] overflow-y-auto py-1 [scrollbar-width:thin]">
      {groups.map((g) => {
        const open = g.topic === curTopic || opened.has(g.topic);
        const head = items[g.from];
        return (
          <li key={g.topic}>
            <button type="button" onClick={() => setOpened((s) => { const n = new Set(s); if (n.has(g.topic)) n.delete(g.topic); else n.add(g.topic); return n; })} aria-expanded={open} className="flex w-full items-center gap-2 px-4 pb-1 pt-3 text-left">
              <span className="font-mono text-[11px] font-bold" style={{ color }}>{head.topic}</span>
              <b className="min-w-0 flex-1 truncate text-[13px] text-[#0f0f0f]">{head.topicTitle}</b>
              <span className="font-mono text-[10.5px] text-black/40">{g.to - g.from + 1} · {clock(g.dur)}</span>
              <MaterialSymbol className={cn("text-[18px] text-black/40 transition-transform", open && "rotate-180")} name="expand_more" />
            </button>
            {open ? (
              <ol className="grid">
                {items.slice(g.from, g.to + 1).map((it, j) => <Row key={it.key} it={it} k={g.from + j} i={i} subtopicWord={subtopicWord} onJump={onJump} />)}
              </ol>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
});

function Row({ it, k, i, subtopicWord, onJump }: { it: ReelItem; k: number; i: number; subtopicWord: string; onJump: (k: number) => void }) {
  const on = k === i;
  if (it.kind === "title") return (
    <li data-k={k}><button type="button" onClick={() => onJump(k)} className={cn("flex w-full items-center gap-2 py-1 pl-[52px] pr-4 text-left text-[12px] text-black/55 hover:bg-black/[0.04]", on && "bg-black/[0.08] font-semibold text-[#0f0f0f]")}><MaterialSymbol className="shrink-0 text-[13px]" name="flag" />{it.title}</button></li>
  );
  if (it.kind === "book") return (
    <li data-k={k}><button type="button" onClick={() => onJump(k)} aria-current={on ? "true" : undefined} className={cn("flex w-full items-center gap-2 py-1 pl-[52px] pr-4 text-left text-[12px]", on ? "bg-black/[0.08] font-semibold text-[#0f0f0f]" : k < i ? "text-black/40 hover:bg-black/[0.04]" : "text-black/65 hover:bg-black/[0.04]")}>
      {on ? <MaterialSymbol className="shrink-0 text-[14px] text-[#ff0033]" name="play_arrow" filled /> : <MaterialSymbol className="shrink-0 text-[13px]" name="menu_book" style={{ color: KIND_COLOR.book }} />}
      <span className="min-w-0 flex-1 truncate">{it.label ?? it.title}</span><span className="font-mono text-[10.5px] text-black/40">{clock(it.dur)}</span>
    </button></li>
  );
  return (
    <li data-k={k}>
      <button type="button" onClick={() => onJump(k)} aria-current={on ? "true" : undefined} className={cn("grid w-full grid-cols-[24px_100px_minmax(0,1fr)] items-start gap-2 px-2 py-1.5 text-left", on ? "bg-black/[0.08]" : "hover:bg-black/[0.04]")}>
        <span className="mt-4 text-center text-[11.5px] text-black/45">{on ? <MaterialSymbol className="text-[14px] text-[#ff0033]" name="play_arrow" filled /> : k + 1}</span>
        <span className="relative aspect-video overflow-hidden rounded-md bg-cover bg-center" style={it.video ? { backgroundImage: `url(https://i.ytimg.com/vi/${it.video.id}/mqdefault.jpg)` } : { background: it.kind === "sub" ? "#0d1117" : `${KIND_COLOR[it.kind]}` }}>
          {!it.video ? <span className="absolute inset-0 grid place-items-center px-1 text-center font-mono text-[10px] font-bold leading-tight text-white">{it.kind === "sub" ? it.section?.code : <MaterialSymbol className="text-[20px]" name={KIND_ICON[it.kind]} />}</span> : null}
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 font-mono text-[10px] font-semibold text-white">{clock(it.dur)}</span>
        </span>
        <span className="grid min-w-0 gap-0.5">
          <b className="line-clamp-2 text-[13px] font-semibold leading-[1.3] text-[#0f0f0f]">{it.title}</b>
          <span className="flex min-w-0 items-center gap-1 truncate text-[11.5px] text-black/55">{it.community ? <span className="shrink-0 rounded bg-[#3b82f6] px-1 text-[9.5px] font-bold uppercase text-white">community</span> : null}{it.kind === "sub" ? `${subtopicWord} ${it.section?.code}` : it.by}{it.options && it.options.length > 1 ? <span className="shrink-0 text-[10.5px] text-black/40">· {it.options.length} options</span> : null}</span>
        </span>
      </button>
    </li>
  );
}
