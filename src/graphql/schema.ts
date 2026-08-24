import { createSchema } from "graphql-yoga";
import { createResolvers } from "./resolvers";
import type { PrismaClient } from "@prisma/client";

export function createGraphQLSchema(prisma: PrismaClient, typeDefs: string) {
  return createSchema({
    typeDefs,
    resolvers: createResolvers({ prisma }),
  });
}
