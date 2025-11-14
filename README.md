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

| Area                     | Files / Folders                                                                 | Role in 8ball-fuma2                                                                                           |
|--------------------------|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| OAuth (NextAuth + gate)  | `auth.js`                                                                        | Central NextAuth config: Google provider only, JWT sessions, intended to enforce single Gmail account.        |
|                          | `app/api/auth/[...nextauth]/route.js`                                           | Exposes `GET`/`POST` from `auth.js` as the `/api/auth/[...nextauth]` API route.                               |
|                          | `middleware.ts`                                                                  | Edge middleware: reads `req.auth.user.email`, gates `/docs` & `/content/docs`, redirects to sign-in URL.      |
|                          | `app/page.tsx`                                                                   | Landing page: calls `auth()`, redirects to `/api/auth/signin?callbackUrl=/docs`, hard-gates `99.cent.bagel`.  |
| Google Drive (content)   | `lib/remote-page.ts`                                                             | Server helper to pull **remote MD/JSON docs from a Drive folder** via `GOOGLE_DRIVE_API_KEY` + FOLDER_ID.     |
| Google Drive (album)     | `app/api/album-drive/route.js`                                                  | Node runtime API route: lists files in a specific **Drive folder** via REST API + API key, returns JSON list. |
|                          | `lib/InfiniteAlbumDrive.tsx`                                                    | Client component using `swr` infinite loader to render scrollable Drive-based image cards from that API.      |
| FumaDocs core (docs UI)  | `source.config.ts`                                                               | FumaDocs MDX config: `content/docs` collection, schemas, processed markdown.                                  |
|                          | `lib/source.ts`                                                                  | FumaDocs source loader (`loader()` + `docs.toFumadocsSource()`), OG image + LLM text helpers.                 |
|                          | `lib/layout.shared.tsx`                                                          | Shared layout options (`nav.title = 'My App'`) used by FumaDocs layouts.                                      |
|                          | `mdx-components.tsx`                                                             | Exposes `getMDXComponents` to plug FumaDocs MDX components into pages.                                        |
|                          | `app/layout.tsx`                                                                 | Root layout using `fumadocs-ui`’s `RootProvider`.                                                             |
|                          | `app/(home)/layout.tsx`                                                         | Home layout using `HomeLayout` from `fumadocs-ui/layouts/home`.                                               |
|                          | `app/docs/layout.tsx`                                                            | Docs layout using `DocsLayout` from `fumadocs-ui/layouts/docs`.                                               |
|                          | `app/docs/[[...slug]]/page.tsx`                                                 | Main docs page: resolves slug via FumaDocs `source`, falls back to `getRemotePage` (Drive) when needed.      |
|                          | `app/api/search/route.ts`                                                       | Docs search endpoint built from FumaDocs source.                                                              |
|                          | `app/llms-full.txt/route.ts`                                                    | Exports full docs text for LLM ingestion using `getLLMText(source)`.                                          |
|                          | `app/og/docs/[...slug]/route.tsx`                                               | OG-image generator for docs pages using FumaDocs’ OG helper.                                                  |
| z_album (local images)   | `app/api/album/route.js`                                                        | Lists `public/img` files (JPEG/PNG/WEBP) with paging; returns `{items,total,hasMore}`.                        |
|                          | `lib/InfiniteAlbum.tsx`                                                         | Infinite-scroll client grid consuming `/api/album` with `swr/infinite`.                                       |
|                          | `content/docs/z_album.mdx`                                                      | FumaDocs page that imports `<InfiniteAlbum />` and exposes “Local Album” under `/docs/z_album`.               |
| z_album2 (Drive images)  | `app/api/album-drive/route.js` (same as above)                                  | Drive folder listing for images (no paging yet, `hasMore:false`).                                             |
|                          | `lib/InfiniteAlbumDrive.tsx`                                                    | Infinite-scroll client over `/api/album-drive`, renders Drive thumbnails/links.                               |
|                          | `content/docs/z_album2.mdx`                                                     | FumaDocs page that imports `<InfiniteAlbumDrive />` under `/docs/z_album2`.                                   |

---
## OAuth behavior, email gate, and redirect paths

| Context / Path                         | Behavior                                                                                           | `user.email` usage                                      | Redirect / Target                                     |
|---------------------------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------|-------------------------------------------------------|
| Initial landing `/` (app/page.tsx)    | Calls `auth()` server-side. If no session → immediately `redirect("/api/auth/signin?callbackUrl=/docs/Bank-Sec")`. | Checks `session.user.email` after auth.                 | Not-signed-in → `/api/auth/signin?callbackUrl=/docs`. |
| Landing with allowed email            | If signed-in and `session.user.email === "99.cent.bagel@gmail.com"` → `redirect("/docs/Bank-Sec")`.         | Uses strict equality against hard-coded Gmail.          | `/docs` (FumaDocs root).                              |
| Landing with *other* signed-in email  | Session exists but email ≠ allowed → show minimal page with **Sign in** link back to Google sign-in. | Re-prompts sign-in to try again with the allowed Gmail. | Link to `/api/auth/signin?callbackUrl=/docs`.         |
| Middleware for `/docs` & `/content/docs` | Runs on Edge via `auth()` wrapper. Computes `isAllowed = (email === "99.cent.bagel@gmail.com")`. If not allowed → redirect. | Reads `req.auth.user.email` from NextAuth.             | Redirects to `/api/auth/signin?callbackUrl=/docs/Bank-Sec`. |
| Middleware for `/` (landing)          | Also intercepts `/` and redirects to the same sign-in URL (before app/page.tsx logic runs).        | Same `isAllowed` check.                                 | `/api/auth/signin?callbackUrl=/docs/Bank-Sec`.        |
| Other paths (non-docs, non-static)    | Middleware allows them (`NextResponse.next()`), no email gate enforced.                            | `email` is read but not used to block.                  | Stays on requested path.                              |
| NextAuth core (`auth.js`)             | Configured with Google provider, JWT sessions, no DB adapter. Comments say “enforces single account (99.cent.bagel)” and “shows account picker every time.” | Populates `token.email/name/picture`, then copies into `session.user`. | Redirect behavior itself is primarily in `app/page.tsx` + middleware. |

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

### Google DRIVE Id + Next 14

```
Next.js+MDX 預設會使用 next/image 元件來自動最佳化圖片。然而，next/image 要求您在 next.config.js 檔案中明確設定允許的外部圖片網域。
Google Drive 的圖片 URL https://drive.google.com 是一個通用的網域，而不是一個圖片 CDN 網域。此外，您提供的 URL 格式雖然可以顯示圖片，但在 Next.js 14 的嚴格配置下可能無法直接使用。
```
next.config.mjs= 
![alt text](./public/img/readme_next_config.png)

