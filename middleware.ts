// middleware.ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const session = req.auth;
  const email = session?.user?.email;

  // Always absolute URL for Edge redirects
  const SIGNIN_URL = `${origin}/api/auth/signin?callbackUrl=/docs`;

  // 1️⃣ Root path -> force login
  if (pathname === "/") {
    return NextResponse.redirect(SIGNIN_URL);
  }

  // 2️⃣ Protect docs
  if (pathname.startsWith("/docs") || pathname.startsWith("/content/docs")) {
    // Allow only if the session is valid AND Gmail matches
    if (email === "99.cent.bagel@gmail.com") {
      return NextResponse.next();
    }

    // Clear any existing cookies/session before redirect
    const res = NextResponse.redirect(SIGNIN_URL);
    res.cookies.delete("next-auth.session-token");
    res.cookies.delete("__Secure-next-auth.session-token");
    res.cookies.delete("next-auth.csrf-token");
    return res;
  }

  // 3️⃣ Everything else: allow
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
