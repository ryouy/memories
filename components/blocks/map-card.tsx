"use client";

import { useEffect, useState } from "react";
import type { ImageItem } from "@/types/content";

type Preview = {
  title: string;
  image: string;
};

export function MapCard({
  mapUrl,
  title,
  fallbackImage
}: {
  mapUrl: string;
  title: string;
  fallbackImage?: ImageItem;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/map-preview?url=${encodeURIComponent(mapUrl)}`)
      .then((response) => response.ok ? response.json() as Promise<Preview> : null)
      .then((data) => {
        if (active && data) setPreview(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mapUrl]);

  const displayTitle = preview?.title || title;
  const image = preview?.image || fallbackImage?.src || "";
  const alt = preview?.title || fallbackImage?.alt || displayTitle;

  return (
    <a href={mapUrl} target="_blank" rel="noreferrer" className="grid overflow-hidden rounded-lg border border-stone-200 bg-white sm:grid-cols-[220px_1fr]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={alt} className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
      ) : null}
      <span className="flex min-h-28 flex-col justify-center p-5">
        <span className="block text-sm text-stone-500">Google Maps</span>
        <span className="mt-2 block text-xl font-semibold">{displayTitle}</span>
        <span className="mt-2 block text-sm text-stone-500">地図を開く</span>
      </span>
    </a>
  );
}
