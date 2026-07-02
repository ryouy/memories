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

function MapPreview({ title }: { title: string }) {
  return (
    <span className="relative block aspect-[4/3] overflow-hidden bg-stone-100">
      <span className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(120,113,108,.18)_1px,transparent_1px),linear-gradient(rgba(120,113,108,.18)_1px,transparent_1px)] [background-size:28px_28px]" />
      <span className="absolute left-8 top-8 h-16 w-28 rounded-full border-8 border-white/70 bg-stone-200" />
      <span className="absolute bottom-8 right-8 h-20 w-32 rounded-full border-8 border-white/70 bg-stone-200" />
      <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-sm text-white shadow-sm">
        ●
      </span>
      <span className="sr-only">{title}</span>
    </span>
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
          const title = block.title || "地図";
          return (
            <section key={block.id} className="mx-auto max-w-[760px]">
              {isAllowedGoogleMapsUrl(block.googleMapsUrl) ? (
                <a href={block.googleMapsUrl} target="_blank" rel="noreferrer" className="grid overflow-hidden rounded-lg border border-stone-200 bg-white sm:grid-cols-[220px_1fr]">
                  {embed ? (
                    <iframe
                      src={embed}
                      title={title}
                      className="pointer-events-none aspect-[4/3] w-full border-0 sm:h-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <MapPreview title={title} />
                  )}
                  <span className="flex min-h-24 flex-col justify-center gap-1 p-4">
                    <span className="text-sm text-stone-500">Google Maps</span>
                    <span className="font-medium">{title}</span>
                    <span className="text-sm text-stone-500">クリックして地図を開く</span>
                  </span>
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
