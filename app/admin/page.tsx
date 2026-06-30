import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllEntries } from "@/lib/content/local";
import { githubStatus } from "@/lib/github/client";

export default async function AdminPage() {
  const entries = await getAllEntries();
  const status = await githubStatus();
  const published = entries.filter((entry) => entry.status === "published").length;
  const draft = entries.length - published;
  return (
    <AdminShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">管理</h1>
        <Link href="/admin/entries/new" className="rounded-md bg-ink px-4 py-2 text-sm text-white">
          追加
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["記録件数", entries.length], ["公開済み", published], ["下書き", draft], ["GitHub", status.connected ? "接続済み" : "未接続"]].map(([label, value]) => (
          <section key={label} className="rounded-lg border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-5">
        <Link href="/admin/entries" className="text-sm underline">
          一覧
        </Link>
      </div>
    </AdminShell>
  );
}
