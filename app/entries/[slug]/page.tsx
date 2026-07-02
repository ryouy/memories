import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentBlocks } from "@/components/blocks/content-blocks";
import { SiteShell } from "@/components/layout/site-shell";
import { getEntryBySlug, getPublishedEntries, getSiteSettings } from "@/lib/content/local";

export async function generateStaticParams() {
  const entries = await getPublishedEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, entry] = await Promise.all([getSiteSettings(), getEntryBySlug(slug)]);
  if (!entry) notFound();

  return (
    <SiteShell settings={settings} adminTarget={`/admin/entries/${entry.slug}/edit`} adminLabel="編集">
      <main className="pb-16">
        {entry.coverImage ? (
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="aspect-[16/8] max-h-[720px] min-h-[320px] overflow-hidden rounded-lg bg-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.coverImage.src} alt={entry.coverImage.alt} className="h-full w-full object-cover" />
            </div>
          </div>
        ) : null}
        <header className="mx-auto max-w-[820px] px-5 py-12 text-center sm:px-8">
          <p className="text-sm text-stone-500">
            <time dateTime={entry.visitedAt}>{entry.visitedAt}</time>
            {entry.location?.name ? ` / ${entry.location.name}` : ""}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{entry.title}</h1>
          {entry.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-stone-500">タグ</span>
              {entry.tags.map((tag) => (
                <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-600">
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </header>
        <ContentBlocks blocks={entry.blocks} />
      </main>
    </SiteShell>
  );
}
