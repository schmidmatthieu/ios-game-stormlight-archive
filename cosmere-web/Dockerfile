# ===============================================
# Cosmere Chronicles — Production Dockerfile
# ===============================================
# Multi-stage build: Node (build) → Nginx (serve)
#
# Usage:
#   docker build -t cosmere-web .
#   docker run -p 3016:80 cosmere-web

# -- Stage 1: Build ------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# -- Stage 2: Serve ------------------------------------------
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80 || exit 1

EXPOSE 80
