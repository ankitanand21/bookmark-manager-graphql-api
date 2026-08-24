import { GraphQLError } from "graphql";
import type { PrismaClient } from "@prisma/client";
import type { AppContext } from "../types/context";
import {
  createFolderInputSchema,
  createBookmarkInputSchema,
  updateBookmarkInputSchema,
  bookmarkFilterSchema,
} from "../validation/schemas";
import {
  createFolder,
  getFolder,
  getFolderBookmarks,
  listFolders,
} from "../services/folder.service";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  moveBookmark,
  updateBookmark,
  type CreateBookmarkData,
  type UpdateBookmarkData,
} from "../services/bookmark.service";

interface CreateFolderArgs {
  input: {
    name: string;
  };
}

interface CreateBookmarkArgs {
  input: {
    title: string;
    url: string;
    tags?: string[] | null;
    folderId: string;
  };
}

interface UpdateBookmarkArgs {
  id: string;
  input: {
    title?: string | null;
    url?: string | null;
    tags?: string[] | null;
  };
}

interface IdArgs {
  id: string;
}

interface MoveBookmarkArgs {
  id: string;
  folderId: string;
}

interface BookmarksArgs {
  folderId?: string | null;
  search?: string | null;
  take?: number | null;
  cursor?: string | null;
}

interface FolderParent {
  id: string;
}

interface BookmarkParent {
  folderId: string;
}

interface BookmarkConnectionParent {
  hasNextPage: boolean;
  endCursor: string | null;
}

function validationError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: "BAD_USER_INPUT",
    },
  });
}

function notFoundError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
}

function mapServiceError(error: unknown): never {
  if (error instanceof Error) {
    if (
      error.message === "Bookmark not found" ||
      error.message === "Folder not found"
    ) {
      throw notFoundError(error.message);
    }

    if (error.message === "Invalid pagination cursor") {
      throw validationError(error.message);
    }
  }

  throw error;
}

export interface ResolverDependencies {
  prisma: PrismaClient;
}

export function createResolvers(dependencies: ResolverDependencies) {
  const context = (): AppContext => dependencies;

  return {
    Query: {
      folders: () => listFolders(context().prisma),

      folder: async (_parent: unknown, args: IdArgs) => {
        try {
          return await getFolder(context().prisma, args.id);
        } catch (error) {
          mapServiceError(error);
        }
      },

      bookmarks: async (_parent: unknown, args: BookmarksArgs) => {
        const parsed = bookmarkFilterSchema.safeParse({
          folderId: args.folderId ?? undefined,
          search: args.search ?? undefined,
          take: args.take ?? undefined,
          cursor: args.cursor ?? undefined,
        });

        if (!parsed.success) {
          throw validationError(
            parsed.error.issues[0]?.message ?? "Invalid bookmark filters",
          );
        }

        const filter = {
          take: parsed.data.take,
          ...(parsed.data.folderId !== undefined
            ? { folderId: parsed.data.folderId }
            : {}),
          ...(parsed.data.search !== undefined
            ? { search: parsed.data.search }
            : {}),
          ...(parsed.data.cursor !== undefined
            ? { cursor: parsed.data.cursor }
            : {}),
        };

        try {
          return await listBookmarks(context().prisma, filter);
        } catch (error) {
          mapServiceError(error);
        }
      },
    },

    Folder: {
      createdAt: (parent: { createdAt: Date }) =>
        parent.createdAt.toISOString(),

      bookmarks: (parent: FolderParent) =>
        getFolderBookmarks(context().prisma, parent.id),
    },

    Bookmark: {
      createdAt: (parent: { createdAt: Date }) =>
        parent.createdAt.toISOString(),

      folder: (parent: BookmarkParent) =>
        getFolder(context().prisma, parent.folderId),
    },

    BookmarkConnection: {
      pageInfo: (parent: BookmarkConnectionParent) => ({
        hasNextPage: parent.hasNextPage,
        endCursor: parent.endCursor,
      }),
    },

    Mutation: {
      createFolder: async (_parent: unknown, args: CreateFolderArgs) => {
        const parsed = createFolderInputSchema.safeParse(args.input);

        if (!parsed.success) {
          throw validationError(
            parsed.error.issues[0]?.message ?? "Invalid folder input",
          );
        }

        return createFolder(context().prisma, parsed.data.name);
      },

      createBookmark: async (
        _parent: unknown,
        args: CreateBookmarkArgs,
      ) => {
        const parsed = createBookmarkInputSchema.safeParse({
          title: args.input.title,
          url: args.input.url,
          tags: args.input.tags ?? [],
          folderId: args.input.folderId,
        });

        if (!parsed.success) {
          throw validationError(
            parsed.error.issues[0]?.message ?? "Invalid bookmark input",
          );
        }

        const data: CreateBookmarkData = {
          title: parsed.data.title,
          url: parsed.data.url,
          tags: parsed.data.tags,
          folderId: parsed.data.folderId,
        };

        try {
          return await createBookmark(context().prisma, data);
        } catch (error) {
          mapServiceError(error);
        }
      },

      updateBookmark: async (_parent: unknown, args: UpdateBookmarkArgs) => {
        const parsed = updateBookmarkInputSchema.safeParse({
          title: args.input.title ?? undefined,
          url: args.input.url ?? undefined,
          tags: args.input.tags ?? undefined,
        });

        if (!parsed.success) {
          throw validationError(
            parsed.error.issues[0]?.message ?? "Invalid bookmark input",
          );
        }

        const data: UpdateBookmarkData = {
          ...(parsed.data.title !== undefined
            ? { title: parsed.data.title }
            : {}),
          ...(parsed.data.url !== undefined
            ? { url: parsed.data.url }
            : {}),
          ...(parsed.data.tags !== undefined
            ? { tags: parsed.data.tags }
            : {}),
        };

        try {
          return await updateBookmark(context().prisma, args.id, data);
        } catch (error) {
          mapServiceError(error);
        }
      },

      deleteBookmark: async (_parent: unknown, args: IdArgs) => {
        try {
          return await deleteBookmark(context().prisma, args.id);
        } catch (error) {
          mapServiceError(error);
        }
      },

      moveBookmark: async (_parent: unknown, args: MoveBookmarkArgs) => {
        try {
          return await moveBookmark(
            context().prisma,
            args.id,
            args.folderId,
          );
        } catch (error) {
          mapServiceError(error);
        }
      },
    },
  };
}

