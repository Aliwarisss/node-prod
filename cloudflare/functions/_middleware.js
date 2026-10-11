/* Server-side access gate for the Node book — OPTIONAL, for a hard lock. Not used by dashboard uploads
 * (they can't run Functions); the-book/shared/gate.js handles the code there. To use this instead, deploy with Wrangler
 * from this folder so it picks up ./functions:  cd cloudflare && npx wrangler pages deploy ../the-book --project-name <name>
 *
 * Access gate for the Node book on Cloudflare Pages.
 * Every request (pages, scripts, data) needs the access code once; after that a signed cookie lets the visitor in
 * for 30 days. The check runs on Cloudflare's servers, so the code never reaches the browser.
 *
 * Set the code in Cloudflare: Pages project → Settings → Variables and secrets → BOOK_ACCESS_CODE (as a secret).
 * Changing it signs everyone out. Until it's set, the fallback below is used.
 * Optional: BOOK_ACCESS_SALT (any random string) to make the cookie unguessable even if the code leaks. */
const FALLBACK_CODE = "41304";
const COOKIE = "node_book_access";
const MAX_AGE = 60 * 60 * 24 * 30;

const sha256 = async (text) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
/* only same-site paths, never "//host" */
const safeNext = (v) => { const s = String(v || "/"); return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/"; };
const readCookie = (req, name) => {
  const hit = (req.headers.get("Cookie") || "").split(/;\s*/).find((c) => c.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : "";
};

export async function onRequest({ request, env, next }) {
  const code = String(env.BOOK_ACCESS_CODE || FALLBACK_CODE).trim();
  const token = await sha256(`${env.BOOK_ACCESS_SALT || "node-book"}:${code}`);
  const url = new URL(request.url);
  const secure = url.protocol === "https:" ? "; Secure" : "";

  if (url.pathname === "/__access" && request.method === "POST") {
    const form = await request.formData();
    const dest = safeNext(form.get("next"));
    if (String(form.get("code") || "").trim() === code) {
      return new Response(null, { status: 303, headers: { Location: dest, "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure}`, "Cache-Control": "no-store" } });
    }
    await new Promise((r) => setTimeout(r, 900)); // slow down guessing
    return gate(dest, true);
  }
  if (url.pathname === "/__signout") {
    return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`, "Cache-Control": "no-store" } });
  }
  if (readCookie(request, COOKIE) === token) return next();
  return gate(url.pathname + url.search, false);
}

function gate(dest, wrong) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Node · Enter access code</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@700&family=Montserrat:wght@900&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { display: grid; place-items: center; padding: 24px 16px; background: #0d1117; color: #fff; font: 16px/1.5 "Geist", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  body::before { content: ""; position: fixed; inset: 0; background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px); background-size: 24px 24px; }
  .glow { position: fixed; width: 620px; height: 620px; border-radius: 50%; filter: blur(20px); pointer-events: none; }
  .glow.a { background: radial-gradient(circle, rgba(233,30,99,.3), transparent 62%); top: -220px; right: -180px; }
  .glow.b { background: radial-gradient(circle, rgba(0,128,128,.32), transparent 62%); bottom: -260px; left: -200px; }
  main { position: relative; width: min(440px, 100%); text-align: center; animation: in .8s cubic-bezier(.22,1,.36,1); }
  @keyframes in { from { opacity: 0; transform: translateY(24px); } }
  .logo { display: inline-flex; align-items: center; gap: 10px; font: 900 26px "Montserrat", sans-serif; letter-spacing: -.03em; }
  .logo i { width: 38px; height: 38px; border-radius: 11px; background: #fff; display: grid; place-items: center; }
  .eb { display: block; margin: 34px 0 10px; font: 700 12px "Geist Mono", monospace; letter-spacing: .2em; text-transform: uppercase; color: #4fd1c5; }
  h1 { font: 900 clamp(2rem, 9vw, 2.8rem)/.95 "Montserrat", sans-serif; text-transform: uppercase; letter-spacing: -.045em; }
  h1 span { color: #e91e63; }
  p { margin-top: 14px; color: rgba(255,255,255,.65); }
  form { margin-top: 28px; display: grid; gap: 12px; }
  input { width: 100%; padding: 18px; border-radius: 18px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.05); color: #fff; text-align: center; font: 700 28px "Geist Mono", monospace; letter-spacing: .5em; text-indent: .5em; outline: none; transition: border-color .2s, box-shadow .2s; }
  input:focus { border-color: #e91e63; box-shadow: 0 0 0 4px rgba(233,30,99,.2); }
  input.bad { border-color: #ff6b8b; animation: shake .4s; }
  @keyframes shake { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
  button { padding: 17px; border: 0; border-radius: 999px; background: #e91e63; color: #fff; font: 900 13px "Geist", sans-serif; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; box-shadow: 0 18px 40px -14px rgba(233,30,99,.6); transition: transform .2s; }
  button:hover { transform: translateY(-2px); }
  .err { color: #ff8fb4; font-weight: 600; font-size: 14px; }
  small { display: block; margin-top: 22px; color: rgba(255,255,255,.4); font-size: 13px; }
</style>
</head>
<body>
<div class="glow a"></div><div class="glow b"></div>
<main>
  <div class="logo"><i><svg width="20" height="20" viewBox="0 0 24 24" fill="#0d1117"><circle cx="12" cy="12" r="3.2"/><circle cx="4" cy="6" r="2.2"/><circle cx="20" cy="6" r="2.2"/><circle cx="4" cy="18" r="2.2"/><circle cx="20" cy="18" r="2.2"/><path d="M4 6 12 12 20 6M4 18l8-6 8 6" stroke="#0d1117" stroke-width="1.6" fill="none"/></svg></i>Node.</div>
  <span class="eb">Members only</span>
  <h1>Enter your<br><span>access code.</span></h1>
  <p>The Node book, roadmap and toolkit are open to enrolled learners.</p>
  <form method="post" action="/__access">
    <input name="code" type="password" ${wrong ? 'class="bad" ' : ""}inputmode="numeric" autocomplete="off" maxlength="12" required autofocus aria-label="Access code" placeholder="•••••" />
    ${wrong ? '<span class="err" role="alert">That code didn\'t work. Try again.</span>' : ""}
    <input type="hidden" name="next" value="${esc(dest)}" />
    <button type="submit">Open the book</button>
  </form>
  <small>Don't have a code? Enroll to get one.</small>
</main>
<script>
  /* keep the #section the visitor was heading to (the server never sees it) */
  if (location.hash) { var n = document.querySelector('[name=next]'); n.value = n.value.split('#')[0] + location.hash; }
</script>
</body>
</html>`;
  return new Response(html, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
