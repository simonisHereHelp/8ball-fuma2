// lib/InfiniteAlbum.tsx
"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef } from "react";

const PAGE_SIZE = 12;

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

const getKey = (pageIndex: number, previousPageData: any) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  const offset = pageIndex * PAGE_SIZE;
  return `/api/album?offset=${offset}&limit=${PAGE_SIZE}`;
};

export default function InfiniteAlbum() {
  const { data, size, setSize, isValidating, error } = useSWRInfinite(
    getKey,
    fetcher
  );

  const items = useMemo(
    () => (data ?? []).flatMap((p: any) => p.items),
    [data]
  );
  const hasMore = !!data?.[data.length - 1]?.hasMore;

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
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it: any) => (
          <figure
            key={it.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-2"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
              <img
                src={it.url}
                alt={it.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm">
              <div className="font-medium truncate">{it.title}</div>
              <div className="text-gray-500 text-xs">
                {new Date(it.createdAt).toLocaleString()}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="h-10 flex items-center justify-center text-sm text-gray-400"
      >
        {hasMore ? "Loading…" : "No more"}
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          Error: {String(error.message || error)}
        </div>
      )}
    </div>
  );
}
