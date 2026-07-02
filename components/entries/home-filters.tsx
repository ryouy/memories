"use client";

import { useRouter } from "next/navigation";

export function HomeFilters({
  tags,
  years,
  selectedTag,
  selectedYear
}: {
  tags: [string, number][];
  years: [string, number][];
  selectedTag?: string;
  selectedYear?: string;
}) {
  const router = useRouter();

  function go(next: { tag?: string; year?: string }) {
    const params = new URLSearchParams();
    if (next.year) params.set("year", next.year);
    if (next.tag) params.set("tag", next.tag);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-5 text-sm">
      <select
        className="rounded-md border border-stone-200 bg-white px-3 py-2"
        value={selectedYear ?? ""}
        onChange={(event) => go({ year: event.target.value || undefined, tag: selectedTag })}
      >
        <option value="">すべての年</option>
        {years.map(([year]) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <select
        className="rounded-md border border-stone-200 bg-white px-3 py-2"
        value={selectedTag ?? ""}
        onChange={(event) => go({ year: selectedYear, tag: event.target.value || undefined })}
      >
        <option value="">すべてのタグ</option>
        {tags.map(([tag]) => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
    </div>
  );
}
