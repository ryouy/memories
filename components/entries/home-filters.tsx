"use client";

import { useRouter } from "next/navigation";

export function HomeFilters({
  tags,
  years,
  selectedTag,
  selectedYear,
  selectedView = "tile"
}: {
  tags: [string, number][];
  years: [string, number][];
  selectedTag?: string;
  selectedYear?: string;
  selectedView?: "tile" | "list";
}) {
  const router = useRouter();

  function go(next: { tag?: string; year?: string; view?: "tile" | "list" }) {
    const params = new URLSearchParams();
    if (next.year) params.set("year", next.year);
    if (next.tag) params.set("tag", next.tag);
    if (next.view && next.view !== "tile") params.set("view", next.view);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="flex flex-wrap gap-3 border-b border-stone-200 pb-5 text-sm">
      <select
        className="rounded-md border border-stone-200 bg-white px-3 py-2"
        value={selectedYear ?? ""}
        onChange={(event) => go({ year: event.target.value || undefined, tag: selectedTag, view: selectedView })}
      >
        <option value="">すべての年</option>
        {years.map(([year]) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <select
        className="rounded-md border border-stone-200 bg-white px-3 py-2"
        value={selectedTag ?? ""}
        onChange={(event) => go({ year: selectedYear, tag: event.target.value || undefined, view: selectedView })}
      >
        <option value="">すべてのタグ</option>
        {tags.map(([tag]) => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
      <select
        className="rounded-md border border-stone-200 bg-white px-3 py-2"
        value={selectedView}
        onChange={(event) => go({ year: selectedYear, tag: selectedTag, view: event.target.value as "tile" | "list" })}
      >
        <option value="tile">タイル</option>
        <option value="list">リスト</option>
      </select>
    </div>
  );
}
