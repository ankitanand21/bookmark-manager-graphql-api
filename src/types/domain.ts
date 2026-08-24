import type { Bookmark, Folder } from "@prisma/client";

export type { Bookmark, Folder };

export interface BookmarkConnection {
  nodes: Bookmark[];
  hasNextPage: boolean;
  endCursor: string | null;
}
