FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

# Cache bust: 2026-04-09T15:10
COPY . .
RUN npm run build:server

RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/server/server/index.js"]
