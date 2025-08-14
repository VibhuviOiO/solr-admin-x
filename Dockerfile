
FROM node:22 AS builder
WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY fronend/package*.json ./fronend/

RUN npm install

WORKDIR /app/backend
RUN npm install

WORKDIR /app/fronend
RUN npm install

WORKDIR /app
COPY backend ./backend
COPY fronend ./fronend

WORKDIR /app/fronend
ENV VITE_API_BASE_URL=/api
RUN npm run build

WORKDIR /app/backend
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production

COPY --from=builder /app/backend/dist ./
COPY --from=builder /app/fronend/dist ./public
RUN mkdir -p /app/config
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.js"]
