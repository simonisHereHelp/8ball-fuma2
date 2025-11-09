import { getPageImage, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import ReactMarkdown from "react-markdown";
import { getRemotePage } from "@/lib/remote-page";

export default async function Page(
  props: PageProps<"/docs/[[...slug]]">
) {
  const params = await props.params;

  const slugArray = Array.isArray(params.slug)
    ? params.slug
    : [params.slug ?? "index"];

  const last = slugArray[slugArray.length - 1] || "index";

  // remote_* → load from Google Drive
  if (last.startsWith("remote_")) {
    const slugKey = last; // e.g. "remote_test"
    const remote = await getRemotePage(slugKey);
    if (!remote || !remote.body_md) notFound();

    return (
      <DocsPage>
        <DocsTitle>{remote.title || slugKey}</DocsTitle>
        <DocsDescription>
          Remote content loaded from Google Drive ({slugKey})
        </DocsDescription>
        <DocsBody>
          <ReactMarkdown className="prose max-w-none">
            {remote.body_md}
          </ReactMarkdown>
        </DocsBody>
      </DocsPage>
    );
  }

  // page_* or anything else → local Fumadocs content
  const page = source.getPage(slugArray);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params;
  const slugArray = Array.isArray(params.slug)
    ? params.slug
    : [params.slug ?? "index"];
  const last = slugArray[slugArray.length - 1] || "index";

  // For remote_* pages you can optionally fetch title,
  // but to keep changes minimal we only handle local for now
  const page = source.getPage(slugArray);
  if (!page) {
    return {
      title: last,
      description: `Remote page ${last}`,
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
