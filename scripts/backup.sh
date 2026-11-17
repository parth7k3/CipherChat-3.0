#!/bin/bash
set -euo pipefail

# CipherChat 3.0 Automated Backup Script
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"
echo "[CipherChat Backup] Starting backup at ${TIMESTAMP}..."

# 1. Backup PostgreSQL Database
echo "[CipherChat Backup] Dumping PostgreSQL database..."
docker exec cipherchat-postgres pg_dump -U "${POSTGRES_USER:-synapse_user}" -d synapse -F c -b -v -f /tmp/synapse_db.dump
docker cp cipherchat-postgres:/tmp/synapse_db.dump "${TARGET_DIR}/synapse_db.dump"
docker exec cipherchat-postgres rm /tmp/synapse_db.dump

# 2. Backup Synapse Signing Keys & Configs
echo "[CipherChat Backup] Archiving configuration and cryptographic signing keys..."
tar -czf "${TARGET_DIR}/synapse_config.tar.gz" ./docker/synapse/homeserver.yaml

# 3. Backup Media Store
echo "[CipherChat Backup] Archiving encrypted media store..."
if [ -d "./docker/synapse/data/media_store" ]; then
    tar -czf "${TARGET_DIR}/media_store.tar.gz" ./docker/synapse/data/media_store
fi

echo "[CipherChat Backup] Backup completed successfully: ${TARGET_DIR}"
