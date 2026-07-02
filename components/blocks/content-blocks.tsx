import type { ContentBlock, ImageItem } from "@/types/content";
import { renderMarkdown } from "@/lib/markdown";
import { getGoogleMapsTitle, toGoogleMapsEmbedUrl, toGoogleMapsUrl } from "@/lib/maps";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { MapCard } from "@/components/blocks/map-card";

const widthClasses = {
  small: "mx-auto max-w-[520px]",
  medium: "mx-auto max-w-[760px]",
  large: "mx-auto max-w-[960px]",
  wide: "mx-auto max-w-[1180px]",
  full: "mx-auto max-w-[1360px]"
};

const mapAspectClasses = {
  small: "aspect-[16/9] min-h-48",
  medium: "aspect-[16/9] min-h-52",
  large: "aspect-[21/9] min-h-56",
  wide: "aspect-[21/8] min-h-60",
  full: "aspect-[24/9] min-h-64"
};

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
          const width = widthClasses[block.displayWidth] ?? widthClasses.large;
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
          const mapUrl = toGoogleMapsUrl(block.googleMapsUrl);
          const title = block.title || getGoogleMapsTitle(block.googleMapsUrl) || "Google Maps";
          const displayWidth = block.displayWidth ?? "large";
          return (
            <section key={block.id} className={embed ? widthClasses[displayWidth] : widthClasses[displayWidth]}>
              {mapUrl ? (
                embed ? (
                  <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                    <iframe
                      src={embed}
                      title={title}
                      className={`${mapAspectClasses[displayWidth]} w-full border-0`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <MapCard mapUrl={mapUrl} title={title} />
                )
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
