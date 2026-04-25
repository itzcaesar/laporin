#!/bin/bash
# ── deploy/setup-server.sh ──
# One-time server provisioning script for Laporin VPS
# Target OS: Ubuntu 22.04/24.04 LTS
#
# Usage: sudo bash setup-server.sh
# ──────────────────────────────────────────────────────────

set -euo pipefail

# ── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ── Check root ────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  err "This script must be run as root (use sudo)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🚀 Laporin VPS Setup — Server Provisioning"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── Variables ─────────────────────────────────────────────
APP_USER="laporin"
APP_DIR="/var/www/laporin"
DB_NAME="laporin"
DB_USER="laporin"
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
MINIO_DATA_DIR="/data/minio"

# ══════════════════════════════════════════════════════════
# 1. System Updates & Basic Packages
# ══════════════════════════════════════════════════════════
info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget gnupg2 lsb-release ca-certificates \
  build-essential git unzip software-properties-common \
  ufw fail2ban htop jq

log "System packages installed"

# ══════════════════════════════════════════════════════════
# 2. Create Application User
# ══════════════════════════════════════════════════════════
info "Creating application user '${APP_USER}'..."
if id "${APP_USER}" &>/dev/null; then
  warn "User '${APP_USER}' already exists, skipping"
else
  useradd -m -s /bin/bash "${APP_USER}"
  log "User '${APP_USER}' created"
fi

mkdir -p "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "/home/${APP_USER}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

# ══════════════════════════════════════════════════════════
# 3. Node.js 20 LTS
# ══════════════════════════════════════════════════════════
info "Installing Node.js 20 LTS..."
if command -v node &>/dev/null && [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -ge 20 ]]; then
  warn "Node.js $(node -v) already installed, skipping"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  log "Node.js $(node -v) installed"
fi

# ══════════════════════════════════════════════════════════
# 4. pnpm
# ══════════════════════════════════════════════════════════
info "Installing pnpm..."
if command -v pnpm &>/dev/null; then
  warn "pnpm already installed, skipping"
else
  npm install -g pnpm@9
  log "pnpm $(pnpm -v) installed"
fi

# ══════════════════════════════════════════════════════════
# 5. PM2
# ══════════════════════════════════════════════════════════
info "Installing PM2..."
if command -v pm2 &>/dev/null; then
  warn "PM2 already installed, skipping"
else
  npm install -g pm2
  log "PM2 $(pm2 -v) installed"
fi

# Setup PM2 startup for the app user
pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" || true

# ══════════════════════════════════════════════════════════
# 6. PostgreSQL 16 + PostGIS + pgvector
# ══════════════════════════════════════════════════════════
info "Installing PostgreSQL 16..."

# Add PostgreSQL official repo
if [ ! -f /etc/apt/sources.list.d/pgdg.list ]; then
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
fi

apt-get install -y -qq postgresql-16 postgresql-16-postgis-3 postgresql-16-pgvector

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql

log "PostgreSQL 16 installed"

# Create database and user
info "Setting up PostgreSQL database..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the database and enable extensions
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

log "PostgreSQL database '${DB_NAME}' ready"

# ══════════════════════════════════════════════════════════
# 7. Redis 7
# ══════════════════════════════════════════════════════════
info "Installing Redis..."
apt-get install -y -qq redis-server

# Configure Redis for production
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf 2>/dev/null || true
sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Bind to localhost only (security)
sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf

systemctl enable redis-server
systemctl restart redis-server

log "Redis $(redis-server --version | awk '{print $3}' | cut -d= -f2) installed"

# ══════════════════════════════════════════════════════════
# 8. MinIO
# ══════════════════════════════════════════════════════════
info "Installing MinIO..."

# Download MinIO binary
if [ ! -f /usr/local/bin/minio ]; then
  wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
  chmod +x /usr/local/bin/minio
  log "MinIO binary installed"
else
  warn "MinIO binary already exists, skipping download"
fi

# Download MinIO Client (mc)
if [ ! -f /usr/local/bin/mc ]; then
  wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
  chmod +x /usr/local/bin/mc
  log "MinIO Client (mc) installed"
else
  warn "MinIO Client (mc) already exists, skipping download"
fi

# Create MinIO data directory
mkdir -p "${MINIO_DATA_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${MINIO_DATA_DIR}"

# Create MinIO environment file
cat > /etc/default/minio <<EOF
# MinIO Configuration
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_VOLUMES="${MINIO_DATA_DIR}"
MINIO_OPTS="--address :9000 --console-address :9001"
EOF

chmod 600 /etc/default/minio

# Create MinIO systemd service
cat > /etc/systemd/system/minio.service <<'EOF'
[Unit]
Description=MinIO Object Storage
Documentation=https://min.io/docs
After=network-online.target
Wants=network-online.target

[Service]
User=laporin
Group=laporin
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
RestartSec=5
LimitNOFILE=65536
TasksMax=infinity
TimeoutStartSec=0
TimeoutStopSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable minio
systemctl start minio

log "MinIO installed and running on :9000 (API) / :9001 (Console)"

# ══════════════════════════════════════════════════════════
# 9. Firewall (UFW)
# ══════════════════════════════════════════════════════════
info "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
# Allow local ports to be accessed if sysadmin's Nginx is on another machine, 
# or adjust as needed. Assuming Nginx is on the same machine or handles firewall.
# ufw allow 3000
# ufw allow 4000
# ufw allow 9000
# ufw allow 9001
ufw --force enable

log "Firewall configured (SSH only by default)"

# ══════════════════════════════════════════════════════════
# 10. Save Credentials
# ══════════════════════════════════════════════════════════
CREDS_FILE="/home/${APP_USER}/.credentials"
cat > "${CREDS_FILE}" <<EOF
# ═══════════════════════════════════════════════════════
# Laporin VPS Credentials — KEEP THIS FILE SECURE!
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ═══════════════════════════════════════════════════════

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_CONSOLE=http://localhost:9001
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
EOF

chmod 600 "${CREDS_FILE}"
chown "${APP_USER}:${APP_USER}" "${CREDS_FILE}"

log "Credentials saved to ${CREDS_FILE}"

# ══════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Laporin VPS Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Services installed:"
echo "    • Node.js $(node -v)"
echo "    • pnpm $(pnpm -v)"
echo "    • PM2 $(pm2 -v)"
echo "    • PostgreSQL 16 + PostGIS + pgvector"
echo "    • Redis $(redis-server --version | awk '{print $3}' | cut -d= -f2)"
echo "    • MinIO (API :9000, Console :9001)"
echo ""
echo "  Credentials saved to: ${CREDS_FILE}"
echo ""
echo "  ⚡ Next steps:"
echo "    1. Setup MinIO bucket:  bash deploy/setup-minio.sh"
echo "    2. Clone your repo:     su - ${APP_USER} && git clone <repo> ${APP_DIR}"
echo "    3. Configure .env:      cp apps/api/.env.production.example apps/api/.env"
echo "    4. Deploy:              bash deploy/deploy.sh"
echo "    5. Note: Nginx and SSL are handled separately by sysadmin."
echo ""
echo "═══════════════════════════════════════════════════════"
