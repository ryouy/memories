"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ContentBlock, Entry, EntryStatus, ImageItem } from "@/types/content";
import { parseYouTubeUrl } from "@/lib/youtube";
import { slugify } from "@/lib/utils/slug";

const uploadChunkSize = 5;

type FormValues = {
  title: string;
  slug: string;
  summary: string;
  visitedAt: string;
  status: EntryStatus;
  locationName: string;
  locationAddress: string;
  locationGoogleMapsUrl: string;
  tags: string;
  coverSrc: string;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
};

const emptyImage: ImageItem = {
  src: "",
  alt: "",
  caption: "",
  width: 1600,
  height: 1000
};

function createBlock(type: ContentBlock["type"]): ContentBlock {
  const id = `block-${crypto.randomUUID()}`;
  if (type === "text") return { id, type, content: "" };
  if (type === "heading") return { id, type, level: 2, text: "" };
  if (type === "image") return { id, type, image: { ...emptyImage }, displayWidth: "large" };
  if (type === "imageGallery") return { id, type, layout: "grid", images: [{ ...emptyImage }] };
  if (type === "map") return { id, type, title: "", googleMapsUrl: "" };
  if (type === "youtube") return { id, type, videoId: "", title: "", startSeconds: undefined };
  return { id, type: "divider" };
}

function defaults(entry?: Entry): FormValues {
  return {
    title: entry?.title ?? "",
    slug: entry?.slug ?? "",
    summary: entry?.summary ?? "",
    visitedAt: entry?.visitedAt ?? new Date().toISOString().slice(0, 10),
    status: entry?.status ?? "draft",
    locationName: entry?.location?.name ?? "",
    locationAddress: entry?.location?.address ?? "",
    locationGoogleMapsUrl: entry?.location?.googleMapsUrl ?? "",
    tags: entry?.tags.join(", ") ?? "",
    coverSrc: entry?.coverImage?.src ?? "",
    coverAlt: entry?.coverImage?.alt ?? "",
    coverWidth: entry?.coverImage?.width ?? 1600,
    coverHeight: entry?.coverImage?.height ?? 1000
  };
}

