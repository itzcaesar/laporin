#!/bin/bash
# ── deploy/deploy.sh ──
# Deployment script for Laporin (subsequent deploys)
# Pulls latest code, installs deps, builds, migrates, and restarts PM2
#
# Usage: bash deploy/deploy.sh
#    or: bash deploy/deploy.sh --skip-migrate  (skip DB migration)
# ──────────────────────────────────────────────────────────

set -euo pipefail

# ── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ── Variables ─────────────────────────────────────────────
APP_DIR="/var/www/laporin"
SKIP_MIGRATE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-migrate) SKIP_MIGRATE=true ;;
  esac
done

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🚀 Laporin Deployment"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════"
echo ""

cd "${APP_DIR}"

# ══════════════════════════════════════════════════════════
# 1. Pull latest code
# ══════════════════════════════════════════════════════════
info "Pulling latest code..."
git pull origin main
log "Code updated"

# ══════════════════════════════════════════════════════════
# 2. Install dependencies
# ══════════════════════════════════════════════════════════
info "Installing dependencies..."
pnpm install --frozen-lockfile
log "Dependencies installed"

# ══════════════════════════════════════════════════════════
# 3. Generate Prisma Client
# ══════════════════════════════════════════════════════════
info "Generating Prisma client..."
cd apps/api
npx prisma generate
log "Prisma client generated"

# ══════════════════════════════════════════════════════════
# 4. Run database migrations (if not skipped)
# ══════════════════════════════════════════════════════════
if [ "${SKIP_MIGRATE}" = false ]; then
  info "Running database migrations..."
  npx prisma migrate deploy
  log "Migrations applied"
else
  warn "Skipping database migrations (--skip-migrate)"
fi

cd "${APP_DIR}"

# ══════════════════════════════════════════════════════════
# 5. Build all apps
# ══════════════════════════════════════════════════════════
info "Building applications..."
pnpm build
log "Build complete"

# ══════════════════════════════════════════════════════════
# 6. Create log directory
# ══════════════════════════════════════════════════════════
mkdir -p /var/www/laporin/logs

# ══════════════════════════════════════════════════════════
# 7. Restart PM2 processes
# ══════════════════════════════════════════════════════════
info "Reloading PM2 processes..."

if pm2 list | grep -q "laporin"; then
  # Reload existing processes (zero-downtime)
  pm2 reload ecosystem.config.cjs
  log "PM2 processes reloaded"
else
  # First deployment — start processes
  pm2 start ecosystem.config.cjs
  pm2 save
  log "PM2 processes started and saved"
fi

# ══════════════════════════════════════════════════════════
# 8. Health check
# ══════════════════════════════════════════════════════════
info "Running health checks..."
sleep 3

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null || echo "FAIL")
if [ "${API_STATUS}" = "200" ]; then
  log "API health check passed (HTTP 200)"
else
  warn "API health check returned: ${API_STATUS}"
fi

# Check frontend
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "FAIL")
if [ "${FE_STATUS}" = "200" ]; then
  log "Frontend health check passed (HTTP 200)"
else
  warn "Frontend health check returned: ${FE_STATUS}"
fi

# PM2 status
echo ""
pm2 list

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Frontend: http://localhost:3000 → https://laporin.site"
echo "  API:      http://localhost:4000 → https://api.laporin.site"
echo ""
echo "  Useful commands:"
echo "    pm2 logs laporin-api   — View API logs"
echo "    pm2 logs laporin-web   — View frontend logs"
echo "    pm2 monit              — Monitor processes"
echo "    pm2 status             — Check process status"
echo ""
echo "═══════════════════════════════════════════════════════"
