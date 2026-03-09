#!/usr/bin/env bash
# ===============================================
# Cosmere Chronicles — Deploy to Production
# ===============================================
# Usage: ./deploy.sh
#
# Requires SSH access to 195.15.219.29

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-195.15.219.29}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PATH="/home/ubuntu/cosmere"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Cosmere Chronicles — Deploying to ${DEPLOY_HOST} ==="

# 1. Sync project files to server (exclude dev files)
echo "[1/4] Syncing files to server..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='pnpm-lock.yaml' \
  "${PROJECT_DIR}/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

# 2. Build and restart containers on server
echo "[2/4] Building Docker images on server..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && docker compose -f docker-compose.production.yml down"

echo "[3/4] Starting containers..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "cd ${DEPLOY_PATH} && docker compose -f docker-compose.production.yml up -d --build"

# 4. Verify deployment
echo "[4/4] Verifying deployment..."
sleep 5
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker ps --format '{{.Names}}\t{{.Status}}' | grep cosmere"

echo ""
echo "=== Deployment complete! ==="
echo "URL: https://cosmere.ark.swiss"