export function EntryForm({ entry, sha }: { entry?: Entry; sha?: string }) {
  const router = useRouter();
  const storageKey = `memories-entry-draft-${entry?.slug ?? "new"}`;
  const [blocks, setBlocks] = useState<ContentBlock[]>(entry?.blocks ?? [createBlock("text")]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const form = useForm<FormValues>({ defaultValues: defaults(entry) });
  const values = form.watch();

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { values: FormValues; blocks: ContentBlock[] };
      form.reset(parsed.values);
      setBlocks(parsed.blocks);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [form, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ values, blocks }));
  }, [values, blocks, storageKey]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const entryPayload = useMemo<Entry>(() => {
    const now = new Date().toISOString();
    const slug = values.slug || slugify(values.title);
    return {
      schemaVersion: 1,
      id: entry?.id ?? crypto.randomUUID(),
      slug,
      title: values.title,
      summary: values.summary,
      status: values.status,
      visitedAt: values.visitedAt,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      location: {
        name: values.locationName || undefined,
        address: values.locationAddress || undefined,
        googleMapsUrl: values.locationGoogleMapsUrl || undefined
      },
      coverImage: values.coverSrc
        ? { src: values.coverSrc, alt: values.coverAlt || values.title, width: Number(values.coverWidth), height: Number(values.coverHeight) }
        : undefined,
      blocks
    };
  }, [blocks, entry?.createdAt, entry?.id, values]);

  async function save(status: EntryStatus) {
    setPending(true);
    setMessage("");
    const payload = { ...entryPayload, status };
    const response = await fetch(entry ? `/api/admin/entries/${entry.slug}` : "/api/admin/entries", {
      method: entry ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entry: payload, sha })
    });
    setPending(false);
    if (response.ok) {
      localStorage.removeItem(storageKey);
      setMessage("保存しました。");
      router.push("/admin/entries");
      router.refresh();
    } else {
      const result = await response.json().catch(() => null);
      setMessage(result?.error?.message ?? "保存に失敗しました。入力内容はブラウザに保持されています。");
    }
  }

  function updateBlock(index: number, next: ContentBlock) {
    setBlocks((current) => current.map((block, i) => (i === index ? next : block)));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  return (
    <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="font-serif text-2xl">基本情報</h2>
        <label className="block text-sm">タイトル<input className="mt-1 w-full rounded-md border p-3" {...form.register("title", { required: true })} /></label>
        <label className="block text-sm">slug<input className="mt-1 w-full rounded-md border p-3" {...form.register("slug")} onBlur={(event) => form.setValue("slug", slugify(event.target.value || values.title))} /></label>
        <label className="block text-sm">概要<textarea className="mt-1 min-h-24 w-full rounded-md border p-3" {...form.register("summary", { required: true })} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">訪問日<input type="date" className="mt-1 w-full rounded-md border p-3" {...form.register("visitedAt")} /></label>
          <label className="block text-sm">公開状態<select className="mt-1 w-full rounded-md border p-3" {...form.register("status")}><option value="draft">下書き</option><option value="published">公開</option></select></label>
        </div>
        <label className="block text-sm">タグ（カンマ区切り）<input className="mt-1 w-full rounded-md border p-3" {...form.register("tags")} /></label>
      </section>

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="font-serif text-2xl">場所とカバー画像</h2>
        <label className="block text-sm">場所名<input className="mt-1 w-full rounded-md border p-3" {...form.register("locationName")} /></label>
        <label className="block text-sm">住所<input className="mt-1 w-full rounded-md border p-3" {...form.register("locationAddress")} /></label>
        <label className="block text-sm">Google Maps URL<input className="mt-1 w-full rounded-md border p-3" {...form.register("locationGoogleMapsUrl")} /></label>
        <label className="block text-sm">カバー画像パス<input className="mt-1 w-full rounded-md border p-3" placeholder="/uploads/slug/photo.webp" {...form.register("coverSrc")} /></label>
        <label className="block text-sm">カバー画像alt<input className="mt-1 w-full rounded-md border p-3" {...form.register("coverAlt")} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">幅<input type="number" className="mt-1 w-full rounded-md border p-3" {...form.register("coverWidth", { valueAsNumber: true })} /></label>
          <label className="block text-sm">高さ<input type="number" className="mt-1 w-full rounded-md border p-3" {...form.register("coverHeight", { valueAsNumber: true })} /></label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">本文ブロック</h2>
          <select className="rounded-md border bg-white p-3" defaultValue="" onChange={(event) => {
            if (!event.target.value) return;
            setBlocks((current) => [...current, createBlock(event.target.value as ContentBlock["type"])]);
            event.target.value = "";
          }}>
            <option value="">ブロックを追加</option>
            <option value="text">文章</option>
            <option value="heading">見出し</option>
            <option value="image">写真1枚</option>
            <option value="imageGallery">写真ギャラリー</option>
            <option value="map">Google Maps</option>
            <option value="youtube">YouTube</option>
            <option value="divider">区切り線</option>
          </select>
        </div>
        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={index}
            uploadSlug={entryPayload.slug}
            onChange={(next) => updateBlock(index, next)}
            onMove={moveBlock}
            onDuplicate={() => setBlocks((current) => [...current.slice(0, index + 1), { ...block, id: `block-${crypto.randomUUID()}` }, ...current.slice(index + 1)])}
            onDelete={() => setBlocks((current) => current.filter((_, i) => i !== index))}
          />
        ))}
      </section>

      {message ? <p className="rounded-md bg-white p-4 text-sm">{message}</p> : null}
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-stone-200 bg-stone-50 py-4">
        <button disabled={pending} type="button" onClick={() => save("draft")} className="rounded-md border border-stone-300 bg-white px-4 py-3 text-sm disabled:opacity-50">下書き保存</button>
        <button disabled={pending} type="button" onClick={() => save("published")} className="rounded-md bg-ink px-4 py-3 text-sm text-white disabled:opacity-50">公開して保存</button>
        <button type="button" onClick={() => router.push("/admin/entries")} className="rounded-md border border-stone-300 bg-white px-4 py-3 text-sm">キャンセル</button>
      </div>
    </form>
  );
}

