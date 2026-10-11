"use client";

import { useEffect, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { programDays, tracks } from "@/lib/platform-data";

import s from "./platform.module.css";

const W = 1000, X0 = 46, X1 = 960, Y: Record<string, number> = { discovery: 92, delivery: 172, run: 252 };
const xOf = (day: number) => X0 + (day / 30) * (X1 - X0);
const colorOf = (track: string) => tracks.find((t) => t.id === track)?.color ?? "#008080";

/* The 30 days as a transit map: three lines, a station per act, a runner on today's stop */
export function ProgramMetro() {
  const [day, setDay] = useState(1);
  const [riding, setRiding] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = programDays.find((d) => day >= d.from && day <= d.to) ?? programDays[0];

  const playing = riding && day < 30; // reaching day 30 ends the ride on its own
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => setDay((d) => Math.min(30, d + 1)), 420);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing]);

  return (
    <div className={s.metro}>
      <div className={s.metroSvg}>
        <svg viewBox={`0 0 ${W} 310`} role="img" aria-label="The 30-day program as a transit map">
          {[1, 2, 3, 4].map((w) => { const from = [0, 8.5, 15.5, 21.5][w - 1], to = [8.5, 15.5, 21.5, 30][w - 1]; return (
            <g key={w}><rect x={xOf(from)} y={18} width={xOf(to) - xOf(from) - 4} height={26} rx={8} fill={w % 2 ? "#f6f4f3" : "#efebe9"} /><text x={xOf(from) + 10} y={36} fontSize={11} fontWeight={800} fill="#8a8e8f" fontFamily="var(--font-geist-mono)" letterSpacing=".12em">WEEK {w}</text></g>
          ); })}
          {tracks.map((t) => (
            <g key={t.id}>
              <line x1={X0} x2={X1} y1={Y[t.id]} y2={Y[t.id]} stroke={t.color} strokeOpacity={0.22} strokeWidth={10} strokeLinecap="round" />
              <text x={X0 - 6} y={Y[t.id] - 16} fontSize={10.5} fontWeight={800} fill={t.color} fontFamily="var(--font-geist-mono)" letterSpacing=".12em">{t.name.toUpperCase()}</text>
            </g>
          ))}
          <line x1={xOf(11.5)} x2={xOf(11.5)} y1={Y.discovery} y2={Y.delivery} stroke="#8a8e8f" strokeDasharray="4 5" />
          <line x1={xOf(21.5)} x2={xOf(21.5)} y1={Y.delivery} y2={Y.run} stroke="#8a8e8f" strokeDasharray="4 5" />
          {programDays.map((d) => {
            const c = colorOf(d.track), y = Y[d.track], x1 = xOf(d.from), x2 = xOf(d.to), on = d === stop, done = day > d.to;
            return (
              <g key={d.act} style={{ cursor: "pointer" }} onClick={() => { setRiding(false); setDay(d.from); }}>
                <line x1={x1} x2={Math.max(x2, x1 + 1)} y1={y} y2={y} stroke={c} strokeWidth={10} strokeLinecap="round" opacity={done || on ? 1 : 0.55} />
                <rect x={(x1 + x2) / 2 - 40} y={y + 14} width={80} height={24} rx={12} fill={on ? c : "#fff"} stroke={c} strokeWidth={on ? 0 : 1.5} />
                <text x={(x1 + x2) / 2} y={y + 30} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={on ? "#fff" : "#1c1b1b"}>{d.act}</text>
                <circle cx={x1} cy={y} r={7} fill="#fff" stroke={c} strokeWidth={3} />
              </g>
            );
          })}
          <g style={{ transform: `translate(${xOf(day)}px, ${Y[stop.track] - 30}px)`, transition: "transform .45s cubic-bezier(.22,1,.36,1)" }}>
            <circle r={11} fill="#e91e63" /><text y={4} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff">{day}</text>
            <path d="M0 11 L0 22" stroke="#e91e63" strokeWidth={2} />
          </g>
        </svg>
      </div>
      <div className={s.metroCtl}>
        <div className={s.day}><small>Day</small>{day} / 30</div>
        <input type="range" min={0} max={30} value={day} onChange={(e) => { setRiding(false); setDay(+e.target.value); }} aria-label="Day of the program" />
        <button className={s.ride} onClick={() => { if (day >= 30) { setDay(0); setRiding(true); } else setRiding(!playing); }}>
          <MaterialSymbol name={playing ? "pause" : "play_arrow"} className={s.ms} />{playing ? "Pause" : "Ride the line"}
        </button>
      </div>
      <div className={s.today} style={{ ["--c" as string]: colorOf(stop.track) }}>
        <span className={s.todayDot}><MaterialSymbol name="location_on" /></span>
        <div><b>{stop.act} · {stop.from === stop.to ? `Day ${stop.from}` : `Days ${stop.from}–${stop.to}`}</b><p>{stop.does}</p></div>
      </div>
    </div>
  );
}
