const allowedHosts = new Set(["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl"]);

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
  if (url.pathname.startsWith("/maps")) {
    url.searchParams.set("output", "embed");
    return url.toString();
  }
  return null;
}
