import { AdminShell } from "@/components/admin/admin-shell";
import { EntryForm } from "@/components/admin/entry-form";

export default function NewEntryPage() {
  return (
    <AdminShell>
      <h1 className="mb-6 font-serif text-4xl">追加</h1>
      <EntryForm />
    </AdminShell>
  );
}
