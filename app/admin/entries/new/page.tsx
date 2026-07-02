import { AdminShell } from "@/components/admin/admin-shell";
import { EntryForm } from "@/components/admin/entry-form";
import { collectTags, getAllEntries } from "@/lib/content/local";

export default async function NewEntryPage() {
  const tags = collectTags(await getAllEntries()).map(([tag]) => tag);
  return (
    <AdminShell>
      <EntryForm key="new" existingTags={tags} />
    </AdminShell>
  );
}
