import type { Entry } from "@/types/content";

type GitHubContent = {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  content?: string;
  encoding?: "base64";
};

function githubEnv() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) throw new Error("GitHub environment variables are missing.");
  return { owner, repo, branch, token };
}

async function gh<T>(path: string, init: RequestInit = {}) {
  const { owner, repo, token } = githubEnv();
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub ${response.status}: ${text.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

export async function githubStatus() {
  try {
    const { branch } = githubEnv();
    await gh(`/branches/${branch}`);
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

export async function getEntryFromGitHub(slug: string) {
  const { branch } = githubEnv();
  const content = await gh<GitHubContent>(`/contents/content/entries/${slug}.json?ref=${branch}`);
  if (content.type !== "file" || content.encoding !== "base64" || !content.content) {
    throw new Error("Invalid GitHub content response.");
  }
  const json = Buffer.from(content.content, "base64").toString("utf8");
  return { entry: JSON.parse(json) as Entry, sha: content.sha };
}

export async function listEntriesFromGitHub() {
  const { branch } = githubEnv();
  const files = await gh<GitHubContent[]>(`/contents/content/entries?ref=${branch}`);
  return files.filter((file) => file.type === "file" && file.name.endsWith(".json"));
}

export async function putEntryToGitHub(entry: Entry, previousSha?: string) {
  const { branch } = githubEnv();
  const path = `content/entries/${entry.slug}.json`;
  const body: Record<string, unknown> = {
    message: `content: ${previousSha ? "update" : "add"} ${entry.slug}`,
    content: Buffer.from(`${JSON.stringify(entry, null, 2)}\n`, "utf8").toString("base64"),
    branch
  };
  if (previousSha) body.sha = previousSha;
  return gh(`/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export async function putUploadToGitHub(path: string, contentBase64: string) {
  const { branch } = githubEnv();
  return gh(`/contents/${path.replace(/^\/+/, "")}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `content: upload ${path.split("/").pop()}`,
      content: contentBase64,
      branch
    })
  });
}

export async function deleteEntryFromGitHub(slug: string, sha: string) {
  const { branch } = githubEnv();
  return gh(`/contents/content/entries/${slug}.json`, {
    method: "DELETE",
    body: JSON.stringify({
      message: `content: delete ${slug}`,
      sha,
      branch
    })
  });
}
