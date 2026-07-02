import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteEntryButton } from "@/components/admin/delete-entry-button";
import { getAllEntries } from "@/lib/content/local";

export default async function AdminPage() {
  const entries = await getAllEntries();
  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">管理</h1>
        <div className="flex gap-2">
          <Link href="/" className="rounded-md border border-stone-300 px-4 py-2 text-sm">ホーム</Link>
          <Link href="/admin/entries/new" className="rounded-md bg-ink px-4 py-2 text-sm text-white">追加</Link>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {entries.map((entry) => (
          <div key={entry.slug} className="grid gap-3 border-b border-stone-100 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_120px_220px] md:items-center">
            <div>
              <p className="font-medium">{entry.title}</p>
              <p className="text-sm text-stone-500">{entry.visitedAt} / {entry.status}</p>
            </div>
            <span className="hidden text-sm text-stone-500 md:block">{entry.slug}</span>
            <div className="flex flex-wrap gap-2">
              <Link className="rounded-md border border-stone-300 px-3 py-2 text-sm" href={`/entries/${entry.slug}`}>見る</Link>
              <Link className="rounded-md border border-stone-300 px-3 py-2 text-sm" href={`/admin/entries/${entry.slug}/edit`}>編集</Link>
              <DeleteEntryButton slug={entry.slug} title={entry.title} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
