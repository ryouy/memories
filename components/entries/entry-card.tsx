import Link from "next/link";
import type { Entry } from "@/types/content";

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-stone-200 bg-white">
      <Link href={`/entries/${entry.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-stone-200">
          {entry.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.coverImage.src}
              alt={entry.coverImage.alt}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap gap-2 text-xs text-stone-500">
            <time dateTime={entry.visitedAt}>{entry.visitedAt}</time>
            {entry.location?.name ? <span>{entry.location.name}</span> : null}
          </div>
          <h2 className="text-xl font-semibold leading-tight">{entry.title}</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
