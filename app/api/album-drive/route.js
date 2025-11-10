// app/api/album-drive/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const FOLDER_ID = process.env.GOOGLE_FOLDER_ID;
const PAGE_SIZE_DEFAULT = 12;

export async function GET(req) {
  if (!API_KEY || !FOLDER_ID) {
    return NextResponse.json(
      { error: "Missing GOOGLE_DRIVE_API_KEY or GOOGLE_FOLDER_ID" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? String(PAGE_SIZE_DEFAULT), 10),
    100
  );

  // Fetch all images in the folder (simple version; fine for a modest album)
  const q = encodeURIComponent(
    `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`
  );

  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}` +
    `&fields=files(id,name,modifiedTime)` +
    `&key=${API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Drive API error", detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();
  const files = (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
  }));

  // sort newest first
  files.sort(
    (a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime)
  );

  const slice = files.slice(offset, offset + limit);

  const items = slice.map((f) => ({
    id: f.id,
    title: f.name,
    url: `https://drive.google.com/uc?id=${encodeURIComponent(f.id)}`,
    createdAt: f.modifiedTime || new Date().toISOString(),
  }));

  return NextResponse.json({
    items,
    total: files.length,
    hasMore: offset + limit < files.length,
  });
}
