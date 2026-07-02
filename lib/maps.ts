const allowedHosts = new Set(["google.com", "www.google.com", "maps.google.com", "google.co.jp", "www.google.co.jp", "maps.google.co.jp", "maps.app.goo.gl"]);

export function isAllowedGoogleMapsUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:" && allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export function toGoogleMapsEmbedUrl(input: string) {
  if (!isAllowedGoogleMapsUrl(input)) return null;
  const url = new URL(input);
  if (url.pathname.startsWith("/maps/embed")) return url.toString();
  return null;
}
