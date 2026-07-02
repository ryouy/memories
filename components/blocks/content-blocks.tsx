import type { ContentBlock, ImageItem } from "@/types/content";
import { renderMarkdown } from "@/lib/markdown";
import { isAllowedGoogleMapsUrl, toGoogleMapsEmbedUrl } from "@/lib/maps";
import { youtubeEmbedUrl } from "@/lib/youtube";

function Caption({ image }: { image: ImageItem }) {
  return image.caption ? <figcaption className="mt-2 text-sm text-stone-500">{image.caption}</figcaption> : null;
}

function ImageFigure({ image, className = "" }: { image: ImageItem; className?: string }) {
  return (
    <figure className={className}>
      <a href={image.src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} className="h-auto w-full rounded-lg object-cover" loading="lazy" />
      </a>
      <Caption image={image} />
    </figure>
  );
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-12">
      {blocks.map((block) => {
        if (block.type === "text") {
          return (
            <div
              key={block.id}
              className="prose-memories mx-auto max-w-[760px] text-[17px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
            />
          );
        }

        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag key={block.id} className="mx-auto max-w-[760px] font-serif text-3xl leading-tight sm:text-4xl">
              {block.text}
            </Tag>
          );
        }

        if (block.type === "image") {
          const width = {
            medium: "mx-auto max-w-[760px]",
            large: "mx-auto max-w-5xl",
            full: "mx-auto max-w-[1360px]"
          }[block.displayWidth];
          return <ImageFigure key={block.id} image={block.image} className={width} />;
        }

        if (block.type === "imageGallery") {
          return (
            <div key={block.id} className="mx-auto grid max-w-[1180px] gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {block.images.map((image) => (
                <ImageFigure key={image.src} image={image} />
              ))}
            </div>
          );
        }

        if (block.type === "map") {
          const embed = toGoogleMapsEmbedUrl(block.googleMapsUrl);
          return (
            <section key={block.id} className="mx-auto max-w-[760px]">
              {embed ? (
                <a href={block.googleMapsUrl} target="_blank" rel="noreferrer" className="grid overflow-hidden rounded-lg border border-stone-200 bg-white sm:grid-cols-[220px_1fr]">
                  <iframe
                    src={embed}
                    title={block.title ?? "Google Maps"}
                    className="pointer-events-none aspect-[4/3] w-full border-0 sm:h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <span className="flex min-h-24 flex-col justify-center gap-1 p-4">
                    <span className="text-sm text-stone-500">Google Maps</span>
                    <span className="font-medium">{block.title || "地図"}</span>
                  </span>
                </a>
              ) : isAllowedGoogleMapsUrl(block.googleMapsUrl) ? (
                <a className="block rounded-lg border border-stone-200 bg-white p-4" href={block.googleMapsUrl} target="_blank" rel="noreferrer">
                  <span className="block text-sm text-stone-500">Google Maps</span>
                  <span className="mt-1 block font-medium">{block.title || "地図"}</span>
                </a>
              ) : null}
            </section>
          );
        }

        if (block.type === "youtube") {
          return (
            <section key={block.id} className="mx-auto max-w-[960px]">
              <iframe
                src={youtubeEmbedUrl(block.videoId, block.startSeconds)}
                title={block.title}
                className="aspect-video w-full rounded-lg border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </section>
          );
        }

        return <hr key={block.id} className="mx-auto max-w-[760px] border-stone-300" />;
      })}
    </div>
  );
}
