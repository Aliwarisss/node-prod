"use client";

import { useEffect, useState } from "react";

import { certBody, certName, certTitle } from "./certificate-fonts";

/* Node's certificate (public/certificate/background.jpg is the design with its variable text cleared — see
 * scripts/build-certificate-art.cjs) with the trainee's details set on it. One layout, in the design's own 2000 × 1416
 * coordinates, drawn two ways: as SVG on the page (sharp at any size), and onto a canvas for the PNG download. */

export const CERT_W = 2000, CERT_H = 1416;
const ORANGE = "#f5a623";
const NAME_MAX = 172, NAME_ROOM = 1000; // the name's largest size, and the width it may take (right-aligned at x 1870)

export type CertDetails = { name: string; program: string; title: string; year: string; line: string; number?: string; verifyUrl?: string };
type Item = { text: string; x: number; y: number; size: number; family: string; weight: number; color: string; anchor: "start" | "end"; spacing?: number };

function layout(d: CertDetails, nameSize: number): Item[] {
  const body = certBody.style.fontFamily, title = certTitle.style.fontFamily, script = certName.style.fontFamily;
  const items: Item[] = [
    /* top left: the program and year (where the design says "Training Program 2021") */
    { text: d.program, x: 82, y: 118, size: 46, family: body, weight: 300, color: "#ffffff", anchor: "start" },
    { text: "Program", x: 82, y: 168, size: 46, family: body, weight: 500, color: "#ffffff", anchor: "start" },
    { text: d.year, x: 82, y: 214, size: 42, family: body, weight: 500, color: "#ffffff", anchor: "start" },
    /* the title */
    { text: "Certificate of", x: 1870, y: 492, size: 98, family: title, weight: 700, color: ORANGE, anchor: "end", spacing: 2 },
    { text: d.title, x: 1872, y: 612, size: 132, family: title, weight: 900, color: "#ffffff", anchor: "end", spacing: 1 },
    /* (the design's own "This Certificate is proudly presented to" sits at y 688) */
    { text: d.name, x: 1870, y: 935, size: nameSize, family: script, weight: 400, color: ORANGE, anchor: "end" },
    { text: d.line, x: 1870, y: 1040, size: 30, family: body, weight: 300, color: "rgba(255,255,255,.82)", anchor: "end" },
  ];
  /* the number and where to check it — two short lines under "CEO of Coderatory", clear of the Coderatory mark */
  if (d.number) items.push({ text: `Certificate No. ${d.number}`, x: 812, y: 1346, size: 20, family: body, weight: 500, color: "rgba(255,255,255,.6)", anchor: "start", spacing: 1 });
  if (d.number && d.verifyUrl) items.push({ text: `Verify at ${d.verifyUrl}`, x: 812, y: 1372, size: 18, family: body, weight: 300, color: "rgba(255,255,255,.5)", anchor: "start" });
  return items;
}

/* the name's size: as large as the design's, smaller only if a long name needs it — measured once the fonts are in */
function useNameSize(name: string) {
  const guess = Math.min(NAME_MAX, Math.round(NAME_ROOM / Math.max(1, name.length * 0.56)));
  const [size, setSize] = useState(guess);
  useEffect(() => {
    let live = true;
    const fam = certName.style.fontFamily;
    document.fonts.load(`400 ${NAME_MAX}px ${fam}`).then(() => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx || !live) return;
      ctx.font = `400 ${NAME_MAX}px ${fam}`;
      const w = ctx.measureText(name).width;
      setSize(w > NAME_ROOM ? Math.floor((NAME_MAX * NAME_ROOM) / w) : NAME_MAX);
    }).catch(() => {});
    return () => { live = false; };
  }, [name]);
  return size;
}

export function CertificateArt({ details, className }: { details: CertDetails; className?: string }) {
  const nameSize = useNameSize(details.name);
  return (
    <svg viewBox={`0 0 ${CERT_W} ${CERT_H}`} className={className} role="img" aria-label={`Certificate of ${details.title} — ${details.name}, ${details.program}`}>
      <image href="/certificate/background.jpg" x="0" y="0" width={CERT_W} height={CERT_H} />
      {layout(details, nameSize).map((t, i) => (
        <text key={i} x={t.x} y={t.y} textAnchor={t.anchor} fill={t.color} style={{ fontFamily: t.family, fontWeight: t.weight, fontSize: t.size, letterSpacing: t.spacing }}>{t.text}</text>
      ))}
    </svg>
  );
}

/* the PNG: the same layout, drawn at full size onto a canvas */
export async function certificatePng(details: CertDetails): Promise<Blob> {
  const families = [certBody, certTitle, certName].map((f) => f.style.fontFamily);
  await Promise.all([
    document.fonts.load(`300 40px ${families[0]}`), document.fonts.load(`500 40px ${families[0]}`),
    document.fonts.load(`700 40px ${families[1]}`), document.fonts.load(`900 40px ${families[1]}`), document.fonts.load(`400 40px ${families[2]}`),
  ]);
  const img = new Image();
  img.src = "/certificate/background.jpg";
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = CERT_W; canvas.height = CERT_H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, CERT_W, CERT_H);
  /* the name's size, as on the page */
  ctx.font = `400 ${NAME_MAX}px ${families[2]}`;
  const w = ctx.measureText(details.name).width;
  const nameSize = w > NAME_ROOM ? Math.floor((NAME_MAX * NAME_ROOM) / w) : NAME_MAX;
  for (const t of layout(details, nameSize)) {
    ctx.font = `${t.weight} ${t.size}px ${t.family}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = t.anchor === "end" ? "right" : "left";
    ctx.textBaseline = "alphabetic";
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${t.spacing ?? 0}px`;
    ctx.fillText(t.text, t.x, t.y);
  }
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("No image"))), "image/png"));
}
