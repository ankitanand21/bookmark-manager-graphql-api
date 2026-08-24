import { z } from "zod";

export const createFolderInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name cannot be empty")
    .max(100),
});

const bookmarkUrlSchema = z
  .string()
  .trim()
  .url("Bookmark URL must be a valid URL")
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;

        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    "Bookmark URL must use http or https",
  );

export const createBookmarkInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Bookmark title cannot be empty")
    .max(200),

  url: bookmarkUrlSchema,

  tags: z
    .array(z.string().trim().min(1))
    .max(20)
    .default([]),

  folderId: z
    .string()
    .trim()
    .min(1, "Folder ID is required"),
});

export const updateBookmarkInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Bookmark title cannot be empty")
    .max(200)
    .optional(),

  url: bookmarkUrlSchema.optional(),

  tags: z
    .array(z.string().trim().min(1))
    .max(20)
    .optional(),
});

export const bookmarkFilterSchema = z.object({
  folderId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  search: z
    .string()
    .trim()
    .max(200)
    .optional(),

  take: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  cursor: z
    .string()
    .trim()
    .min(1)
    .optional(),
});
