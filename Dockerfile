FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY fronend/package*.json ./fronend/

# Install root dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies
WORKDIR /app/fronend
RUN npm install

# Copy source code
WORKDIR /app
COPY backend ./backend
COPY fronend ./fronend

# Build backend
WORKDIR /app/backend
RUN npm run build

# Build frontend
WORKDIR /app/fronend
RUN npm run build

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

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
