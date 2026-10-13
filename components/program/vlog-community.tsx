"use client";

import { useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { LANGS, parseClock, youTubeOf, type CommunityLink, type CuratedVotes, type SlotOption } from "@/lib/program/book/community";
import type { ReelItem } from "@/lib/program/book/reel";
import type { BookLang } from "@/lib/program/book/types";
import { cn } from "@/lib/utils";

/* The community side of the vlog: every option for the part that's playing (the curated clip, alternates, translations),
   each with votes that show on hover together with who added it; links added after this part; and a way to add one. */
export type CommunityData = { links: CommunityLink[]; curated: CuratedVotes };

const W = {
  en: {
    options: "Options for this part", added: "Added after this part", add: "Add a link here", none: "No video for this subtopic yet — add one, or an alternate, a translation or an extra.",
    curatedBy: "Chosen by the Node team", by: (n: string, d: string) => `Added by ${n} · ${d}`, playing: "Playing", play: "Play this", up: "Vote up", down: "Vote down", own: "Your link", remove: "Remove",
    cat: { alternate: "Alternate", translation: "Translation", addition: "Addition" } as Record<string, string>, top: "Most voted plays by default",
    form: { title: "Add a link to the vlog", where: "Where", kind: "What it is", video: "YouTube video", article: "Article", other: "Other link", category: "As", alt: "An alternate for this clip", altSub: "A video for this subtopic", tr: "A translation", trLang: "Language", addAfter: "An addition after this part", url: "Link", start: "Starts at", end: "Ends at", time: "m:ss", ttl: "Title", ttlHint: "Leave empty to use the video's own title", note: "Why it's worth it (optional)", submit: "Add the link", cancel: "Cancel", saving: "Adding…" },
  },
  ur: {
    options: "Is hisse ke options", added: "Is hisse ke baad shamil", add: "Yahan link shamil karein", none: "Is subtopic ki abhi koi video nahi — ek shamil karein, ya alternate, translation ya izafa.",
    curatedBy: "Node team ka chuna hua", by: (n: string, d: string) => `${n} ne shamil kiya · ${d}`, playing: "Chal raha", play: "Yeh chalayein", up: "Upvote", down: "Downvote", own: "Aap ka link", remove: "Hatayein",
    cat: { alternate: "Alternate", translation: "Tarjuma", addition: "Izafa" } as Record<string, string>, top: "Sab se zyada votes wala khud chalta hai",
    form: { title: "Vlog mein link shamil karein", where: "Kahan", kind: "Kya hai", video: "YouTube video", article: "Article", other: "Koi aur link", category: "Bator", alt: "Is clip ka alternate", altSub: "Is subtopic ki video", tr: "Tarjuma", trLang: "Zubaan", addAfter: "Is hisse ke baad izafa", url: "Link", start: "Shuru", end: "Khatam", time: "m:ss", ttl: "Title", ttlHint: "Khaali chhorein to video ka apna title", note: "Kyun dekhna chahiye (ikhtiyari)", submit: "Link shamil karein", cancel: "Cancel", saving: "Shamil ho raha…" },
  },
} as const;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

async function call(url: string, body?: unknown, method = "POST"): Promise<CommunityData & { error?: string }> {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error ?? "Something went wrong.");
  return j as CommunityData;
}

function Votes({ score, mine, disabled, onVote, color }: { score: number; mine: number; disabled?: boolean; onVote: (v: 1 | -1 | 0) => void; color: string }) {
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-black/[0.05] px-1 py-0.5">
      <button type="button" disabled={disabled} onClick={(e) => { e.stopPropagation(); onVote(mine === 1 ? 0 : 1); }} aria-label="Vote up" aria-pressed={mine === 1} className={cn("flex size-6 items-center justify-center rounded-full transition-opacity disabled:opacity-30", disabled ? "" : "opacity-0 hover:bg-black/10 group-hover/opt:opacity-100", mine === 1 && "!opacity-100")} style={mine === 1 ? { color } : undefined}><MaterialSymbol className="text-[18px]" name="thumb_up" filled={mine === 1} /></button>
      <b className={cn("min-w-[18px] text-center font-mono text-[12px]", score > 0 ? "text-[#0f766e]" : score < 0 ? "text-[#c2410c]" : "text-black/50")}>{score}</b>
      <button type="button" disabled={disabled} onClick={(e) => { e.stopPropagation(); onVote(mine === -1 ? 0 : -1); }} aria-label="Vote down" aria-pressed={mine === -1} className={cn("flex size-6 items-center justify-center rounded-full transition-opacity disabled:opacity-30", disabled ? "" : "opacity-0 hover:bg-black/10 group-hover/opt:opacity-100", mine === -1 && "!opacity-100 text-[#c2410c]")}><MaterialSymbol className="text-[18px]" name="thumb_down" filled={mine === -1} /></button>
    </span>
  );
}

