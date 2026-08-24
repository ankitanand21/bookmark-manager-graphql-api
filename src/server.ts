import "dotenv/config";
import { createYoga } from "graphql-yoga";
import { prisma } from "./lib/prisma";
import { createGraphQLSchema } from "./graphql/schema";

const port = Number(process.env.PORT ?? 4000);
const typeDefs = await Bun.file(new URL("./graphql/schema.graphql", import.meta.url)).text();
const schema = createGraphQLSchema(prisma, typeDefs);
const yoga = createYoga({ schema, graphqlEndpoint: "/graphql" });

const server = Bun.serve({
  port,
  fetch: yoga.fetch,
});

console.log(`Bookmark Manager API running at http://localhost:${server.port}/graphql`);

const shutdown = async () => {
  await prisma.$disconnect();
  server.stop();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
