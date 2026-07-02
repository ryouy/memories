import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugは英小文字・数字・ハイフンで入力してください。");

const imagePathSchema = z
  .string()
  .regex(/^\/uploads\/[a-z0-9-]+\/[a-z0-9T-]+\.(webp|jpg|jpeg|png|svg)$/);

export const imageItemSchema = z.object({
  src: imagePathSchema,
  alt: z.string().min(1).max(160),
  caption: z.string().max(200).optional().default(""),
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export const textBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  content: z.string().max(20000)
});

export const headingBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1).max(140)
});

export const imageBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  image: imageItemSchema,
  displayWidth: z.union([z.literal("medium"), z.literal("large"), z.literal("full")])
});

export const imageGalleryBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("imageGallery"),
  layout: z.union([z.literal("grid"), z.literal("carousel")]),
  images: z.array(imageItemSchema).min(1)
});

export const mapBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("map"),
  displayMode: z.union([z.literal("card"), z.literal("embed")]).optional().default("card"),
  title: z.string().max(140).optional(),
  googleMapsUrl: z.string().min(1),
  image: imageItemSchema.optional()
});

export const youtubeBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("youtube"),
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  title: z.string().min(1).max(160),
  startSeconds: z.number().int().nonnegative().optional()
});

export const dividerBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("divider")
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  headingBlockSchema,
  imageBlockSchema,
  imageGalleryBlockSchema,
  mapBlockSchema,
  youtubeBlockSchema,
  dividerBlockSchema
]);

export const entrySchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  slug: slugSchema,
  title: z.string().min(1).max(160),
  summary: z.string().max(500),
  status: z.union([z.literal("draft"), z.literal("published")]),
  visitedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  tags: z.array(z.string().min(1).max(40)).max(20),
  location: z
    .object({
      name: z.string().max(160).optional(),
      address: z.string().max(240).optional(),
      googleMapsUrl: z.string().url().optional()
    })
    .optional(),
  coverImage: imageItemSchema.optional(),
  blocks: z.array(contentBlockSchema)
});

export const siteSettingsSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400)
});

export type EntryInput = z.infer<typeof entrySchema>;
