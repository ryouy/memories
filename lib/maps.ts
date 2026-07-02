const allowedHosts = new Set(["google.com", "www.google.com", "maps.google.com", "google.co.jp", "www.google.co.jp", "maps.google.co.jp", "maps.app.goo.gl"]);

export function isAllowedGoogleMapsUrl(input: string) {
  try {
    return Boolean(toGoogleMapsUrl(input));
  } catch {
    return false;
  }
}

export function toGoogleMapsUrl(input: string) {
  const url = parseGoogleMapsUrl(input);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) return null;
  return url.toString();
}

export function toGoogleMapsEmbedUrl(input: string) {
  const normalized = toGoogleMapsUrl(input);
  if (!normalized) return null;
  const url = new URL(normalized);
  if (url.pathname.startsWith("/maps/embed")) return url.toString();
  return null;
}

export function getGoogleMapsTitle(input: string) {
  try {
    const url = parseGoogleMapsUrl(input);
    const queryTitle = url.searchParams.get("q") || url.searchParams.get("query");
    if (queryTitle) return cleanMapsTitle(queryTitle);

    const parts = url.pathname.split("/").filter(Boolean);
    const placeIndex = parts.findIndex((part) => part === "place" || part === "search");
    const pathTitle = placeIndex >= 0 ? parts[placeIndex + 1] : "";
    if (pathTitle) return cleanMapsTitle(pathTitle);
  } catch {
    return "";
  }
  return "";
}

function parseGoogleMapsUrl(input: string) {
  const trimmed = extractIframeSrc(input.trim());
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

function cleanMapsTitle(value: string) {
  return decodeURIComponent(value.replace(/\+/g, " ")).replace(/\s+/g, " ").trim();
}

function extractIframeSrc(input: string) {
  const match = input.match(/\bsrc=["']([^"']+)["']/i);
  return match?.[1] ?? input;
}
