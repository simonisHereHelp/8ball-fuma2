"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";

type DriveAlbumItem = {
  id: string;
  title: string;
  createdAt: string | null;
  mimeType: string;
  url: string;
  downloadUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
};

type AlbumResponse = {
  items: DriveAlbumItem[];
  hasMore: boolean;
  error?: string;
};

const PAGE_SIZE = 12;

const fetcher = async (url: string): Promise<AlbumResponse> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
};

const getKey = (pageIndex: number, previousPageData: AlbumResponse | null) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  const offset = pageIndex * PAGE_SIZE;
  return `/api/album-drive?offset=${offset}&limit=${PAGE_SIZE}`;
};

function DriveImage({ item }: { item: DriveAlbumItem }) {
  const [src, setSrc] = useState(item.imageUrl);
  const [hasFallback, setHasFallback] = useState(false);

  useEffect(() => {
    setSrc(item.imageUrl);
    setHasFallback(false);
  }, [item.imageUrl, item.thumbnailUrl]);

  const handleError = () => {
    if (hasFallback) return;
    if (item.thumbnailUrl) {
      setSrc(item.thumbnailUrl);
      setHasFallback(true);
      return;
    }
    if (item.url && item.url !== src) {
      setSrc(item.url);
      setHasFallback(true);
    }
  };

  const aspectRatio =
    item.width && item.height ? `${item.width} / ${item.height}` : "4 / 3";

  return (
    <img
      src={src}
      alt={item.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="block h-auto w-full object-cover"
      style={{ aspectRatio }}
      onError={handleError}
    />
  );
}

export default function InfiniteAlbumDrive() {
  const { data, size, setSize, isValidating, error } = useSWRInfinite(
    getKey,
    fetcher
  );

  const items = useMemo(() => {
    if (!data) return [] as DriveAlbumItem[];
    return data.flatMap((page) => page.items);
  }, [data]);

  const hasMore = data?.[data.length - 1]?.hasMore ?? false;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "300px" }
    );

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasMore, isValidating, setSize]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6">
        {items.map((item) => {
          const createdAt = item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : "";

          return (
            <figure
              key={item.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="relative w-full overflow-hidden bg-neutral-100">
                <DriveImage item={item} />
              </div>
              <figcaption className="px-4 py-3 text-xs text-neutral-800">
                <div className="truncate text-sm font-medium" title={item.title}>
                  {item.title}
                </div>
                {createdAt && (
                  <div className="mt-1 text-neutral-500">{createdAt}</div>
                )}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    View
                  </a>
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div
        ref={sentinelRef}
        className="flex h-10 items-center justify-center text-sm text-neutral-500"
      >
        {hasMore
          ? isValidating
            ? "Loading more photos…"
            : "Scroll for more"
          : items.length === 0
          ? "No images available"
          : "End of album"}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Failed to load images: {error.message}
        </div>
      )}
    </div>
  );
}