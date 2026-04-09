FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

COPY server/ ./server/
COPY drizzle/ ./drizzle/
COPY glumira-trpc-types.ts ./
COPY tsconfig.server.json ./
RUN npm run build:server

RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/server/server/index.js"]
