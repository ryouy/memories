import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeleteEntryButton } from "@/components/admin/delete-entry-button";
import { getAllEntries } from "@/lib/content/local";

export default async function AdminEntriesPage() {
  const entries = await getAllEntries();
  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">一覧</h1>
        <Link href="/admin/entries/new" className="rounded-md bg-ink px-4 py-2 text-sm text-white">
          追加
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="hidden grid-cols-[1fr_120px_100px_180px_160px] gap-4 border-b border-stone-200 px-4 py-3 text-sm font-semibold md:grid">
          <span>タイトル</span><span>訪問日</span><span>状態</span><span>更新日時</span><span>操作</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="grid gap-3 border-b border-stone-100 px-4 py-4 md:grid-cols-[1fr_120px_100px_180px_160px] md:items-center">
            <div>
              <p className="font-medium">{entry.title}</p>
              <p className="text-sm text-stone-500 md:hidden">{entry.visitedAt} / {entry.status}</p>
            </div>
            <span className="hidden text-sm md:block">{entry.visitedAt}</span>
            <span className="hidden text-sm md:block">{entry.status}</span>
            <span className="hidden text-sm text-stone-500 md:block">{entry.updatedAt}</span>
            <div className="flex gap-2">
              <Link className="rounded-md border border-stone-300 px-3 py-2 text-sm" href={`/admin/entries/${entry.slug}/edit`}>
                編集
              </Link>
              <DeleteEntryButton slug={entry.slug} title={entry.title} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
