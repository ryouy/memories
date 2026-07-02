import Link from "next/link";
import { House } from "lucide-react";
import type { SiteSettings } from "@/types/content";
import { AdminQuickLogin } from "@/components/layout/admin-quick-login";

export function SiteShell({
  settings,
  children,
  adminTarget = "/admin",
  adminLabel = "管理"
}: {
  settings: SiteSettings;
  children: React.ReactNode;
  adminTarget?: string;
  adminLabel?: string;
}) {
  void settings;
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 hover:border-stone-400" aria-label="ホーム">
          <House size={18} strokeWidth={1.8} />
        </Link>
        <AdminQuickLogin target={adminTarget} label={adminLabel} />
      </header>
      {children}
      <footer className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 lg:px-10" />
    </div>
  );
}
