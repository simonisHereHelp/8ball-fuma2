const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

export async function GET(_req, { params }) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!apiKey || !folderId) {
    return new Response("Google Drive is not configured", { status: 500 });
  }

  const fileId = params?.id;
  if (!fileId) {
    return new Response("Missing file id", { status: 400 });
  }

  const driveUrl = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`
  );
  driveUrl.searchParams.set("alt", "media");
  driveUrl.searchParams.set("key", apiKey);

  try {
    const response = await fetch(driveUrl, {
      headers: { Accept: "*/*" },
      next: { revalidate: 60 },
    });

    if (!response.ok || !response.body) {
      const message = await response.text();
      const status = response.status >= 400 ? response.status : 502;
      return new Response(message || "Failed to fetch image", { status });
    }

    const headers = new Headers();
    headers.set("Cache-Control", CACHE_CONTROL);

    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Failed to proxy Drive image", error);
    return new Response("Failed to proxy image", { status: 502 });
  }
}
