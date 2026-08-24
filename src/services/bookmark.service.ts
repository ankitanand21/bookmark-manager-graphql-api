import type { Prisma, PrismaClient } from "@prisma/client";
import type { BookmarkConnection } from "../types/domain";

interface BookmarkFilter {
  folderId?: string;
  search?: string;
  take: number;
  cursor?: string;
}

interface CursorData {
  createdAt: string;
  id: string;
}

export interface CreateBookmarkData {
  title: string;
  url: string;
  tags: string[];
  folderId: string;
}

export interface UpdateBookmarkData {
  title?: string;
  url?: string;
  tags?: string[];
}

export function encodeCursor(createdAt: Date, id: string): string {
  const value = JSON.stringify({
    createdAt: createdAt.toISOString(),
    id,
  });

  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): CursorData {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("createdAt" in parsed) ||
      !("id" in parsed) ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string"
    ) {
      throw new Error("Invalid cursor");
    }

    const date = new Date(parsed.createdAt);

    if (Number.isNaN(date.getTime()) || parsed.id.length === 0) {
      throw new Error("Invalid cursor");
    }

    return {
      createdAt: date.toISOString(),
      id: parsed.id,
    };
  } catch {
    throw new Error("Invalid pagination cursor");
  }
}

export async function listBookmarks(
  prisma: PrismaClient,
  filter: BookmarkFilter,
): Promise<BookmarkConnection> {
  const where: Prisma.BookmarkWhereInput = {};

  if (filter.folderId) {
    where.folderId = filter.folderId;
  }

  if (filter.search) {
    where.title = {
      contains: filter.search,
      mode: "insensitive",
    };
  }

  if (filter.cursor) {
    const cursor = decodeCursor(filter.cursor);

    where.OR = [
      {
        createdAt: {
          gt: new Date(cursor.createdAt),
        },
      },
      {
        createdAt: new Date(cursor.createdAt),
        id: {
          gt: cursor.id,
        },
      },
    ];
  }

  const rows = await prisma.bookmark.findMany({
    where,
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
    take: filter.take + 1,
  });

  const hasNextPage = rows.length > filter.take;

  const nodes = hasNextPage
    ? rows.slice(0, filter.take)
    : rows;

  const last = nodes.at(-1);

  return {
    nodes,
    hasNextPage,
    endCursor: last
      ? encodeCursor(last.createdAt, last.id)
      : null,
  };
}

export async function getBookmark(
  prisma: PrismaClient,
  id: string,
) {
  return prisma.bookmark.findUnique({
    where: { id },
  });
}

export async function createBookmark(
  prisma: PrismaClient,
  data: CreateBookmarkData,
) {
  const folder = await prisma.folder.findUnique({
    where: {
      id: data.folderId,
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  return prisma.bookmark.create({
    data,
  });
}

export async function updateBookmark(
  prisma: PrismaClient,
  id: string,
  data: UpdateBookmarkData,
) {
  const existing = await getBookmark(prisma, id);

  if (!existing) {
    throw new Error("Bookmark not found");
  }

  return prisma.bookmark.update({
    where: { id },
    data,
  });
}

export async function deleteBookmark(
  prisma: PrismaClient,
  id: string,
) {
  const existing = await getBookmark(prisma, id);

  if (!existing) {
    throw new Error("Bookmark not found");
  }

  await prisma.bookmark.delete({
    where: { id },
  });

  return true;
}

export async function moveBookmark(
  prisma: PrismaClient,
  id: string,
  folderId: string,
) {
  const [bookmark, folder] = await Promise.all([
    getBookmark(prisma, id),
    prisma.folder.findUnique({
      where: { id: folderId },
    }),
  ]);

  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  if (!folder) {
    throw new Error("Folder not found");
  }

  return prisma.bookmark.update({
    where: { id },
    data: { folderId },
  });
}

