import { afterAll, describe, expect, test } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { createFolder } from "../../src/services/folder.service";
import { createBookmark, listBookmarks } from "../../src/services/bookmark.service";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PostgreSQL integration", () => {
  test("creates and reads a bookmark using real PostgreSQL", async () => {
    const folder = await createFolder(prisma, `Integration ${Date.now()}`);

    const bookmark = await createBookmark(prisma, {
      title: "Bun Documentation",
      url: "https://bun.com/docs",
      tags: ["bun", "docs"],
      folderId: folder.id,
    });

    expect(bookmark.title).toBe("Bun Documentation");
    expect(bookmark.folderId).toBe(folder.id);

    const result = await listBookmarks(prisma, {
      folderId: folder.id,
      take: 10,
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe(bookmark.id);
  }, 15000);
});
