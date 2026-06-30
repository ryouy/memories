import { EntryCard } from "@/components/entries/entry-card";
import { SiteShell } from "@/components/layout/site-shell";
import { collectTags, collectYears, getPublishedEntries, getSiteSettings } from "@/lib/content/local";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ tag?: string; year?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSiteSettings();
  const allEntries = await getPublishedEntries();
  const tags = collectTags(allEntries);
  const years = collectYears(allEntries);
  const entries = allEntries.filter((entry) => {
    const tagOk = params.tag ? entry.tags.includes(params.tag) : true;
    const yearOk = params.year ? entry.visitedAt.startsWith(params.year) : true;
    return tagOk && yearOk;
  });

  return (
    <SiteShell settings={settings}>
      <main className="mx-auto max-w-[1360px] px-5 pb-16 sm:px-8 lg:px-10">
        <section className="grid gap-10 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.18em] text-moss">Travel journal</p>
            <h1 className="font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">{settings.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">{settings.description}</p>
          </div>
          <aside className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
            <div>
              <h2 className="mb-3 text-sm font-semibold">Years</h2>
              <div className="flex flex-wrap gap-2">
                {years.map(([year, count]) => (
                  <a key={year} href={`/?year=${year}`} className="rounded-full bg-stone-100 px-3 py-1 text-sm">
                    {year} ({count})
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map(([tag, count]) => (
                  <a key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-stone-100 px-3 py-1 text-sm">
                    {tag} ({count})
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </section>
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">Latest entries</h2>
            <span className="text-sm text-stone-500">{entries.length} records</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
