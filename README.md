# 8ball-fuma2 Project Summary
Nov 12, 2025

## Features and Modules

| Feature / Module                    | Enabled | Core Implementation / Notes |
|------------------------------------|:-------:|------------------------------|
| **OAuth**                          | ✅ Yes  | `auth.ts` + `middleware.ts` — Google OAuth via **Auth.js**; redirect URI `/api/auth/callback/google` |
| **Email Gate (99.cent.bagel)**     | ✅ Yes  | Restricted login via `auth.ts → signIn()` returning `true/false`; gated in `middleware.ts` for `/docs` and `/content/docs` |
| **FumaDocs**                       | ✅ Yes  | `[[...docs]]` dynamic slug pages; `layout.tsx` / `page.tsx` |
| **TOCs (Local)**                   | ✅ Yes  | FumaDocs static rendering supports local TOC generation |
| **TOCs (Remote)**                  | ❌ No   | Hard-wired in `z_album2.mdx` (no dynamic TOC) |
| **SWR (Infinite Scroll)**          | ✅ Yes  | Implemented via `swr` + `lib/InfiniteAlbum` |
| **Album-like UI**                  | ✅ Yes  | `z_album.mdx` and `z_album2.mdx` — grid-based image layout |
| **Drive Images (CORS-blocked)**    | ⚠️ Fail | Only icons shown; raw image fetch restricted by Google Drive CORS policy |

---

## Env Variables and Short Verbose

| Variable | Description / Usage |
|-----------|--------------------|
| `AUTH_TRUST_HOST` | Required for Vercel Edge runtime — enables trusted host cookies |
| `GOOGLE_DRIVE_API_KEY` | (Optional) Public key for metadata-only access if needed |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret from Google Cloud Console |
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `GOOGLE_DRIVE_FOLDER_ID` | Target folder ID for Drive integrations or album rendering |
| `AUTH_SECRET` | Random long string for signing JWTs and cookies |
| `NEXTAUTH_URL` | Base URL of deployed site (e.g., `https://8ball-fuma2.vercel.app`) |

---

**Current OAuth Redirect URI**
```
https://8ball-fuma2.vercel.app/api/auth/callback/google
```

(plus localhost variant for local testing)

**Login behavior:**  
Only `99.cent.bagel@gmail.com` may access `/docs/*` and `/content/docs/*`.  

All others are redirected to `/api/auth/signin?callbackUrl=/docs/Bank-Sec`.

### Fumadocs MDX

A `source.config.ts` config file has been included, you can customise different options like frontmatter schema.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.


