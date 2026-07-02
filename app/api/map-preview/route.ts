import { NextResponse } from "next/server";
import { getGoogleMapsTitle, toGoogleMapsUrl } from "@/lib/maps";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("url") ?? "";
  const url = toGoogleMapsUrl(input);
  if (!url) return NextResponse.json({ title: "", image: "" }, { status: 400 });

  const fallbackTitle = getGoogleMapsTitle(input);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 Memories Map Preview"
      },
      cache: "no-store"
    });
    const html = await response.text();
    return NextResponse.json({
      title: cleanTitle(readMeta(html, "og:title") || fallbackTitle),
      image: readMeta(html, "og:image")
    });
  } catch {
    return NextResponse.json({ title: fallbackTitle, image: "" });
  }
}

function readMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tags = html.match(/<meta[^>]*>/gi) ?? [];
  const tag = tags.find((item) => new RegExp(`(?:property|name)=["']${escaped}["']`, "i").test(item));
  return decodeHtml(tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? "");
}

function cleanTitle(value: string) {
  return value.replace(/\s*-\s*Google Maps\s*$/i, "").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
