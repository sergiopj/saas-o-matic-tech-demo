# Multi-stage Dockerfile for NestJS Microservice (mic-saas-omatic)
# Base stage with Node 22 slim for reliable C++ compilation of better-sqlite3
FROM node:22-slim AS builder

WORKDIR /app

# Install native compilation dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependency declarations
COPY mic-saas-omatic/package*.json ./
RUN npm ci

# Copy backend source code and workspace specs
COPY mic-saas-omatic/ ./
COPY ai-workspace/01-specs/ ./ai-workspace/01-specs/

# Build TypeScript to production dist
RUN npm run build

# Production runner stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install minimal build tools for runtime npm ci --omit=dev of native better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY mic-saas-omatic/package*.json ./
RUN npm ci --omit=dev \
    && apt-get purge -y make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ai-workspace/01-specs ./ai-workspace/01-specs

# Create persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/main.js"]
