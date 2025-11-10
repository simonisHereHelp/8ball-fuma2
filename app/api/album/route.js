// app/api/album/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const IMG_DIR = path.join(process.cwd(), "public", "img");
const VALID = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "12", 10),
    48
  );

  try {
    const entries = await fs.readdir(IMG_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (e) => {
        if (!e.isFile()) return null;
        const ext = path.extname(e.name).toLowerCase();
        if (!VALID.has(ext)) return null;

        const stat = await fs.stat(path.join(IMG_DIR, e.name));
        return { name: e.name, mtimeMs: stat.mtimeMs };
      })
    );

    const list = files.filter(Boolean);
    list.sort((a, b) => b.mtimeMs - a.mtimeMs);

    const slice = list.slice(offset, offset + limit);

    const items = slice.map((f) => ({
      id: f.name,
      title: f.name.replace(/\.(jpg|jpeg|png|webp)$/i, ""),
      url: `/img/${encodeURIComponent(f.name)}`,
      createdAt: new Date(f.mtimeMs).toISOString(),
    }));

    return NextResponse.json({
      items,
      total: list.length,
      hasMore: offset + limit < list.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
