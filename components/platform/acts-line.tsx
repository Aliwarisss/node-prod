"use client";

import { useState } from "react";

import { actModel, tracks } from "@/lib/platform-data";

import s from "./platform.module.css";

const colorOf = (track: string) => tracks.find((t) => t.id === track)?.color ?? "#008080";

/* The eight acts on one quiet line; hover or click an act to read it */
export function ActsLine() {
  const [on, setOn] = useState(0);
  const act = actModel[on];

  return (
    <div className={s.actsWrap}>
      <ol className={s.actsLine}>
        {actModel.map((a, i) => (
          <li key={a.id}>
            <button
              type="button"
              className={`${s.actItem} ${i === on ? s.actItemOn : ""}`}
              style={{ ["--c" as string]: colorOf(a.track) }}
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(i)}
              aria-pressed={i === on}
            >
              <small>{a.n}</small>
              <span>{a.name}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className={s.actRead} key={act.id} style={{ ["--c" as string]: colorOf(act.track) }}>
        <p className={s.actQ}>{act.q}</p>
        <p className={s.actMeta}>
          <span>{tracks.find((t) => t.id === act.track)?.name} track</span>
          <span>Gate · {act.gate}</span>
          <span>{act.days} of Copy, Paste, Go</span>
        </p>
      </div>
    </div>
  );
}
