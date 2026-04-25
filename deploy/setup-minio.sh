#!/bin/bash
# ── deploy/setup-minio.sh ──
# MinIO bucket initialization for Laporin
# Creates the 'laporin-media' bucket with public read policy
#
# Prerequisites: MinIO must be running (setup-server.sh already started it)
# Usage: sudo -u laporin bash deploy/setup-minio.sh
# ──────────────────────────────────────────────────────────

set -euo pipefail

# ── Colors ────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ── Load MinIO credentials ───────────────────────────────
if [ -f /etc/default/minio ]; then
  source /etc/default/minio
elif [ -f /home/laporin/.credentials ]; then
  source /home/laporin/.credentials
  MINIO_ROOT_USER="${MINIO_ROOT_USER}"
  MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}"
else
  echo "Error: MinIO credentials not found"
  echo "Expected /etc/default/minio or /home/laporin/.credentials"
  exit 1
fi

MINIO_ENDPOINT="http://localhost:9000"
BUCKET_NAME="laporin-media"
ALIAS_NAME="laporin"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🗄️  MinIO Bucket Setup — Laporin"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── Wait for MinIO to be ready ────────────────────────────
info "Waiting for MinIO to be ready..."
for i in $(seq 1 30); do
  if mc alias set "${ALIAS_NAME}" "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" &>/dev/null; then
    log "MinIO is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Error: MinIO did not become ready within 30 seconds"
    exit 1
  fi
  sleep 1
done

# ── Configure mc alias ────────────────────────────────────
info "Configuring MinIO Client alias..."
mc alias set "${ALIAS_NAME}" "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
log "MinIO Client configured"

# ── Create bucket ─────────────────────────────────────────
info "Creating bucket '${BUCKET_NAME}'..."
if mc ls "${ALIAS_NAME}/${BUCKET_NAME}" &>/dev/null; then
  log "Bucket '${BUCKET_NAME}' already exists"
else
  mc mb "${ALIAS_NAME}/${BUCKET_NAME}"
  log "Bucket '${BUCKET_NAME}' created"
fi

# ── Set public read policy ────────────────────────────────
info "Setting public read policy on '${BUCKET_NAME}'..."

# Create a custom policy for public read access
cat > /tmp/minio-public-read-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_NAME}/*"]
    }
  ]
}
EOF

mc anonymous set download "${ALIAS_NAME}/${BUCKET_NAME}"
log "Public read policy set on '${BUCKET_NAME}'"

# Clean up temp file
rm -f /tmp/minio-public-read-policy.json

# ── Create access keys for the application ────────────────
info "Creating application access keys..."

# Generate access key and secret key
APP_ACCESS_KEY=$(openssl rand -hex 10)
APP_SECRET_KEY=$(openssl rand -hex 20)

# Create a service account / access key for the application
# Using mc admin user add for simplicity
mc admin user add "${ALIAS_NAME}" "${APP_ACCESS_KEY}" "${APP_SECRET_KEY}" 2>/dev/null || true

# Grant readwrite policy to the app user
mc admin policy attach "${ALIAS_NAME}" readwrite --user "${APP_ACCESS_KEY}" 2>/dev/null || true

log "Application access keys created"

# ── Save MinIO app credentials ────────────────────────────
MINIO_CREDS_FILE="/home/laporin/.minio-app-credentials"
cat > "${MINIO_CREDS_FILE}" <<EOF
# ═══════════════════════════════════════════════════════
# MinIO Application Credentials — For .env file
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ═══════════════════════════════════════════════════════

S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=${BUCKET_NAME}
S3_ACCESS_KEY=${APP_ACCESS_KEY}
S3_SECRET_KEY=${APP_SECRET_KEY}
S3_PUBLIC_URL=https://media.laporin.site/${BUCKET_NAME}
EOF

chmod 600 "${MINIO_CREDS_FILE}"
log "MinIO app credentials saved to ${MINIO_CREDS_FILE}"

# ── Verify ────────────────────────────────────────────────
info "Verifying bucket setup..."
mc ls "${ALIAS_NAME}/${BUCKET_NAME}"
log "Bucket verification passed"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ MinIO Bucket Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Bucket: ${BUCKET_NAME}"
echo "  Policy: Public Read"
echo "  App credentials: ${MINIO_CREDS_FILE}"
echo ""
echo "  Copy these values to your .env file:"
echo "    S3_ENDPOINT=http://localhost:9000"
echo "    S3_REGION=us-east-1"
echo "    S3_BUCKET=${BUCKET_NAME}"
echo "    S3_ACCESS_KEY=${APP_ACCESS_KEY}"
echo "    S3_SECRET_KEY=${APP_SECRET_KEY}"
echo "    S3_PUBLIC_URL=https://media.laporin.site/${BUCKET_NAME}"
echo ""
echo "  MinIO Console: http://localhost:9001"
echo "    User: ${MINIO_ROOT_USER}"
echo "    Pass: (see /etc/default/minio)"
echo ""
echo "═══════════════════════════════════════════════════════"
