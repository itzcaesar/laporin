#!/bin/bash
# ── deploy/setup-pm2.sh ──
# PM2 Initialization script for Laporin
# Starts the Next.js and Hono API processes and saves them to start on boot.
#
# Prerequisites: App must be built (pnpm build) before running this.
# Usage: sudo -u laporin bash deploy/setup-pm2.sh
# ──────────────────────────────────────────────────────────

set -euo pipefail

# ── Colors ────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="/var/www/laporin"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ⚙️  PM2 Setup — Laporin"
echo "═══════════════════════════════════════════════════════"
echo ""

# Ensure we're running as the right user or have access to PM2
if ! command -v pm2 &> /dev/null; then
    err "PM2 is not installed or not in PATH."
fi

cd "${APP_DIR}"

# Ensure log directory exists
mkdir -p /var/www/laporin/logs

info "Starting PM2 processes from ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs

info "Saving PM2 process list to auto-start on boot..."
pm2 save

log "PM2 setup complete"
echo ""
pm2 status
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Useful PM2 commands:"
echo "    pm2 logs         — View all logs"
echo "    pm2 logs <name>  — View specific logs (e.g. laporin-api)"
echo "    pm2 monit        — Open PM2 dashboard"
echo "    pm2 restart all  — Restart all processes"
echo "═══════════════════════════════════════════════════════"
