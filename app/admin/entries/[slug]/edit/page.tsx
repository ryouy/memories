import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { EntryForm } from "@/components/admin/entry-form";
import { collectTags, getAllEntries, getEntryBySlug } from "@/lib/content/local";

export default async function EditEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entry, entries] = await Promise.all([getEntryBySlug(slug, true), getAllEntries()]);
  if (!entry) notFound();
  const tags = collectTags(entries).map(([tag]) => tag);
  return (
    <AdminShell>
      <EntryForm key={entry.slug} entry={entry} existingTags={tags} />
    </AdminShell>
  );
}
