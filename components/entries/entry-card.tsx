import Link from "next/link";
import type { Entry } from "@/types/content";

export function EntryCard({ entry, variant = "tile" }: { entry: Entry; variant?: "tile" | "list" }) {
  if (variant === "list") {
    return (
      <article className="border-b border-stone-200 py-4 last:border-b-0">
        <Link href={`/entries/${entry.slug}`} className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
          <div className="aspect-[4/3] overflow-hidden rounded-md bg-stone-200">
            {entry.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.coverImage.src} alt={entry.coverImage.alt} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-stone-500">
              <time dateTime={entry.visitedAt}>{entry.visitedAt}</time>
              {entry.location?.name ? ` / ${entry.location.name}` : ""}
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold">{entry.title}</h2>
            {entry.tags.length > 0 ? <p className="mt-1 truncate text-sm text-stone-500">{entry.tags.join(", ")}</p> : null}
          </div>
        </Link>
      </article>
    );
  }

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
        <div className="space-y-2 p-3">
          <div className="flex flex-wrap gap-2 text-xs text-stone-500">
            <time dateTime={entry.visitedAt}>{entry.visitedAt}</time>
            {entry.location?.name ? <span>{entry.location.name}</span> : null}
          </div>
          <h2 className="line-clamp-2 text-base font-semibold leading-tight">{entry.title}</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {entry.tags.slice(0, 3).map((tag) => (
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
