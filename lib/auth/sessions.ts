import { randomUUID } from "node:crypto";

import { connectToDatabase } from "@/lib/mongodb";
import { LoginEventModel } from "@/lib/models/login-event";
import { UserModel } from "@/lib/models/user";

/* One device and browser at a time. Every browser carries a device id (a long-lived cookie). The first sign-in holds
   the account: signing in from any other device or browser is refused with a message saying where it's signed in —
   the session already signed in is never signed out by it. The account is let go when that session signs out, when
   its sign-in has expired on its own (unused for the whole session lifetime), or when an admin signs it out
   everywhere (a lost device). The same browser signing in again is fine — it's the same device. */

export const SESSION_DAYS = 30; // next-auth's session lifetime — a session unused this long has expired anyway
const HOLD = SESSION_DAYS * 24 * 60 * 60_000;
export const DEVICE_COOKIE = "node_did";
/* the cookies next-auth keeps the session in (plain on http, __Secure- on https; long tokens are chunked) */
export const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];
/* what a refused sign-in throws — the sign-in form reads it: ACTIVE_ELSEWHERE|<browser on system>|<last used, ISO> */
export const BLOCKED = "ACTIVE_ELSEWHERE";

type Headers = Record<string, string | string[] | undefined> | undefined;
const header = (h: Headers, k: string) => {
  const v = h?.[k] ?? h?.[k.toLowerCase()];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};
const cookieOf = (h: Headers, name: string) => header(h, "cookie").split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";

/* a readable name for the browser and the system, from the user agent */
export function describeAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : ua ? "Browser" : "Unknown";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const device = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobile" : "desktop";
  return { browser, os, device };
}

type Active = { activeSid?: string; activeDid?: string; activeSeenAt?: Date; activeAgent?: string };

/* a sign-in asks for the account. Refused (with where it's held) while another device or browser holds it; otherwise
   it becomes the account's one session — succeeding this same browser's earlier one, or one that has expired */
export async function claimSession(userId: string, headers: Headers): Promise<{ ok: true; sid: string } | { ok: false; agent: string; seenAt: Date }> {
  await connectToDatabase();
  const at = new Date();
  const ua = header(headers, "user-agent").slice(0, 400);
  const ip = (header(headers, "x-forwarded-for").split(",")[0] || header(headers, "x-real-ip")).trim().slice(0, 64);
  const did = cookieOf(headers, DEVICE_COOKIE).slice(0, 64);
  const who = describeAgent(ua);
  const u = await UserModel.findById(userId, { activeSid: 1, activeDid: 1, activeSeenAt: 1, activeAgent: 1 }).lean<Active>();

  const held = !!u?.activeSid && !!u.activeSeenAt && at.getTime() - new Date(u.activeSeenAt).getTime() < HOLD;
  if (held && (!did || u!.activeDid !== did)) {
    await LoginEventModel.create({ userId, sid: `blocked-${randomUUID()}`, at, ip, ua, did, ...who, endedAt: at, endedReason: "blocked" });
    return { ok: false, agent: u!.activeAgent || "another device", seenAt: new Date(u!.activeSeenAt!) };
  }

  const sid = randomUUID();
  await LoginEventModel.updateMany({ userId, endedAt: { $exists: false } }, { $set: { endedAt: at, endedReason: "replaced" } });
  await Promise.all([
    LoginEventModel.create({ userId, sid, at, ip, ua, did, ...who }),
    UserModel.updateOne({ _id: userId }, { $set: { activeSid: sid, activeDid: did, activeSeenAt: at, activeAgent: `${who.browser} on ${who.os}`, lastLoginAt: at } }),
  ]);
  cache.set(userId, { sid, at: Date.now() });
  touched.set(userId, Date.now());
  return { ok: true, sid };
}

/* signing out lets go of the account (it doesn't touch a newer session elsewhere) */
export async function endSession(userId: string, sid: string | undefined) {
  if (!sid) return;
  await connectToDatabase();
  await Promise.all([
    LoginEventModel.updateOne({ sid, endedAt: { $exists: false } }, { $set: { endedAt: new Date(), endedReason: "signout" } }),
    UserModel.updateOne({ _id: userId, activeSid: sid }, { $unset: { activeSid: 1, activeDid: 1, activeSeenAt: 1, activeAgent: 1 } }),
  ]);
  cache.delete(userId);
}

/* an admin signs an account out everywhere (a lost or shared device): its session ends on its next request */
export async function revokeSessions(userId: string) {
  await connectToDatabase();
  await Promise.all([
    LoginEventModel.updateMany({ userId, endedAt: { $exists: false } }, { $set: { endedAt: new Date(), endedReason: "revoked" } }),
    UserModel.updateOne({ _id: userId }, { $unset: { activeSid: 1, activeDid: 1, activeSeenAt: 1, activeAgent: 1 }, $set: { sessionsRevokedAt: new Date() } }),
  ]);
  cache.delete(userId);
}

/* is this token's session still the account's one? A match is remembered for a few seconds, so a page's many checks
   cost one lookup; a mismatch is always confirmed against the database (the proxy and the app keep separate memories).
   Use keeps the session held: it's marked as seen at most once a minute.
   Tokens from before this started (no sid) stay valid until the account is revoked or signs in again. */
const cache = new Map<string, { sid: string | null; at: number }>();
const touched = new Map<string, number>();
const TTL = 5_000;
export async function isActiveSession(userId: string, sid: string | undefined) {
  const ok = (active: string | null) => (sid ? active === sid : active === null);
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL && ok(hit.sid)) return true;
  /* the database unreachable (connecting or querying) — don't sign anyone out, or take the site down with it */
  const u = await connectToDatabase()
    .then(() => UserModel.findById(userId, { activeSid: 1, sessionsRevokedAt: 1 }).lean<{ activeSid?: string; sessionsRevokedAt?: Date }>())
    .catch(() => undefined);
  if (u === undefined) return true; // the database is unreachable — don't sign everyone out
  if (u === null) return false; // the account is gone
  const active = u.activeSid ?? null;
  cache.set(userId, { sid: active, at: Date.now() });
  /* an old sid-less token: fine, unless an admin has since signed the account out */
  if (!sid) return !u.sessionsRevokedAt && (active === null);
  if (!ok(active)) return false;
  if (Date.now() - (touched.get(userId) ?? 0) > 60_000) {
    touched.set(userId, Date.now());
    await UserModel.updateOne({ _id: userId, activeSid: sid }, { $set: { activeSeenAt: new Date() } }).catch(() => null);
  }
  return true;
}

/* an account's recent sign-ins (and refused attempts), newest first */
export async function recentSignIns(userId: string, limit = 6) {
  await connectToDatabase();
  const rows = await LoginEventModel.find({ userId }).sort({ at: -1 }).limit(limit).lean();
  return rows.map((r) => ({
    sid: r.sid, at: r.at.toISOString(), browser: r.browser ?? "", os: r.os ?? "", device: r.device ?? "", ip: r.ip ?? "",
    endedAt: r.endedAt ? r.endedAt.toISOString() : null, endedReason: (r.endedReason ?? null) as SignInEnd | null,
  }));
}
export type SignInEnd = "signout" | "replaced" | "blocked" | "revoked";
