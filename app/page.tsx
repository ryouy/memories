import { EntryCard } from "@/components/entries/entry-card";
import { HomeFilters } from "@/components/entries/home-filters";
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
        <section className="pb-8">
          <HomeFilters tags={tags} years={years} selectedTag={params.tag} selectedYear={params.year} />
        </section>
        <section>
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
