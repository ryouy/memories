"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ContentBlock, Entry, EntryStatus, ImageItem } from "@/types/content";
import { getGoogleMapsTitle } from "@/lib/maps";
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

const blockOptions: { type: ContentBlock["type"]; label: string }[] = [
  { type: "text", label: "文章" },
  { type: "image", label: "写真" },
  { type: "imageGallery", label: "複数写真" },
  { type: "map", label: "マップ" },
  { type: "heading", label: "見出し" },
  { type: "youtube", label: "YouTube" },
  { type: "divider", label: "区切り" }
];

function createBlock(type: ContentBlock["type"]): ContentBlock {
  const id = `block-${crypto.randomUUID()}`;
  if (type === "text") return { id, type, content: "" };
  if (type === "heading") return { id, type, level: 2, text: "" };
  if (type === "image") return { id, type, image: { ...emptyImage }, displayWidth: "large" };
  if (type === "imageGallery") return { id, type, layout: "grid", images: [{ ...emptyImage }] };
  if (type === "map") return { id, type, displayMode: "card", title: "", googleMapsUrl: "" };
  if (type === "youtube") return { id, type, videoId: "", title: "", startSeconds: undefined };
  return { id, type: "divider" };
}

function defaults(entry?: Entry): FormValues {
  return {
    title: entry?.title ?? "",
    slug: entry?.slug ?? "",
    summary: entry?.summary ?? "",
    visitedAt: entry?.visitedAt ?? new Date().toISOString().slice(0, 10),
    status: entry?.status ?? "published",
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

function splitTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function cleanImage(image: ImageItem): ImageItem {
  return {
    src: image.src,
    alt: image.alt,
    caption: image.caption,
    width: image.width,
    height: image.height
  };
}

function cleanBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block) => {
    if (block.type === "image") return { ...block, image: cleanImage(block.image) };
    if (block.type === "imageGallery") return { ...block, images: block.images.map(cleanImage) };
    if (block.type === "map" && block.image) return { ...block, image: cleanImage(block.image) };
    return block;
  });
}

