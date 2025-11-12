// middleware.ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const email = req.auth?.user?.email;
  const isAllowed = email === "99.cent.bagel@gmail.com";

  // Build once (absolute URL for Edge)
  const signInUrl = new URL("/api/auth/signin", origin);
  signInUrl.searchParams.set("callbackUrl", "/docs/Bank-Sec");

  // 1) Force sign-in on landing
  if (pathname === "/") {
    return NextResponse.redirect(signInUrl);
  }

  // 2) Gate docs-only
  if (pathname.startsWith("/docs") || pathname.startsWith("/content/docs")) {
    if (isAllowed) return NextResponse.next();
    return NextResponse.redirect(signInUrl);
  }

  // 3) Allow everything else
  return NextResponse.next();
});

export const config = {
  // exclude Next internals and all API routes from middleware
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
