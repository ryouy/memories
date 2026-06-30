import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentBlocks } from "@/components/blocks/content-blocks";
import { SiteShell } from "@/components/layout/site-shell";
import { getAdjacentEntries, getEntryBySlug, getPublishedEntries, getSiteSettings } from "@/lib/content/local";

export async function generateStaticParams() {
  const entries = await getPublishedEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, entry] = await Promise.all([getSiteSettings(), getEntryBySlug(slug)]);
  if (!entry) notFound();
  const adjacent = await getAdjacentEntries(slug);

  return (
    <SiteShell settings={settings}>
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
          <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">{entry.title}</h1>
          <p className="mt-6 text-lg leading-8 text-stone-600">{entry.summary}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {entry.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-white px-3 py-1 text-sm text-stone-600">
                {tag}
              </Link>
            ))}
          </div>
        </header>
        <ContentBlocks blocks={entry.blocks} />
        <nav className="mx-auto mt-16 grid max-w-[960px] gap-4 px-5 sm:grid-cols-2 sm:px-8">
          {adjacent.previous ? (
            <Link className="rounded-lg border border-stone-200 bg-white p-5" href={`/entries/${adjacent.previous.slug}`}>
              <span className="text-sm text-stone-500">Previous</span>
              <p className="mt-2 font-serif text-2xl">{adjacent.previous.title}</p>
            </Link>
          ) : <span />}
          {adjacent.next ? (
            <Link className="rounded-lg border border-stone-200 bg-white p-5 text-right" href={`/entries/${adjacent.next.slug}`}>
              <span className="text-sm text-stone-500">Next</span>
              <p className="mt-2 font-serif text-2xl">{adjacent.next.title}</p>
            </Link>
          ) : null}
        </nav>
      </main>
    </SiteShell>
  );
}
