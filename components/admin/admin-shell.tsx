import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/admin/logout-button";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!(await requireAdminSession())) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-serif text-2xl">
            Memories Admin
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/admin/entries">記録一覧</Link>
            <Link href="/admin/entries/new">新規作成</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
