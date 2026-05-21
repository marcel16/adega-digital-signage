FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc
EXPOSE 4001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]