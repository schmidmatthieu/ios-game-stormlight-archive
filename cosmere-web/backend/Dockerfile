# ===============================================
# Cosmere API — Production Dockerfile
# ===============================================
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# -- Production stage --
FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

EXPOSE 4000
CMD ["node", "dist/index.js"]
