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
            <section key={block.id} className="mx-auto max-w-[960px]">
              {block.title ? <h2 className="mb-3 font-serif text-2xl">{block.title}</h2> : null}
              {embed ? (
                <iframe
                  src={embed}
                  title={block.title ?? "Google Maps"}
                  className="aspect-[16/9] w-full rounded-lg border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : isAllowedGoogleMapsUrl(block.googleMapsUrl) ? (
                <a className="inline-flex rounded-md bg-ink px-4 py-3 text-sm text-white" href={block.googleMapsUrl} target="_blank" rel="noreferrer">
                  Google Mapsで開く
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
