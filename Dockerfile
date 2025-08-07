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

# Install production dependencies only
RUN npm install --production express cors dotenv axios

# Copy backend build
COPY --from=builder /app/backend/dist ./
COPY --from=builder /app/backend/package*.json ./

# Copy frontend build
COPY --from=builder /app/fronend/dist ./public

# Create config directory for external mounting
RUN mkdir -p /app/config

# Environment variables
ENV NODE_ENV=production
# DC_CONFIG_PATH must be set via docker-compose or docker run

EXPOSE 3001

CMD ["node", "server.js"]
