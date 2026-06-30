import fs from "node:fs/promises";
import path from "node:path";
import { collectTags, collectYears, getAllEntries } from "@/lib/content/local";

const root = process.cwd();
const outDir = path.join(root, "content", "generated");
await fs.mkdir(outDir, { recursive: true });

const entries = await getAllEntries();
const index = entries.map((entry) => ({
  id: entry.id,
  slug: entry.slug,
  title: entry.title,
  summary: entry.summary,
  status: entry.status,
  visitedAt: entry.visitedAt,
  tags: entry.tags,
  locationName: entry.location?.name,
  coverImage: entry.coverImage
}));

await fs.writeFile(path.join(outDir, "entries-index.json"), `${JSON.stringify(index, null, 2)}\n`);
await fs.writeFile(path.join(outDir, "tags-index.json"), `${JSON.stringify(collectTags(entries), null, 2)}\n`);
await fs.writeFile(path.join(outDir, "years-index.json"), `${JSON.stringify(collectYears(entries), null, 2)}\n`);

console.log(`content:index ok (${entries.length} entries)`);
