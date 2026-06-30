export type ParsedYouTubeUrl = {
  videoId: string;
  startSeconds?: number;
};

function parseStart(value: string | null) {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) videoId = url.pathname.split("/")[2] ?? null;
      if (url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2] ?? null;
    }

    if (host === "youtu.be") {
      videoId = url.pathname.slice(1).split("/")[0] ?? null;
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;
    return {
      videoId,
      startSeconds: parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"))
    };
  } catch {
    return /^[a-zA-Z0-9_-]{11}$/.test(input) ? { videoId: input } : null;
  }
}

export function youtubeEmbedUrl(videoId: string, startSeconds?: number) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (startSeconds) url.searchParams.set("start", String(startSeconds));
  return url.toString();
}
