export type EntryStatus = "draft" | "published";

export type ImageItem = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  previewSrc?: string;
};

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  image: ImageItem;
  displayWidth: "medium" | "large" | "full";
};

export type ImageGalleryBlock = {
  id: string;
  type: "imageGallery";
  layout: "grid" | "carousel";
  images: ImageItem[];
};

export type MapBlock = {
  id: string;
  type: "map";
  displayMode?: "card" | "embed";
  title?: string;
  googleMapsUrl: string;
  image?: ImageItem;
};

export type YouTubeBlock = {
  id: string;
  type: "youtube";
  videoId: string;
  title: string;
  startSeconds?: number;
};

export type DividerBlock = {
  id: string;
  type: "divider";
};

export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | ImageGalleryBlock
  | MapBlock
  | YouTubeBlock
  | DividerBlock;

export type EntryLocation = {
  name?: string;
  address?: string;
  googleMapsUrl?: string;
};

export type Entry = {
  schemaVersion: 1;
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: EntryStatus;
  visitedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  location?: EntryLocation;
  coverImage?: ImageItem;
  blocks: ContentBlock[];
};

export type SiteSettings = {
  title: string;
  description: string;
};
