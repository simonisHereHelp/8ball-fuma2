// app/api/album-drive/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function GET() {
  if (!API_KEY || !FOLDER_ID) {
    return NextResponse.json(
      { error: "Missing GOOGLE_DRIVE_API_KEY or GOOGLE_DRIVE_FOLDER_ID" },
      { status: 500 }
    );
  }

  const q = encodeURIComponent(
    `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`
  );

  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,thumbnailLink,webContentLink,modifiedTime)&key=${API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Drive API fetch failed", detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();
  const files = (data.files || []).map((f) => ({
    id: f.id,
    title: f.name,
    url: f.webContentLink || f.thumbnailLink,
    createdAt: f.modifiedTime,
  }));

  return NextResponse.json({
    items: files,
    total: files.length,
    hasMore: false,
  });
}