export function CommunityPanel({ cur, base, data, me, isAdmin, bookId, lang, color, onData, onPick }: {
  cur: ReelItem; base: ReelItem[]; data: CommunityData; me: string; isAdmin: boolean; bookId: string; lang: BookLang; color: string;
  onData: (d: CommunityData) => void; onPick: (slot: string, optionId: string) => void;
}) {
  const w = W[lang];
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const byId = new Map(data.links.map((l) => [l.id, l]));
  const vote = async (target: string, v: 1 | -1 | 0) => { setErr(""); try { onData(await call(`/api/vlog/${bookId}/vote`, { target, v })); } catch (e) { setErr((e as Error).message); } };
  const remove = async (id: string) => { setErr(""); try { onData(await call(`/api/vlog/${bookId}/links/${id}`, undefined, "DELETE")); } catch (e) { setErr((e as Error).message); } };
  const subSlot = base.find((x) => x.kind === "slot" && x.section?.id === cur.section?.id)?.slot;
  const emptySubtopic = !!subSlot && !cur.options && cur.kind !== "title";
  const additionHere = cur.community && !cur.slot ? byId.get(cur.community.id) : null;

  const row = (o: SlotOption) => {
    const link = o.curated ? null : byId.get(o.id);
    const own = !!link && link.byId === me;
    return (
      <li key={o.id} className="group/opt relative">
        <div className={cn("grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-2 py-1.5", o.chosen ? "bg-black/[0.06]" : "hover:bg-black/[0.03]")}>
          <button type="button" onClick={() => cur.slot && onPick(cur.slot, o.id)} aria-label={o.chosen ? w.playing : w.play} className="flex size-7 items-center justify-center rounded-full" style={o.chosen ? { background: "#ff0033", color: "#fff" } : { background: "rgba(0,0,0,.06)" }}>
            <MaterialSymbol className="text-[16px]" name={o.chosen ? "graphic_eq" : "play_arrow"} filled />
          </button>
          <button type="button" onClick={() => cur.slot && onPick(cur.slot, o.id)} className="grid min-w-0 text-left">
            <span className="flex min-w-0 items-center gap-1.5">
              <b className="truncate text-[13.5px] text-[#0f0f0f]">{o.title}</b>
              {o.curated ? <span className="shrink-0 rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.06em] text-white" style={{ background: color }}>Node</span> : <span className="shrink-0 rounded bg-black/[0.07] px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.06em] text-black/60">{w.cat[o.category ?? "alternate"]}{o.category === "translation" ? ` · ${LANGS[o.lang] ?? o.lang}` : ""}</span>}
            </span>
            <span className="truncate text-[11.5px] text-black/50">{o.source || o.by} · {clock(o.video.start)}–{clock(o.video.end)}</span>
          </button>
          <span className="flex items-center gap-1">
            {own || (isAdmin && link) ? <button type="button" onClick={() => void remove(o.id)} className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[#c2410c] opacity-0 hover:bg-[#c2410c]/10 group-hover/opt:opacity-100">{w.remove}</button> : null}
            <Votes score={o.score} mine={o.mine} disabled={own} onVote={(v) => void vote(o.id, v)} color={color} />
          </span>
        </div>
        {/* who added it, on hover */}
        <span className="pointer-events-none absolute right-[150px] top-1/2 z-10 hidden w-max -translate-y-1/2 rounded-md bg-[#0f0f0f] px-2 py-1 text-[11.5px] text-white shadow group-hover/opt:block">{o.curated ? w.curatedBy : own ? w.own : w.by(o.by, day(o.at))}</span>
      </li>
    );
  };

  return (
    <div className="grid gap-2 rounded-xl border border-black/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <MaterialSymbol className="text-[18px] text-black/60" name="forum" />
        <b className="text-[14px] text-[#0f0f0f]">{cur.options?.length ? w.options : additionHere ? w.added : w.add}</b>
        {cur.options && cur.options.length > 1 ? <span className="text-[12px] text-black/45">· {w.top}</span> : null}
        <button type="button" onClick={() => setOpen(true)} className="ml-auto flex items-center gap-1 rounded-full bg-[#0f0f0f] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-black"><MaterialSymbol className="text-[16px]" name="add_link" />{w.add}</button>
      </div>
      {cur.options?.length ? <ul className="grid gap-0.5">{cur.options.map(row)}</ul> : null}
      {additionHere ? (
        <ul className="grid gap-0.5"><li className="group/opt relative"><div className="flex items-center gap-2 rounded-lg px-2 py-1.5"><b className="min-w-0 flex-1 truncate text-[13.5px]">{additionHere.title}</b><Votes score={additionHere.score} mine={additionHere.mine} disabled={additionHere.byId === me} onVote={(v) => void vote(additionHere.id, v)} color={color} /></div><span className="pointer-events-none absolute right-[130px] top-1/2 z-10 hidden w-max -translate-y-1/2 rounded-md bg-[#0f0f0f] px-2 py-1 text-[11.5px] text-white shadow group-hover/opt:block">{w.by(additionHere.by, day(additionHere.at))}</span></li></ul>
      ) : null}
      {emptySubtopic ? <p className="text-[12.5px] text-black/55">{w.none}</p> : null}
      {err ? <p role="alert" className="text-[12.5px] text-[#c2410c]">{err}</p> : null}
      {open ? <AddLink cur={cur} subSlot={subSlot} bookId={bookId} lang={lang} color={color} onClose={() => setOpen(false)} onData={(d) => { onData(d); setOpen(false); }} /> : null}
    </div>
  );
}

function AddLink({ cur, subSlot, bookId, lang, color, onClose, onData }: { cur: ReelItem; subSlot?: string; bookId: string; lang: BookLang; color: string; onClose: () => void; onData: (d: CommunityData) => void }) {
  const w = W[lang].form;
  const clipSlot = cur.slot?.startsWith("clip:") ? cur.slot : undefined;
  const slot = clipSlot ?? subSlot;
  const [category, setCategory] = useState<"alternate" | "translation" | "addition">(slot ? "alternate" : "addition");
  const [kind, setKind] = useState<"video" | "article" | "other">("video");
  const [trLang, setTrLang] = useState(lang === "ur" ? "ur" : "ur");
  const [url, setUrl] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const isVideo = category !== "addition" || kind === "video";
  const submit = async () => {
    setErr("");
    const s = start ? parseClock(start) : (youTubeOf(url)?.t ?? 0), e = parseClock(end);
    if (isVideo && (s === null || e === null)) return setErr("Use times like 4:30 or 1:02:15.");
    setSaving(true);
    try {
      const d = await call(`/api/vlog/${bookId}`, { category, kind: isVideo ? "video" : kind, slot: category === "addition" ? "" : slot, anchor: category === "addition" ? cur.key : "", lang: category === "translation" ? trLang : lang, url: url.trim(), start: isVideo ? s : undefined, end: isVideo ? e : undefined, title: title.trim(), note: note.trim() });
      onData(d);
    } catch (x) { setErr((x as Error).message); setSaving(false); }
  };
  const field = "w-full rounded-lg border border-black/15 px-3 py-2 text-[14px] outline-none focus:border-black/40";
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={w.title} onClick={onClose}>
      <div className="grid w-[min(560px,100%)] gap-3 rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><b className="text-[17px]">{w.title}</b><button type="button" onClick={onClose} aria-label={w.cancel} className="flex size-8 items-center justify-center rounded-full hover:bg-black/5"><MaterialSymbol className="text-[20px]" name="close" /></button></div>
        <div className="rounded-lg bg-black/[0.04] px-3 py-2 text-[12.5px] text-black/65"><b className="text-black/80">{w.where}:</b> {cur.topic}{cur.section ? ` · ${cur.section.code} ${cur.section.title}` : ""} — {cur.label ?? cur.title}</div>
        <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.category}
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={field}>
            {slot ? <option value="alternate">{clipSlot ? w.alt : w.altSub}</option> : null}
            {slot ? <option value="translation">{w.tr}</option> : null}
            <option value="addition">{w.addAfter}</option>
          </select>
        </label>
        {category === "translation" ? (
          <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.trLang}
            <select value={trLang} onChange={(e) => setTrLang(e.target.value)} className={field}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
        ) : null}
        {category === "addition" ? (
          <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.kind}
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}><option value="video">{w.video}</option><option value="article">{w.article}</option><option value="other">{w.other}</option></select>
          </label>
        ) : null}
        <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.url}
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={isVideo ? "https://www.youtube.com/watch?v=…&t=95" : "https://…"} className={field} />
        </label>
        {isVideo ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.start}<input value={start} onChange={(e) => setStart(e.target.value)} placeholder={w.time} className={field} /></label>
            <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.end}<input value={end} onChange={(e) => setEnd(e.target.value)} placeholder={w.time} className={field} /></label>
          </div>
        ) : null}
        <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.ttl}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isVideo ? w.ttlHint : ""} maxLength={160} className={field} />
        </label>
        <label className="grid gap-1 text-[12.5px] font-semibold text-black/70">{w.note}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={400} className={field} />
        </label>
        {err ? <p role="alert" className="text-[13px] text-[#c2410c]">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[13.5px] font-semibold hover:bg-black/5">{w.cancel}</button>
          <button type="button" disabled={saving || !url} onClick={() => void submit()} className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50" style={{ background: color }}>{saving ? w.saving : w.submit}</button>
        </div>
      </div>
    </div>
  );
}
