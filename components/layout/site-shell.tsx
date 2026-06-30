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
      <header className="mx-auto flex max-w-[1360px] justify-end px-5 py-5 sm:px-8 lg:px-10">
        <AdminQuickLogin target={adminTarget} label={adminLabel} />
      </header>
      {children}
      <footer className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 lg:px-10" />
    </div>
  );
}
