import dynamic from "next/dynamic";
import type { Metadata } from "next";

const InfiniteAlbumDrive = dynamic(
  () => import("@/lib/InfiniteAlbumDrive"),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Google Drive Album",
  description: "Infinite scroll gallery sourced from Google Drive",
};

export default function ZAlbum2Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Google Drive
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          Shared Album Viewer
        </h1>
        <p className="text-neutral-600">
          Photos are streamed directly from your shared Drive folder using the
          public <code>?export=view</code> links to avoid browser blocking.
        </p>
      </header>

      <InfiniteAlbumDrive />
    </div>
  );
}