export function EntryForm({ entry, sha, existingTags = [] }: { entry?: Entry; sha?: string; existingTags?: string[] }) {
  const router = useRouter();
  const [draftIdentity] = useState(() => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      slug: `entry-${Date.now()}`
    };
  });
  const entryKey = entry?.slug ?? `new-${draftIdentity.id}`;
  const storageKey = `memories-entry-draft-${entryKey}`;
  const [blocks, setBlocks] = useState<ContentBlock[]>(entry?.blocks ?? [createBlock("text")]);
  const [activeStorageKey, setActiveStorageKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const form = useForm<FormValues>({ defaultValues: defaults(entry) });
  const values = form.watch();

  useEffect(() => {
    setActiveStorageKey(null);
    form.reset(defaults(entry));
    setBlocks(entry?.blocks ?? [createBlock("text")]);
    setMessage("");

    if (!entry) localStorage.removeItem("memories-entry-draft-new");
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setActiveStorageKey(storageKey);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { values: FormValues; blocks: ContentBlock[] };
      form.reset(parsed.values);
      setBlocks(parsed.blocks);
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setActiveStorageKey(storageKey);
    }
  }, [entry, entryKey, form, storageKey]);

  useEffect(() => {
    if (activeStorageKey !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ values, blocks: cleanBlocks(blocks) }));
  }, [activeStorageKey, values, blocks, storageKey]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const entryPayload = useMemo<Entry>(() => {
    const now = new Date().toISOString();
    const titleSlug = values.title ? slugify(values.title) : "";
    const slug = values.slug || titleSlug || draftIdentity.slug;
    return {
      schemaVersion: 1,
      id: entry?.id ?? draftIdentity.id,
      slug,
      title: values.title,
      summary: values.summary,
      status: values.status,
      visitedAt: values.visitedAt,
      createdAt: entry?.createdAt ?? draftIdentity.createdAt,
      updatedAt: now,
      tags: splitTags(values.tags),
      location: {
        name: values.locationName || undefined,
        address: values.locationAddress || undefined,
        googleMapsUrl: values.locationGoogleMapsUrl || undefined
      },
      coverImage: values.coverSrc
        ? { src: values.coverSrc, alt: values.coverAlt || values.title, width: Number(values.coverWidth), height: Number(values.coverHeight) }
        : undefined,
      blocks: cleanBlocks(blocks)
    };
  }, [blocks, draftIdentity.createdAt, draftIdentity.id, draftIdentity.slug, entry?.createdAt, entry?.id, values]);

  const selectedTags = splitTags(values.tags);

  function addTag(tag: string) {
    if (selectedTags.includes(tag)) return;
    form.setValue("tags", [...selectedTags, tag].join(", "), { shouldDirty: true });
  }

  function removeTag(tag: string) {
    form.setValue("tags", selectedTags.filter((item) => item !== tag).join(", "), { shouldDirty: true });
  }

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
      router.push(`/entries/${payload.slug}`);
      router.refresh();
    } else {
      const result = await response.json().catch(() => null);
      setMessage(result?.error?.message ?? "保存に失敗しました。入力内容はブラウザに保持されています。");
    }
  }

  function updateBlock(index: number, next: ContentBlock) {
    setBlocks((current) => current.map((block, i) => (i === index ? next : block)));
  }

  function insertBlock(index: number, type: ContentBlock["type"]) {
    setBlocks((current) => [...current.slice(0, index), createBlock(type), ...current.slice(index)]);
  }

  function setCoverImage(image: ImageItem) {
    form.setValue("coverSrc", image.src, { shouldDirty: true });
    form.setValue("coverAlt", image.alt || values.title, { shouldDirty: true });
    form.setValue("coverWidth", image.width, { shouldDirty: true });
    form.setValue("coverHeight", image.height, { shouldDirty: true });
  }

  return (
    <form className="mx-auto max-w-[880px] space-y-8 bg-white" onSubmit={(event) => event.preventDefault()}>
      <section className="space-y-5 px-2 pt-6">
        <input
          className="w-full border-0 bg-transparent text-4xl font-semibold leading-tight outline-none placeholder:text-stone-300 sm:text-5xl"
          placeholder="タイトル"
          {...form.register("title", { required: true })}
          onBlur={(event) => {
            if (!values.slug) form.setValue("slug", slugify(event.target.value), { shouldDirty: true });
          }}
        />
        <textarea
          className="min-h-16 w-full resize-none border-0 bg-transparent text-lg leading-8 text-stone-600 outline-none placeholder:text-stone-300"
          placeholder="概要（任意）"
          {...form.register("summary")}
        />
        <div className="flex flex-wrap gap-3 text-sm text-stone-500">
          <input type="date" className="rounded-md border border-stone-200 bg-white px-3 py-2" {...form.register("visitedAt")} />
          <input className="min-w-48 flex-1 rounded-md border border-stone-200 bg-white px-3 py-2" placeholder="URL" {...form.register("slug", { required: true })} onBlur={(event) => form.setValue("slug", slugify(event.target.value || values.title), { shouldDirty: true })} />
          <input className="min-w-64 flex-1 rounded-md border border-stone-200 bg-white px-3 py-2" placeholder="タグ" list="existing-tags" {...form.register("tags")} />
          <datalist id="existing-tags">
            {existingTags.map((tag) => <option key={tag} value={tag} />)}
          </datalist>
          <select className="rounded-md border border-stone-200 bg-white px-3 py-2" {...form.register("status")}>
            <option value="published">公開</option>
            <option value="draft">下書き</option>
          </select>
        </div>
        {existingTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-sm">
            {existingTags.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`rounded-full border px-3 py-1 ${selected ? "border-stone-200 text-stone-300" : "border-stone-300 text-stone-600 hover:border-stone-500"}`}
                  onClick={() => addTag(tag)}
                  disabled={selected}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        ) : null}
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full bg-stone-100 px-3 py-1 text-stone-700 hover:bg-stone-200"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </button>
            ))}
          </div>
        ) : null}
        <details className="border-t border-stone-100 pt-3">
          <summary className="cursor-pointer text-sm text-stone-500">カバー写真</summary>
          <div className="mt-4">
            <ImageFields
              uploadSlug={entryPayload.slug}
              image={{
                src: values.coverSrc,
                alt: values.coverAlt || values.title,
                caption: "",
                width: Number(values.coverWidth) || 1600,
                height: Number(values.coverHeight) || 1000
              }}
              onChange={setCoverImage}
            />
          </div>
        </details>
        <details className="border-t border-stone-100 pt-3">
          <summary className="cursor-pointer text-sm text-stone-500">詳細</summary>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <input className="rounded-md border border-stone-200 p-3" placeholder="場所" {...form.register("locationName")} />
            <input className="rounded-md border border-stone-200 p-3 md:col-span-2" placeholder="住所" {...form.register("locationAddress")} />
            <input className="rounded-md border border-stone-200 p-3 md:col-span-2" placeholder="Google Maps URL" {...form.register("locationGoogleMapsUrl")} />
            <input className="rounded-md border border-stone-200 p-3" placeholder="カバー画像" {...form.register("coverSrc")} />
            <input className="rounded-md border border-stone-200 p-3" placeholder="カバー説明" {...form.register("coverAlt")} />
            <input type="number" className="rounded-md border border-stone-200 p-3" placeholder="幅" {...form.register("coverWidth", { valueAsNumber: true })} />
            <input type="number" className="rounded-md border border-stone-200 p-3" placeholder="高さ" {...form.register("coverHeight", { valueAsNumber: true })} />
          </div>
        </details>
      </section>

      <section className="space-y-2">
        <BlockInsert onAdd={(type) => insertBlock(0, type)} />
        {blocks.map((block, index) => (
          <div key={block.id} className="group space-y-2">
            <BlockEditor
              block={block}
              uploadSlug={entryPayload.slug}
              onChange={(next) => updateBlock(index, next)}
              onDelete={() => setBlocks((current) => current.filter((_, i) => i !== index))}
            />
            <BlockInsert onAdd={(type) => insertBlock(index + 1, type)} />
          </div>
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

function BlockInsert({ onAdd }: { onAdd: (type: ContentBlock["type"]) => void }) {
  const [open, setOpen] = useState(false);
  const primaryOptions = blockOptions.filter((option) => ["text", "image", "imageGallery", "map"].includes(option.type));
  const secondaryOptions = blockOptions.filter((option) => !["text", "image", "imageGallery", "map"].includes(option.type));

  function add(type: ContentBlock["type"]) {
    onAdd(type);
    setOpen(false);
  }

  return (
    <div className="relative flex h-8 items-center opacity-100 sm:-ml-12 sm:opacity-0 sm:transition sm:hover:opacity-100 sm:focus-within:opacity-100">
      <button
        type="button"
        aria-label="追加"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-lg leading-none text-stone-400 hover:border-stone-400 hover:text-stone-900"
        onClick={() => setOpen((current) => !current)}
      >
        +
      </button>
      {open ? (
        <div className="absolute left-9 top-0 z-10 flex max-w-[calc(100vw-5rem)] flex-wrap items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 shadow-sm sm:min-w-max sm:rounded-full">
          {[...primaryOptions, ...secondaryOptions].map((option) => (
            <button
              key={option.type}
              type="button"
              className="rounded-full px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              onClick={() => add(option.type)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BlockEditor({ block, uploadSlug, onChange, onDelete }: {
  block: ContentBlock;
  uploadSlug: string;
  onChange: (block: ContentBlock) => void;
  onDelete: () => void;
}) {
  return (
    <article className="group/block relative py-1">
      <div className="mb-1 flex gap-2 text-xs text-stone-300 opacity-100 sm:absolute sm:-left-20 sm:top-3 sm:mb-0 sm:w-16 sm:justify-end sm:opacity-0 sm:transition sm:group-hover/block:opacity-100 sm:group-focus-within/block:opacity-100">
        <button type="button" className="hover:text-red-600" aria-label="削除" onClick={onDelete}>×</button>
      </div>
      {block.type === "text" ? (
        <textarea className="min-h-32 w-full resize-y border-0 bg-transparent p-0 text-[17px] leading-9 outline-none placeholder:text-stone-300" placeholder="本文" value={block.content} onChange={(event) => onChange({ ...block, content: event.target.value })} />
      ) : null}
      {block.type === "heading" ? (
        <div className="grid gap-2 sm:grid-cols-[76px_1fr]">
          <select className="rounded-md border border-stone-200 p-2 text-sm" value={block.level} onChange={(event) => onChange({ ...block, level: Number(event.target.value) as 2 | 3 })}><option value={2}>H2</option><option value={3}>H3</option></select>
          <input className="border-0 bg-transparent font-serif text-3xl outline-none placeholder:text-stone-300" placeholder="見出し" value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
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
          <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => onChange({ ...block, images: [...block.images, { ...emptyImage }] })}>手入力</button>
        </div>
      ) : null}
      {block.type === "map" ? (
        <div className="space-y-3 rounded-lg border border-stone-200 p-4 text-sm">
          <div className="inline-flex rounded-md border border-stone-200 bg-white p-1">
            {(["card", "embed"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded px-3 py-1.5 ${((block.displayMode ?? "card") === mode) ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-100"}`}
                onClick={() => onChange({ ...block, displayMode: mode })}
              >
                {mode === "card" ? "概要" : "地図埋め込み"}
              </button>
            ))}
          </div>
          <input
            className="w-full border-0 bg-transparent p-0 text-base outline-none placeholder:text-stone-300"
            placeholder="Google Maps URL"
            value={block.googleMapsUrl}
            onChange={(event) => {
              const googleMapsUrl = event.target.value;
              onChange({ ...block, googleMapsUrl, title: block.title || getGoogleMapsTitle(googleMapsUrl) });
            }}
          />
        </div>
      ) : null}
      {block.type === "youtube" ? (
        <div className="space-y-2 rounded-lg border border-stone-200 p-4">
          <input className="w-full border-0 bg-transparent p-0 outline-none placeholder:text-stone-300" placeholder="タイトル" value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} />
          <input className="w-full border-0 bg-transparent p-0 text-sm text-stone-500 outline-none placeholder:text-stone-300" placeholder="YouTube URL" value={block.videoId} onChange={(event) => {
            const parsed = parseYouTubeUrl(event.target.value);
            onChange({ ...block, videoId: parsed?.videoId ?? event.target.value, startSeconds: parsed?.startSeconds });
          }} />
        </div>
      ) : null}
      {block.type === "divider" ? <hr className="border-stone-200" /> : null}
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
    <div className="space-y-3 rounded-lg border border-dashed border-stone-200 bg-white p-4">
      <label className="block text-sm">
        写真
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.heic"
          className="mt-2 block w-full rounded-md border border-stone-200 bg-white p-3"
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
              const prepared: Array<{ dataUrl: string; width: number; height: number; alt: string; item: UploadQueueItem }> = [];
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
                uploaded.push(...images.map((image, index) => ({ ...image, previewSrc: prepared[index]?.dataUrl })));
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
  const [previewSrc, setPreviewSrc] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const optimized = await optimizeImage(file);
      setPreviewSrc(optimized.dataUrl);
      if (optimized.dataUrl.length > 4_200_000) throw new Error("画像サイズが大きすぎます。");
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: uploadSlug, files: [{ ...optimized, alt: image.alt || file.name }] })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "アップロードに失敗しました。");
      onChange({ ...result.data.images[0], previewSrc: optimized.dataUrl });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  }

  const uploadInput = (
    <label className="block rounded-lg border border-dashed border-stone-200 p-4 text-sm text-stone-500">
      写真
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,.heic"
        className="mt-2 block w-full rounded-md border border-stone-200 bg-white p-3"
        disabled={uploading || !uploadSlug}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await handleUpload(file);
          event.target.value = "";
        }}
      />
    </label>
  );

  return (
    <div className="space-y-3">
      {image.src ? (
        <figure className="space-y-3">
          <div className="overflow-hidden rounded-lg bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc || image.previewSrc || image.src} alt={image.alt || ""} className="h-auto w-full" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-md border border-stone-200 p-2 text-sm" placeholder="説明" value={image.alt} onChange={(event) => onChange({ ...image, alt: event.target.value })} />
            <input className="rounded-md border border-stone-200 p-2 text-sm" placeholder="キャプション" value={image.caption ?? ""} onChange={(event) => onChange({ ...image, caption: event.target.value })} />
          </div>
        </figure>
      ) : null}
      {image.src ? null : uploadInput}
      {uploading ? <p className="text-sm text-stone-500">アップロード中...</p> : null}
      {uploadError ? <p className="text-sm text-red-700">{uploadError}</p> : null}
      <details>
        <summary className="cursor-pointer text-sm text-stone-500">詳細</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-md border border-stone-300 p-3 sm:col-span-2" placeholder="/uploads/slug/photo.webp" value={image.src} onChange={(event) => onChange({ ...image, src: event.target.value })} />
          <input className="rounded-md border border-stone-300 p-3" placeholder="alt" value={image.alt} onChange={(event) => onChange({ ...image, alt: event.target.value })} />
          <input className="rounded-md border border-stone-300 p-3" placeholder="caption" value={image.caption ?? ""} onChange={(event) => onChange({ ...image, caption: event.target.value })} />
          <input type="number" className="rounded-md border border-stone-300 p-3" value={image.width} onChange={(event) => onChange({ ...image, width: Number(event.target.value) })} />
          <input type="number" className="rounded-md border border-stone-300 p-3" value={image.height} onChange={(event) => onChange({ ...image, height: Number(event.target.value) })} />
        </div>
      </details>
    </div>
  );
}
