FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY server/* ./server/

USER node

EXPOSE 3000

CMD ["node", "server/index.js"]
