// middleware.ts
export { auth as middleware } from "./auth";

export const config = {
  // Protect /main and /docs (adjust paths as you like)
  matcher: ["/docs/:path*", "/content/docs/:path*"],
};
