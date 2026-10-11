/* Access code screen for the Node book — works on any static host (Cloudflare Pages dashboard upload included).
 * Loaded first in <head> on every page: the page stays invisible until the visitor enters the code,
 * then it's remembered on this device for 30 days.
 * Note: this is a soft lock that keeps casual visitors out. The files themselves are still public to anyone who
 * goes looking; for a hard lock, deploy with Wrangler and use the server-side check in /cloudflare/functions.
 * To change the code: put the SHA-256 of "node-book:<new code>" in HASH (node -e "console.log(require('crypto').createHash('sha256').update('node-book:12345').digest('hex'))"). */
(() => {
  "use strict";
  const HASH = "eeb2f630a178cf131c29f2542a7a01b664b7f6dab3032c3d6588296cc2850185";
  const KEY = "node_book_access", DAYS = 30;
  const root = document.documentElement;

  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.h === HASH && v.exp > Date.now(); } catch { return false; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ h: HASH, exp: Date.now() + DAYS * 864e5 })); } catch {} };
  window.NODE_SIGNOUT = () => { try { localStorage.removeItem(KEY); } catch {} location.reload(); };
  if (read()) return;

  root.classList.add("node-locked");
  const css = document.createElement("style");
  css.textContent = `
  html.node-locked, html.node-locked body { overflow: hidden !important; background: #0d1117 !important; }
  html.node-locked body { visibility: hidden !important; }
  #node-gate { visibility: visible; position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px; background: #0d1117; color: #fff; font: 16px/1.5 "Geist", ui-sans-serif, system-ui, sans-serif; overflow: auto; text-align: center; }
  #node-gate::before { content: ""; position: fixed; inset: 0; background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
  #node-gate .ng-g { position: fixed; width: 620px; height: 620px; border-radius: 50%; filter: blur(20px); pointer-events: none; }
  #node-gate .ng-g.a { background: radial-gradient(circle, rgba(233,30,99,.3), transparent 62%); top: -220px; right: -180px; }
  #node-gate .ng-g.b { background: radial-gradient(circle, rgba(0,128,128,.32), transparent 62%); bottom: -260px; left: -200px; }
  #node-gate main { position: relative; width: min(440px, 100%); animation: ngIn .8s cubic-bezier(.22,1,.36,1); }
  @keyframes ngIn { from { opacity: 0; transform: translateY(24px); } }
  #node-gate .ng-logo { color: #fff; display: inline-flex; align-items: center; gap: 10px; font: 900 26px "Montserrat", sans-serif; letter-spacing: -.03em; }
  #node-gate .ng-logo i { width: 38px; height: 38px; border-radius: 11px; background: #fff; display: grid; place-items: center; }
  #node-gate .ng-eb { display: block; margin: 34px 0 10px; font: 700 12px "Geist Mono", monospace; letter-spacing: .2em; text-transform: uppercase; color: #4fd1c5; }
  #node-gate h1 { margin: 0; font: 900 clamp(2rem, 9vw, 2.8rem)/.95 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.045em; color: #fff; }
  #node-gate h1 span { color: #e91e63; }
  #node-gate p { margin: 14px 0 0; color: rgba(255,255,255,.65); }
  #node-gate form { margin-top: 28px; display: grid; gap: 12px; }
  #node-gate input { width: 100%; box-sizing: border-box; padding: 18px; border-radius: 18px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.05); color: #fff; text-align: center; font: 700 28px "Geist Mono", monospace; letter-spacing: .5em; text-indent: .5em; outline: none; transition: border-color .2s, box-shadow .2s; }
  #node-gate input:focus { border-color: #e91e63; box-shadow: 0 0 0 4px rgba(233,30,99,.2); }
  #node-gate input.bad { border-color: #ff6b8b; animation: ngShake .4s; }
  @keyframes ngShake { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
  #node-gate button { padding: 17px; border: 0; border-radius: 999px; background: #e91e63; color: #fff; font: 900 13px "Geist", sans-serif; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; box-shadow: 0 18px 40px -14px rgba(233,30,99,.6); transition: transform .2s; }
  #node-gate button:hover { transform: translateY(-2px); }
  #node-gate .ng-err { min-height: 1.4em; color: #ff8fb4; font-weight: 600; font-size: 14px; }
  #node-gate small { display: block; margin-top: 18px; color: rgba(255,255,255,.4); font-size: 13px; }
  #node-gate.out { transition: opacity .5s; opacity: 0; }`;
  document.head.appendChild(css);

  /* SHA-256 — the browser's own when available, otherwise a small built-in one (some browsers hide crypto.subtle on file://) */
  const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const sha256js = (str) => {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const msg = [...new TextEncoder().encode(str)], bitLen = msg.length * 8;
    msg.push(0x80); while (msg.length % 64 !== 56) msg.push(0);
    for (let i = 7; i >= 0; i--) msg.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    const r = (x, n) => (x >>> n) | (x << (32 - n)), W = new Array(64);
    for (let o = 0; o < msg.length; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = (msg[o + 4 * i] << 24) | (msg[o + 4 * i + 1] << 16) | (msg[o + 4 * i + 2] << 8) | msg[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) W[i] = (W[i - 16] + (r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3)) + W[i - 7] + (r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10))) | 0;
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  };
  const sha = async (t) => { try { if (crypto.subtle) return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))); } catch {} return sha256js(t); };

  const mount = () => {
    const gate = document.createElement("div");
    gate.id = "node-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-label", "Enter access code");
    gate.innerHTML = `<div class="ng-g a"></div><div class="ng-g b"></div><main>
      <div class="ng-logo"><i><svg width="20" height="20" viewBox="0 0 24 24" fill="#0d1117" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><circle cx="4" cy="6" r="2.2"/><circle cx="20" cy="6" r="2.2"/><circle cx="4" cy="18" r="2.2"/><circle cx="20" cy="18" r="2.2"/><path d="M4 6 12 12 20 6M4 18l8-6 8 6" stroke="#0d1117" stroke-width="1.6" fill="none"/></svg></i>Node.</div>
      <span class="ng-eb">Members only</span>
      <h1>Enter your<br><span>access code.</span></h1>
      <p>The Node book, roadmap and toolkit are open to enrolled learners.</p>
      <form novalidate><input type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="Access code" placeholder="•••••" /><span class="ng-err" role="alert"></span><button type="submit">Open the book</button></form>
      <small>Don't have a code? Enroll to get one.</small></main>`;
    document.body.appendChild(gate);
    const input = gate.querySelector("input"), err = gate.querySelector(".ng-err");
    setTimeout(() => input.focus(), 50);
    gate.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = (await sha("node-book:" + input.value.trim())) === HASH;
      if (!ok) {
        err.textContent = "That code didn't work. Try again.";
        input.classList.remove("bad"); void input.offsetWidth; input.classList.add("bad"); input.select();
        return;
      }
      save();
      gate.classList.add("out");
      root.classList.remove("node-locked");
      dispatchEvent(new Event("resize")); // pages that measure themselves (the pitch deck) re-fit now they're visible
      setTimeout(() => gate.remove(), 500);
    });
    /* keep the page's own shortcuts (e.g. the deck's arrow keys) from reacting while the code is typed */
    gate.addEventListener("keydown", (e) => e.stopPropagation());
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
