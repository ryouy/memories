import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { EntryForm } from "@/components/admin/entry-form";
import { getEntryBySlug } from "@/lib/content/local";

export default async function EditEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug, true);
  if (!entry) notFound();
  return (
    <AdminShell>
      <h1 className="mb-6 font-serif text-4xl">編集</h1>
      <EntryForm entry={entry} />
    </AdminShell>
  );
}
