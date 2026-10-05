# Production Multi-Stage Dockerfile for KAWACH (कवच)
# Node.js 22 LTS + Python 3.10 Runtime Environment

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend bundle
COPY . .
RUN npm run build

# --- Production Image ---
FROM node:22-alpine

# Install Python 3 and basic build essentials
RUN apk add --no-cache python3 py3-pip curl

WORKDIR /app

# Install production node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application build and source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/app ./app
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/her_safe.py ./her_safe.py
COPY --from=builder /app/her_safe_db.json ./her_safe_db.json
COPY --from=builder /app/metadata.json ./metadata.json
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PORT=8000
ENV PYTHON_HOST=0.0.0.0

EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start full-stack server
CMD ["npx", "tsx", "server.ts"]
