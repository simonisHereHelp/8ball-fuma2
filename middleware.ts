// middleware.ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

const SIGNIN_URL = "/api/auth/signin?callbackUrl=/docs";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const email = session?.user?.email;

  // 1️⃣ If request is under /docs or /content/docs
  if (pathname.startsWith("/docs") || pathname.startsWith("/content/docs")) {
    // 2️⃣ Allow only your Gmail account
    if (email === "99.cent.bagel@gmail.com") {
      return NextResponse.next();
    }
    // 3️⃣ Otherwise redirect to sign-in
    return NextResponse.redirect(SIGNIN_URL);
  }

  // 4️⃣ For all other routes (not matched) → do nothing
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"], // matches all non-static routes
};
