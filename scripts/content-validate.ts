import fs from "node:fs/promises";
import path from "node:path";
import { entrySchema } from "@/lib/validation/content";
import { isAllowedGoogleMapsUrl } from "@/lib/maps";
import type { Entry } from "@/types/content";

const root = process.cwd();
const entriesDir = path.join(root, "content", "entries");
let errors = 0;

function report(file: string, message: string) {
  errors += 1;
  console.error(`${file}: ${message}`);
}

async function existsPublicPath(src: string) {
  try {
    await fs.access(path.join(root, "public", src.replace(/^\//, "")));
    return true;
  } catch {
    return false;
  }
}

const ids = new Set<string>();
const slugs = new Set<string>();
const files = await fs.readdir(entriesDir).catch(() => []);

for (const file of files.filter((item) => item.endsWith(".json"))) {
  const full = path.join(entriesDir, file);
  try {
    const json = JSON.parse(await fs.readFile(full, "utf8")) as Entry;
    const parsed = entrySchema.safeParse(json);
    if (!parsed.success) {
      report(file, parsed.error.issues.map((issue) => issue.path.join(".") || issue.message).join(", "));
      continue;
    }
    const entry = parsed.data;
    if (ids.has(entry.id)) report(file, `idが重複しています: ${entry.id}`);
    if (slugs.has(entry.slug)) report(file, `slugが重複しています: ${entry.slug}`);
    ids.add(entry.id);
    slugs.add(entry.slug);
    if (entry.coverImage && !(await existsPublicPath(entry.coverImage.src))) report(file, `カバー画像が存在しません: ${entry.coverImage.src}`);
    if (entry.location?.googleMapsUrl && !isAllowedGoogleMapsUrl(entry.location.googleMapsUrl)) report(file, "場所のGoogle Maps URLが不正です。");
    for (const block of entry.blocks) {
      if (block.type === "image" && !(await existsPublicPath(block.image.src))) report(file, `画像が存在しません: ${block.image.src}`);
      if (block.type === "imageGallery") {
        for (const image of block.images) if (!(await existsPublicPath(image.src))) report(file, `画像が存在しません: ${image.src}`);
      }
      if (block.type === "map" && !isAllowedGoogleMapsUrl(block.googleMapsUrl)) report(file, "Google Maps URLが不正です。");
    }
    if (entry.status === "published" && (!entry.coverImage || entry.blocks.length === 0)) {
      report(file, "公開記録にはカバー画像と本文ブロックが必要です。");
    }
  } catch (error) {
    report(file, error instanceof Error ? error.message : "JSONを読めません。");
  }
}

if (errors > 0) process.exit(1);
console.log(`content:validate ok (${files.length} files)`);
