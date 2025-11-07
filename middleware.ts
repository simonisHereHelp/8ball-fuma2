// middleware.ts
import { auth } from "./auth";
import { NextResponse } from "next/server";


export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const email = session?.user?.email;
  const SIGNIN_URL = `${origin}/api/auth/signin?callbackUrl=/docs`;

  // 1️⃣ If root path `/`, always send to OAuth sign-in
  if (pathname === "/") {
    return NextResponse.redirect(SIGNIN_URL);
  }

  // 2️⃣ If request is under /docs or /content/docs
  if (pathname.startsWith("/docs") || pathname.startsWith("/content/docs")) {
    // allow only your Gmail account
    if (email === "99.cent.bagel@gmail.com") {
      return NextResponse.next();
    }
    // otherwise restart OAuth
    return NextResponse.redirect(SIGNIN_URL);
  }

  // 3️⃣ All other routes behave as before
  return NextResponse.next();
});

export const config = {
  // keep this: apply middleware to all non-static, non-API routes (includes `/`)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
