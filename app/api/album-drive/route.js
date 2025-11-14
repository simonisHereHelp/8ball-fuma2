import { NextResponse } from "next/server";

const MAX_PAGE_SIZE = 100;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

async function fetchDrivePage({ folderId, apiKey, pageSize, pageToken }) {
  const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
  const fields = [
    "files(id,name,createdTime,mimeType,thumbnailLink,imageMediaMetadata/width,imageMediaMetadata/height)",
    "nextPageToken",
  ].join(",");
  const orderBy = "createdTime desc";
  const params = new URLSearchParams({
    q: query,
    fields,
    orderBy,
    pageSize: String(pageSize),
    key: apiKey,
  });
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Cache for a short period to avoid hammering Drive while still picking up new uploads.
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive request failed (${res.status}): ${text}`);
  }

  return res.json();
}

function normaliseNumber(value, fallback) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req) {
  const url = new URL(req.url);
  const limitParam = normaliseNumber(url.searchParams.get("limit"), DEFAULT_LIMIT);
  const offsetParam = normaliseNumber(url.searchParams.get("offset"), 0);

  const limit = Math.max(1, Math.min(limitParam, MAX_LIMIT));
  const offset = Math.max(0, offsetParam);

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId || !apiKey) {
    return NextResponse.json(
      { error: "Google Drive is not configured", items: [], hasMore: false },
      { status: 500 }
    );
  }

  const targetCount = offset + limit + 1;
  let collected = [];
  let pageToken = undefined;

  try {
    while (collected.length < targetCount) {
      const remaining = targetCount - collected.length;
      const pageSize = Math.min(remaining, MAX_PAGE_SIZE);
      const page = await fetchDrivePage({
        folderId,
        apiKey,
        pageSize,
        pageToken,
      });

      const files = Array.isArray(page.files) ? page.files : [];
      collected = collected.concat(files);

      if (!page.nextPageToken) {
        pageToken = undefined;
        break;
      }

      pageToken = page.nextPageToken;
    }

    const slice = collected.slice(offset, offset + limit);

    const items = slice.map((file) => {
      const createdAt = file.createdTime ?? null;
      const width = file.imageMediaMetadata?.width
        ? Number(file.imageMediaMetadata.width)
        : null;
      const height = file.imageMediaMetadata?.height
        ? Number(file.imageMediaMetadata.height)
        : null;

      const viewUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      const thumbnailUrl = file.thumbnailLink
        ? // Request a larger thumbnail if Google provides the standard s220 size.
          file.thumbnailLink.replace(/=s(\d+)(-c)?$/, "=s1200")
        : `https://drive.google.com/thumbnail?id=${file.id}`;

      return {
        id: file.id,
        title: file.name ?? "Untitled",
        createdAt,
        mimeType: file.mimeType ?? "",
        url: viewUrl,
        downloadUrl,
        imageUrl: `/api/album-drive/${file.id}/image`,
        thumbnailUrl,
        width,
        height,
      };
    });

    const hasMore =
      collected.length > offset + slice.length || typeof pageToken === "string";

    return NextResponse.json({ items, hasMore });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load Google Drive images", items: [], hasMore: false },
      { status: 502 }
    );
  }
}