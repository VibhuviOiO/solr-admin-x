FROM node:20 AS builder

# Build frontend
WORKDIR /app
COPY fronend ./fronend
WORKDIR /app/fronend
RUN npm ci && npm run build

# Build backend
WORKDIR /app
COPY backend ./backend
COPY package*.json ./
RUN npm ci
WORKDIR /app/backend
RUN npm ci && npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy backend build and dependencies
COPY --from=builder /app/backend/dist ./
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/src/config ./src/config

# Copy frontend build
COPY --from=builder /app/fronend/dist ./public

# Create a simple static file server setup
RUN npm install express cors dotenv axios

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
