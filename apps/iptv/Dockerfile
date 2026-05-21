FROM node:20-alpine AS base
RUN apk add --no-cache tini
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]