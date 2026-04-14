FROM node:22.15-slim

WORKDIR /app

COPY package.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build:server

RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/server/server/index.js"]
