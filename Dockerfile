FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

COPY . .
ARG CACHEBUST=1
RUN npm run build:server

RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/server/server/index.js"]
