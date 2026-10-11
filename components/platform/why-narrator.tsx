"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { whyAudio, whyNarration } from "@/lib/why-data";
import { cn } from "@/lib/utils";

import { createScore } from "./why-score";

/* The narrator for /why. Off until asked (browsers don't allow sound before a tap). Once on, a score comes up under
 * it and it reads the part of the story on screen; when it finishes it moves the page on and reads the next — a
 * guided tour. Scrolling yourself just changes what it reads. Each part plays a recording if one is set in
 * `whyAudio`; otherwise the browser's own voice speaks it, a phrase at a time, slow and low, with the pauses a
 * narrator would take. The phrase being spoken shows as a caption. */
const PREFERRED = [/(Andrew|Brian|Guy|Ryan|Christopher|Davis|Thomas).*(Natural|Online)/i, /(Natural|Online)/i, /Google UK English Male/i, /Daniel/i, /Google US English/i, /Alex/i];
function pickVoice(all: SpeechSynthesisVoice[]) {
  const en = all.filter((v) => /^en/i.test(v.lang));
  for (const re of PREFERRED) { const v = en.find((x) => re.test(x.name)); if (v) return v; }
  return en[0] ?? null;
}
const LABELS = ["The opening", "01 · The edge", "02 · The gap", "03 · The bridge", "04 · Any point", "05 · The partner", "What we believe", "To be continued"];
/* phrases: sentences, and the halves either side of a dash — each followed by its own pause */
const phrases = (text: string) => text.split(/(?<=[.!?])\s+/).flatMap((s) => {
  const parts = s.split(/\s+—\s+/);
  return parts.map((p, i) => ({ text: p, pause: i < parts.length - 1 ? 420 : s.length < 24 ? 520 : 720 }));
});

type Score = NonNullable<ReturnType<typeof createScore>>;

export function WhyNarrator({ at }: { at: number }) {
  const [able, setAble] = useState(false);
  const [on, setOn] = useState(false);
  const [line, setLine] = useState("");
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const score = useRef<Score | null>(null);
  const speaking = useRef<SpeechSynthesisUtterance | null>(null); // held, or some browsers drop its end event
  const run = useRef(0); // bumps on every stop, so a finished line from an old run doesn't carry on
  const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

  useEffect(() => {
    const s = synth();
    const id = window.requestAnimationFrame(() => setAble(!!s || whyAudio.some(Boolean)));
    const pick = () => { if (s) voice.current = pickVoice(s.getVoices()); };
    pick();
    s?.addEventListener("voiceschanged", pick);
    const runs = run;
    return () => {
      window.cancelAnimationFrame(id);
      s?.removeEventListener("voiceschanged", pick);
      runs.current++;
      s?.cancel();
      audio.current?.pause();
      score.current?.stop();
    };
  }, []);

  const silence = () => { run.current++; synth()?.cancel(); audio.current?.pause(); };
  const end = () => { silence(); score.current?.stop(); score.current = null; setOn(false); setLine(""); };
  const onward = (n: number) => {
    if (n >= whyNarration.length) { end(); return; }
    document.querySelector(`[data-stage="${n}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const read = useEffectEvent((n: number) => {
    silence();
    const mine = run.current, text = whyNarration[n], src = whyAudio[n];
    if (!text) return;
    score.current?.cue(n);
    const live = () => run.current === mine;
    if (src) {
      const a = new Audio(src);
      audio.current = a;
      a.addEventListener("play", () => score.current?.duck(true));
      a.addEventListener("ended", () => { score.current?.duck(false); if (live()) window.setTimeout(() => live() && onward(n + 1), 1100); });
      setLine(text);
      window.setTimeout(() => { if (live()) void a.play().catch(() => setLine("")); }, 900);
      return;
    }
    const s = synth();
    if (!s) return;
    const queue = phrases(text);
    let i = 0;
    const say = () => {
      if (!live()) return;
      if (i >= queue.length) { score.current?.duck(false); window.setTimeout(() => live() && onward(n + 1), 1200); return; }
      const p = queue[i++];
      const u = new SpeechSynthesisUtterance(p.text);
      if (voice.current) u.voice = voice.current;
      u.lang = voice.current?.lang ?? "en-GB";
      u.rate = 0.86;
      u.pitch = 0.78;
      u.onstart = () => { if (live()) { setLine(p.text); score.current?.duck(true); } };
      u.onend = u.onerror = () => { score.current?.duck(false); window.setTimeout(say, p.pause); };
      speaking.current = u;
      s.speak(u);
    };
    /* let the hit land before the voice comes in */
    window.setTimeout(say, 1000);
  });

  /* on, or the reader moved to another part: read what's on screen (after a beat, so a fast scroll doesn't chatter) */
  useEffect(() => {
    if (!on) return;
    const id = window.setTimeout(() => read(at), 380);
    return () => window.clearTimeout(id);
  }, [on, at]);

  if (!able) return null;
  const toggle = () => {
    if (on) { end(); return; }
    /* the score has to start inside the tap */
    score.current = createScore();
    score.current?.start();
    setOn(true);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4 sm:bottom-6">
      <div className={cn("pointer-events-auto flex max-w-[640px] items-center gap-3 rounded-full border border-white/12 bg-[#0b0f15]/85 py-2 pl-2 shadow-[0_18px_50px_-18px_rgba(0,0,0,.9)] backdrop-blur-xl transition-all duration-500", on ? "w-full pr-3" : "pr-5")}>
        <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? "Stop the narration" : "Listen to the story"}
          className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105", on ? "bg-white/10" : "bg-[#e91e63] shadow-lg shadow-pink-500/30")}>
          <MaterialSymbol className="text-[22px]" name={on ? "stop" : "headphones"} />
        </button>
        {on ? (
          <>
            <span className="flex h-5 shrink-0 items-end gap-[3px]" aria-hidden>
              {[0, 1, 2, 3].map((i) => <span key={i} className="wn-eq w-[3px] rounded-full bg-[#e91e63]" style={{ animationDelay: `${i * 0.13}s` }} />)}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#4fd1c5]">{LABELS[at] ?? ""}</span>
              <span key={line} className="wn-rise line-clamp-2 text-[13.5px] font-medium leading-snug text-white/90">{line || "…"}</span>
            </span>
          </>
        ) : (
          <button type="button" onClick={toggle} className="grid text-left">
            <span className="text-[13.5px] font-bold text-white">Listen to the story</span>
            <span className="text-[11.5px] text-white/50">Narrated, with score · about 4 minutes</span>
          </button>
        )}
      </div>
    </div>
  );
}
