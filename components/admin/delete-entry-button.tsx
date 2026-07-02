"use client";

import { useRouter } from "next/navigation";

export function DeleteEntryButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  return (
    <button
      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
      onClick={async () => {
        if (!window.confirm(`${title} を削除します。`)) return;
        const response = await fetch(`/api/admin/entries/${slug}`, {
          method: "DELETE"
        });
        if (response.ok) router.refresh();
        else window.alert("削除に失敗しました。");
      }}
      type="button"
    >
      削除
    </button>
  );
}