function BlockEditor({ block, index, uploadSlug, onChange, onMove, onDuplicate, onDelete }: {
  block: ContentBlock;
  index: number;
  uploadSlug: string;
  onChange: (block: ContentBlock) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{index + 1}. {block.type}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => onMove(index, -1)}>上へ</button>
          <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => onMove(index, 1)}>下へ</button>
          <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={onDuplicate}>複製</button>
          <button type="button" className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700" onClick={onDelete}>削除</button>
        </div>
      </div>
      {block.type === "text" ? (
        <textarea className="min-h-36 w-full rounded-md border p-3" value={block.content} onChange={(event) => onChange({ ...block, content: event.target.value })} />
      ) : null}
      {block.type === "heading" ? (
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <select className="rounded-md border p-3" value={block.level} onChange={(event) => onChange({ ...block, level: Number(event.target.value) as 2 | 3 })}><option value={2}>H2</option><option value={3}>H3</option></select>
          <input className="rounded-md border p-3" value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
        </div>
      ) : null}
      {block.type === "image" ? <ImageFields uploadSlug={uploadSlug} image={block.image} onChange={(image) => onChange({ ...block, image })} /> : null}
      {block.type === "imageGallery" ? (
        <div className="space-y-4">
          {block.images.map((image, imageIndex) => (
            <div key={imageIndex} className="space-y-2">
              <ImageFields uploadSlug={uploadSlug} image={image} onChange={(next) => onChange({ ...block, images: block.images.map((item, i) => i === imageIndex ? next : item) })} />
              <button
                type="button"
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
                onClick={() => onChange({ ...block, images: block.images.filter((_, i) => i !== imageIndex) })}
              >
                この画像を削除
              </button>
            </div>
          ))}
          <GalleryBatchUploader
            uploadSlug={uploadSlug}
            onUploaded={(images) => {
              const existing = block.images.filter((image) => image.src);
              onChange({ ...block, images: [...existing, ...images] });
            }}
          />
          <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => onChange({ ...block, images: [...block.images, { ...emptyImage }] })}>手入力で画像を追加</button>
        </div>
      ) : null}
      {block.type === "map" ? (
        <div className="space-y-3">
          <input className="w-full rounded-md border p-3" placeholder="タイトル" value={block.title ?? ""} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          <input className="w-full rounded-md border p-3" placeholder="Google Maps URL" value={block.googleMapsUrl} onChange={(event) => onChange({ ...block, googleMapsUrl: event.target.value })} />
        </div>
      ) : null}
      {block.type === "youtube" ? (
        <div className="space-y-3">
          <input className="w-full rounded-md border p-3" placeholder="タイトル" value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          <input className="w-full rounded-md border p-3" placeholder="YouTube URL または videoId" value={block.videoId} onChange={(event) => {
            const parsed = parseYouTubeUrl(event.target.value);
            onChange({ ...block, videoId: parsed?.videoId ?? event.target.value, startSeconds: parsed?.startSeconds });
          }} />
        </div>
      ) : null}
      {block.type === "divider" ? <p className="text-sm text-stone-500">区切り線を表示します。</p> : null}
    </article>
  );
}

async function optimizeImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(file.type === "image/heic" ? "HEICは未対応です。" : "対応していない画像形式です。");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を処理できませんでした。");
  context.drawImage(bitmap, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/webp", 0.84);
  return { dataUrl, width, height };
}

