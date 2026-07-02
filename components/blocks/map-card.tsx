export function MapCard({ mapUrl, title }: { mapUrl: string; title: string }) {
  return (
    <a href={mapUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300">
      <span className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-xs uppercase tracking-[0.14em] text-stone-400">Google Maps</span>
          <span className="mt-2 block text-lg font-semibold">{title}</span>
        </span>
        <span className="shrink-0 text-sm text-stone-500">開く</span>
      </span>
    </a>
  );
}
