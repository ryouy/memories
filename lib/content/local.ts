import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { Entry, SiteSettings } from "@/types/content";
import { entrySchema, siteSettingsSchema } from "@/lib/validation/content";

const root = process.cwd();
const entriesDir = path.join(root, "content", "entries");
const settingsFile = path.join(root, "content", "settings", "site.json");

async function readJson<T>(file: string) {
  const text = await fs.readFile(file, "utf8");
  return JSON.parse(text) as T;
}

export const getAllEntries = cache(async (): Promise<Entry[]> => {
  try {
    const files = await fs.readdir(entriesDir);
    const entries = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => entrySchema.parse(await readJson(path.join(entriesDir, file))))
    );
    return entries.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
});

export async function getPublishedEntries() {
  return (await getAllEntries()).filter((entry) => entry.status === "published");
}

export async function getEntryBySlug(slug: string, includeDrafts = false) {
  const entry = (await getAllEntries()).find((item) => item.slug === slug);
  if (!entry) return null;
  if (!includeDrafts && entry.status !== "published") return null;
  return entry;
}

export async function getAdjacentEntries(slug: string) {
  const entries = await getPublishedEntries();
  const index = entries.findIndex((entry) => entry.slug === slug);
  return {
    previous: index >= 0 ? entries[index + 1] ?? null : null,
    next: index >= 0 ? entries[index - 1] ?? null : null
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return siteSettingsSchema.parse(await readJson(settingsFile));
  } catch {
    return {
      title: "Memories",
      description: "旅先で出会った景色、場所、出来事を写真と文章で残す旅行記録。"
    };
  }
}

export function collectTags(entries: Entry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "ja"));
}

export function collectYears(entries: Entry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const year = entry.visitedAt.slice(0, 4);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