type UploadQueueItem = {
  id: string;
  name: string;
  status: "waiting" | "optimizing" | "uploading" | "success" | "error";
  message?: string;
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function GalleryBatchUploader({ uploadSlug, onUploaded }: { uploadSlug: string; onUploaded: (images: ImageItem[]) => void }) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  function updateQueue(id: string, patch: Partial<UploadQueueItem>) {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4">
      <label className="block text-sm">
        複数写真を追加
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.heic"
          className="mt-1 block w-full rounded-md border bg-white p-3"
          disabled={uploading || !uploadSlug}
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length === 0) return;
            const items = files.map((file) => ({
              id: crypto.randomUUID(),
              name: file.name,
              status: "waiting" as const
            }));
            setQueue(items);
            setUploading(true);
            const uploaded: ImageItem[] = [];

            for (const fileGroup of chunk(files.map((file, index) => ({ file, item: items[index] })), uploadChunkSize)) {
              const prepared = [];
              for (const { file, item } of fileGroup) {
                updateQueue(item.id, { status: "optimizing", message: "最適化中" });
                try {
                  const optimized = await optimizeImage(file);
                  if (optimized.dataUrl.length > 4_200_000) throw new Error("画像サイズが大きすぎます。");
                  prepared.push({ ...optimized, alt: file.name, item });
                } catch (error) {
                  updateQueue(item.id, {
                    status: "error",
                    message: error instanceof Error ? error.message : "画像を処理できませんでした。"
                  });
                }
              }

              if (prepared.length === 0) continue;
              for (const preparedFile of prepared) updateQueue(preparedFile.item.id, { status: "uploading", message: "アップロード中" });

              try {
                const response = await fetch("/api/admin/uploads", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    slug: uploadSlug,
                    files: prepared.map(({ dataUrl, width, height, alt }) => ({ dataUrl, width, height, alt }))
                  })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result?.error?.message ?? "アップロードに失敗しました。");
                const images = result.data.images as ImageItem[];
                uploaded.push(...images);
                prepared.forEach((preparedFile) => updateQueue(preparedFile.item.id, { status: "success", message: "成功" }));
              } catch (error) {
                prepared.forEach((preparedFile) =>
                  updateQueue(preparedFile.item.id, {
                    status: "error",
                    message: error instanceof Error ? error.message : "アップロードに失敗しました。"
                  })
                );
              }
            }

            if (uploaded.length > 0) onUploaded(uploaded);
            setUploading(false);
            event.target.value = "";
          }}
        />
      </label>
      {queue.length > 0 ? (
        <div className="space-y-2">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className={item.status === "error" ? "text-red-700" : item.status === "success" ? "text-moss" : "text-stone-500"}>
                {item.message ?? item.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImageFields({ image, uploadSlug, onChange }: { image: ImageItem; uploadSlug: string; onChange: (image: ImageItem) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  return (
    <div className="grid gap-3 rounded-md bg-stone-50 p-3 sm:grid-cols-2">
      <label className="block text-sm sm:col-span-2">
        写真アップロード
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.heic"
          className="mt-1 block w-full rounded-md border bg-white p-3"
          disabled={uploading || !uploadSlug}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setUploadError("");
            try {
              const optimized = await optimizeImage(file);
              if (optimized.dataUrl.length > 4_200_000) throw new Error("画像サイズが大きすぎます。");
              const response = await fetch("/api/admin/uploads", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ slug: uploadSlug, files: [{ ...optimized, alt: image.alt || file.name }] })
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result?.error?.message ?? "アップロードに失敗しました。");
              onChange(result.data.images[0]);
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "アップロードに失敗しました。");
            } finally {
              setUploading(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {uploading ? <p className="text-sm text-stone-500">アップロード中...</p> : null}
      {uploadError ? <p className="text-sm text-red-700">{uploadError}</p> : null}
      <input className="rounded-md border p-3 sm:col-span-2" placeholder="/uploads/slug/photo.webp" value={image.src} onChange={(event) => onChange({ ...image, src: event.target.value })} />
      <input className="rounded-md border p-3" placeholder="alt" value={image.alt} onChange={(event) => onChange({ ...image, alt: event.target.value })} />
      <input className="rounded-md border p-3" placeholder="caption" value={image.caption ?? ""} onChange={(event) => onChange({ ...image, caption: event.target.value })} />
      <input type="number" className="rounded-md border p-3" value={image.width} onChange={(event) => onChange({ ...image, width: Number(event.target.value) })} />
      <input type="number" className="rounded-md border p-3" value={image.height} onChange={(event) => onChange({ ...image, height: Number(event.target.value) })} />
    </div>
  );
}
