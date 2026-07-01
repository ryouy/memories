import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/admin/logout-button";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!(await requireAdminSession())) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="text-sm text-stone-500">
            管理
          </Link>
          <nav className="flex items-center gap-3 text-sm text-stone-500">
            <Link href="/admin/entries">一覧</Link>
            <Link href="/admin/entries/new">追加</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2">{children}</main>
    </div>
  );
}
