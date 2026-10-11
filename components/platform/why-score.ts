/* The score under the /why narration — synthesised live with Web Audio, no files. A low drone throughout; a chord
 * per part of the story that sets its mood (unease at the edge, dread in the gap, lift on the bridge, warmth at the
 * end); a deep hit and a breath of air on every turn; a heartbeat while we stand over the gap. Kept low, under the voice. */

type Score = { start: () => void; cue: (part: number) => void; duck: (on: boolean) => void; stop: () => void };

const hz = (n: string) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n)!;
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as "A"] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((semis + (Number(m[3]) - 4) * 12) / 12);
};
/* one chord per part: 0 opening · 1 edge · 2 gap · 3 bridge · 4 any point · 5 partner · 6 beliefs · 7 close */
const CHORDS = [
  ["A2", "E3", "C4"], ["A2", "E3", "C4", "B4"], ["D2", "A2", "F3", "G#3"], ["F2", "C3", "A3", "E4"],
  ["G2", "D3", "B3", "E4"], ["C2", "G2", "E3", "D4"], ["A2", "E3", "C4", "G4"], ["C2", "G2", "E3", "B3"],
];

export function createScore(): Score | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  let ctx: AudioContext | null = null, master: GainNode, bus: GainNode, verb: ConvolverNode;
  let pad: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
  let heart: number | null = null;
  const drones: OscillatorNode[] = [];

  /* a long, dark room: a convolver fed with decaying noise */
  const room = (c: AudioContext) => {
    const len = c.sampleRate * 3.6, buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
    const v = c.createConvolver(); v.buffer = buf; return v;
  };

  const boom = (when: number, deep = 1) => {
    const c = ctx!;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(78, when);
    o.frequency.exponentialRampToValueAtTime(30, when + 1.4);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.55 * deep, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 2.2);
    o.connect(g).connect(bus); o.start(when); o.stop(when + 2.3);
    /* the air: noise swept down through a band */
    const n = c.createBufferSource(), nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = nb;
    const f = c.createBiquadFilter(), ng = c.createGain();
    f.type = "bandpass"; f.Q.value = 0.8;
    f.frequency.setValueAtTime(2400, when - 0.6); f.frequency.exponentialRampToValueAtTime(260, when + 1.2);
    ng.gain.setValueAtTime(0.0001, when - 0.6); ng.gain.exponentialRampToValueAtTime(0.09 * deep, when); ng.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    n.connect(f).connect(ng).connect(bus); n.start(when - 0.6); n.stop(when + 1.5);
  };

  const beat = () => {
    const c = ctx!, t = c.currentTime;
    for (const [dt, a] of [[0, 0.32], [0.24, 0.2]] as const) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(58, t + dt); o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.18);
      g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(a, t + dt + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.3);
      o.connect(g).connect(master); o.start(t + dt); o.stop(t + dt + 0.32);
    }
  };

  const setPad = (part: number) => {
    const c = ctx!, t = c.currentTime;
    if (pad) { const old = pad; old.gain.gain.cancelScheduledValues(t); old.gain.gain.setTargetAtTime(0, t, 0.9); old.oscs.forEach((o) => o.stop(t + 5)); }
    const gain = c.createGain(), lp = c.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = part === 2 ? 700 : 1300; lp.Q.value = 0.4;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(part === 2 ? 0.075 : 0.06, t + 3.2);
    const oscs = (CHORDS[part] ?? CHORDS[0]).flatMap((note, i) => [-5, 5].map((cents) => {
      const o = c.createOscillator();
      o.type = i === 0 ? "triangle" : "sawtooth";
      o.frequency.value = hz(note); o.detune.value = cents;
      const og = c.createGain(); og.gain.value = i === 0 ? 0.5 : 0.16;
      o.connect(og).connect(lp); o.start(t); return o;
    }));
    lp.connect(gain).connect(bus);
    pad = { oscs, gain };
  };

  return {
    start() {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 2.5);
      master.connect(ctx.destination);
      verb = room(ctx);
      const wet = ctx.createGain(); wet.gain.value = 0.55;
      bus = ctx.createGain(); bus.gain.value = 1;
      bus.connect(master); bus.connect(verb).connect(wet).connect(master);
      /* the drone: low A, a fifth over it, breathing through a slow filter */
      const lp = ctx.createBiquadFilter(), dg = ctx.createGain(), lfo = ctx.createOscillator(), lfoAmt = ctx.createGain();
      lp.type = "lowpass"; lp.frequency.value = 260; dg.gain.value = 0.11;
      lfo.frequency.value = 0.07; lfoAmt.gain.value = 120; lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
      for (const [f, d] of [[55, -4], [55, 4], [82.4, 0]] as const) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(); drones.push(o); }
      drones.push(lfo);
      lp.connect(dg).connect(bus);
    },
    cue(part) {
      if (!ctx) return;
      boom(ctx.currentTime + 0.7, part === 2 || part === 3 ? 1 : 0.7); // its air starts 0.6s ahead of the hit
      setPad(part);
      if (heart) { window.clearInterval(heart); heart = null; }
      if (part === 2) { beat(); heart = window.setInterval(beat, 1150); }
    },
    /* the music steps back while a line is spoken, and comes up in the pauses */
    duck(on) { if (ctx) bus.gain.setTargetAtTime(on ? 0.62 : 1, ctx.currentTime, 0.4); },
    stop() {
      if (!ctx) return;
      const c = ctx; ctx = null;
      if (heart) { window.clearInterval(heart); heart = null; }
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setTargetAtTime(0, c.currentTime, 0.5);
      window.setTimeout(() => { void c.close(); }, 2500);
      drones.length = 0; pad = null;
    },
  };
}
