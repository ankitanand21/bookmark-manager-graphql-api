FROM oven/bun:1.2.20

WORKDIR /app

COPY package.json ./
RUN bun install

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json .

RUN bun run gendb

EXPOSE 4000

CMD ["bun", "src/server.ts"]
