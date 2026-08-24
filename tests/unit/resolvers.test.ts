import { describe, expect, mock, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { createResolvers } from "../../src/graphql/resolvers";

function makePrismaMock() {
  return {
    folder: {
      findMany: mock(async () => []),
      findUnique: mock(async () => ({ id: "folder-1", name: "Dev", createdAt: new Date() })),
      create: mock(async ({ data }: { data: { name: string } }) => ({
        id: "folder-1",
        name: data.name,
        createdAt: new Date(),
      })),
    },
    bookmark: {
      findMany: mock(async () => []),
      findUnique: mock(async () => ({
        id: "bookmark-1",
        title: "TypeScript",
        url: "https://www.typescriptlang.org",
        tags: ["ts"],
        folderId: "folder-1",
        createdAt: new Date(),
      })),
      create: mock(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "bookmark-1",
        ...data,
        createdAt: new Date(),
      })),
      update: mock(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "bookmark-1",
        title: "Updated",
        url: "https://example.com",
        tags: [],
        folderId: "folder-1",
        createdAt: new Date(),
        ...data,
      })),
      delete: mock(async () => ({ id: "bookmark-1" })),
    },
  };
}

test("createFolder returns the created folder", async () => {
  const prisma = makePrismaMock();
  const resolvers = createResolvers({ prisma: prisma as unknown as PrismaClient });

  const result = await resolvers.Mutation.createFolder(undefined, {
    input: { name: "  Development  " },
  });

  expect(result.name).toBe("Development");
  expect(prisma.folder.create).toHaveBeenCalledWith({ data: { name: "Development" } });
});

test("createBookmark rejects whitespace-only titles", async () => {
  const prisma = makePrismaMock();
  const resolvers = createResolvers({ prisma: prisma as unknown as PrismaClient });

  await expect(
    resolvers.Mutation.createBookmark(undefined, {
      input: {
        title: "   ",
        url: "https://example.com",
        tags: [],
        folderId: "folder-1",
      },
    }),
  ).rejects.toMatchObject({
    message: "Bookmark title cannot be empty",
    extensions: { code: "BAD_USER_INPUT" },
  });
});

test("createBookmark rejects malformed URLs", async () => {
  const prisma = makePrismaMock();
  const resolvers = createResolvers({ prisma: prisma as unknown as PrismaClient });

  await expect(
    resolvers.Mutation.createBookmark(undefined, {
      input: {
        title: "Example",
        url: "not-a-url",
        tags: [],
        folderId: "folder-1",
      },
    }),
  ).rejects.toMatchObject({
    message: "Bookmark URL must be a valid URL",
    extensions: { code: "BAD_USER_INPUT" },
  });
});

describe("bookmark mutations", () => {
  test("deleteBookmark returns true when deletion succeeds", async () => {
    const prisma = makePrismaMock();
    const resolvers = createResolvers({ prisma: prisma as unknown as PrismaClient });

    const result = await resolvers.Mutation.deleteBookmark(undefined, { id: "bookmark-1" });

    expect(result).toBe(true);
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: "bookmark-1" } });
  });
});
