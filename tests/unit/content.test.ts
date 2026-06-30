import { describe, expect, it } from "vitest";
import { entrySchema } from "@/lib/validation/content";
import { slugify } from "@/lib/utils/slug";
import { parseYouTubeUrl } from "@/lib/youtube";
import { isAllowedGoogleMapsUrl } from "@/lib/maps";
import { createUploadFilename } from "@/lib/images/filenames";

describe("content utilities", () => {
  it("validates an entry with discriminated blocks", () => {
    const result = entrySchema.safeParse({
      schemaVersion: 1,
      id: "id-1",
      slug: "sample-entry",
      title: "Sample",
      summary: "Summary",
      status: "published",
      visitedAt: "2026-01-01",
      createdAt: "2026-01-01T00:00:00+09:00",
      updatedAt: "2026-01-01T00:00:00+09:00",
      tags: ["旅"],
      coverImage: { src: "/uploads/sample-entry/20260101-001.webp", alt: "alt", width: 1200, height: 800 },
      blocks: [{ id: "b1", type: "text", content: "**hello**" }]
    });
    expect(result.success).toBe(true);
  });

  it("generates safe slugs", () => {
    expect(slugify("Tokyo Skytree!!")).toBe("tokyo-skytree");
  });

  it("parses YouTube URL variants", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=43")).toEqual({ videoId: "dQw4w9WgXcQ", startSeconds: 43 });
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
  });

  it("allows only Google Maps URLs", () => {
    expect(isAllowedGoogleMapsUrl("https://www.google.com/maps/place/Test")).toBe(true);
    expect(isAllowedGoogleMapsUrl("https://example.com/maps")).toBe(false);
  });

  it("creates normalized upload filenames", () => {
    expect(createUploadFilename(new Date("2026-01-02T03:04:05Z"), "webp")).toMatch(/^20260102T030405-[a-f0-9]{6}\.webp$/);
  });
});
