import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { DEVICE_COOKIE, isActiveSession, SESSION_COOKIES } from "@/lib/auth/sessions";

const protectedRoutes = ["/dashboard"];
const guestOnlyRoutes = ["/login", "/register"];

/* every browser carries a device id, so a sign-in can tell "this same browser again" from "another device or browser"
   (an account is signed in on one at a time) */
export async function proxy(request: NextRequest) {
  /* if the proxy itself fails (the session check can't reach the database), let the request through — the page has
     its own sign-in check — rather than failing every page */
  const res = await route(request).catch((error: unknown) => {
    console.error("proxy: passing the request through after an error", error);
    return NextResponse.next();
  });
  if (!request.cookies.get(DEVICE_COOKIE)) {
    res.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 730 });
  }
  return res;
}

async function route(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const productWorkspacePrefix = "/dashboard/projects/";
  if (
    pathname.startsWith(productWorkspacePrefix) &&
    pathname !== "/dashboard/projects/"
  ) {
    const productId = pathname.slice(productWorkspacePrefix.length);

    if (productId) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.pathname = "/dashboard/projects";
      nextUrl.searchParams.set("productId", productId);
      nextUrl.searchParams.delete("roadmapId");
      return NextResponse.redirect(nextUrl);
    }
  }

  /* old /dashboard/roadmap/<projectId> links → projects; /dashboard/roadmap/day/<n> is the 30-day program */
  const legacyRoadmapPrefix = "/dashboard/roadmap/";
  if (pathname.startsWith(legacyRoadmapPrefix) && !pathname.startsWith("/dashboard/roadmap/day/")) {
    const roadmapId = pathname.slice(legacyRoadmapPrefix.length);

    if (roadmapId) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.pathname = `/dashboard/projects/${roadmapId}`;
      nextUrl.searchParams.delete("roadmapId");
      return NextResponse.redirect(nextUrl);
    }
  }

  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV === "development" ? "node-dev-auth-secret" : undefined),
  });

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isGuestOnlyRoute = guestOnlyRoutes.some((route) => pathname.startsWith(route));

  /* one device at a time: a session is only ever ended by an admin signing the account out everywhere — then clear
     its cookie and say why on the sign-in page (a sign-in elsewhere is refused instead, never ends this one) */
  if (token?.sub && !(await isActiveSession(token.sub, token.sid))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("ended", "elsewhere");
    if (isProtectedRoute) loginUrl.searchParams.set("callbackUrl", pathname);
    const res = pathname.startsWith("/login") ? NextResponse.next() : NextResponse.redirect(loginUrl);
    for (const c of request.cookies.getAll()) if (SESSION_COOKIES.some((n) => c.name === n || c.name.startsWith(`${n}.`))) res.cookies.delete(c.name);
    return res;
  }
  const isAuthenticated = Boolean(token);

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnlyRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
