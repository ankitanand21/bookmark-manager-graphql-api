import type { PrismaClient } from "@prisma/client";

export async function listFolders(prisma: PrismaClient) {
  return prisma.folder.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getFolder(prisma: PrismaClient, id: string) {
  return prisma.folder.findUnique({ where: { id } });
}

export async function getFolderBookmarks(prisma: PrismaClient, folderId: string) {
  return prisma.bookmark.findMany({
    where: { folderId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export async function createFolder(prisma: PrismaClient, name: string) {
  return prisma.folder.create({ data: { name } });
}
