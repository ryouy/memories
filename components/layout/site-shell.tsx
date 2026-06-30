import Link from "next/link";
import type { SiteSettings } from "@/types/content";

export function SiteShell({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="font-serif text-2xl tracking-normal">
          {settings.title}
        </Link>
        <nav className="text-sm text-stone-600">
          <Link href="/" className="hover:text-ink">
            Entries
          </Link>
        </nav>
      </header>
      {children}
      <footer className="mx-auto max-w-[1360px] px-5 py-12 text-sm text-stone-500 sm:px-8 lg:px-10">
        {settings.description}
      </footer>
    </div>
  );
}
