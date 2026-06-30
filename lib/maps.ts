const allowedHosts = new Set(["google.com", "www.google.com", "maps.google.com"]);

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
    const embed = new URL("https://www.google.com/maps");
    embed.search = url.search;
    return null;
  }
  return null;
}
