import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const owner = process.env.GITHUB_OWNER ?? "ryouy";
const repo = process.env.GITHUB_REPO ?? "memories";
const branch = process.env.GITHUB_BRANCH ?? "main";
const root = process.cwd();

function hasLocalChanges() {
  try {
    const output = execFileSync("git", ["status", "--porcelain", "--", "content", "public/uploads"], { encoding: "utf8" });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

if (!force && hasLocalChanges()) {
  console.error("ローカルのcontentまたはpublic/uploadsに変更があります。変更をコミットするか、--forceを指定してください。");
  process.exit(1);
}

const tmp = await fs.mkdtemp(path.join(process.env.TMPDIR ?? "/tmp", "memories-content-"));
const archive = path.join(tmp, "repo.tar.gz");
const url = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;

console.log(`Fetching ${owner}/${repo}@${branch}`);
const response = await fetch(url);
if (!response.ok || !response.body) {
  console.error(`GitHubから取得できませんでした: ${response.status}`);
  process.exit(1);
}
await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()));
execFileSync("tar", ["-xzf", archive, "-C", tmp]);
const extracted = (await fs.readdir(tmp)).find((name) => name.startsWith(`${repo}-`));
if (!extracted) throw new Error("展開したリポジトリが見つかりません。");

const pairs = [
  [path.join(tmp, extracted, "content"), path.join(root, "content")],
  [path.join(tmp, extracted, "public", "uploads"), path.join(root, "public", "uploads")]
] as const;

let added = 0;
let updated = 0;
let removed = 0;

async function syncDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const srcEntries = await fs.readdir(src, { recursive: true }).catch(() => []);
  const destEntries = await fs.readdir(dest, { recursive: true }).catch(() => []);
  const srcFiles = new Set<string>();
  for (const entry of srcEntries) {
    const srcPath = path.join(src, entry.toString());
    if ((await fs.stat(srcPath)).isFile()) srcFiles.add(entry.toString());
  }
  for (const file of srcFiles) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const existed = await fs.stat(destPath).then(() => true).catch(() => false);
    if (existed) updated += 1;
    else added += 1;
    if (!dryRun) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
    }
  }
  for (const entry of destEntries) {
    const destPath = path.join(dest, entry.toString());
    if ((await fs.stat(destPath)).isFile() && !srcFiles.has(entry.toString())) {
      removed += 1;
      if (!dryRun) await fs.rm(destPath);
    }
  }
}

for (const [src, dest] of pairs) await syncDir(src, dest);

console.log(`${dryRun ? "[dry-run] " : ""}新規: ${added}, 更新: ${updated}, 削除対象: ${removed}`);
