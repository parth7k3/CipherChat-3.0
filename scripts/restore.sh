#!/bin/bash
set -euo pipefail

# CipherChat 3.0 Automated Disaster Recovery Script
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <path_to_backup_directory>"
    exit 1
fi

RESTORE_SRC="$1"
echo "[CipherChat Restore] Initiating disaster recovery from ${RESTORE_SRC}..."

if [ ! -f "${RESTORE_SRC}/synapse_db.dump" ]; then
    echo "Error: Database dump missing in ${RESTORE_SRC}"
    exit 1
fi

# 1. Stop Synapse to avoid write conflicts
echo "[CipherChat Restore] Halting Synapse service..."
docker stop cipherchat-synapse || true

# 2. Restore PostgreSQL Database
echo "[CipherChat Restore] Restoring PostgreSQL database..."
docker cp "${RESTORE_SRC}/synapse_db.dump" cipherchat-postgres:/tmp/synapse_db.dump
docker exec cipherchat-postgres pg_restore -U "${POSTGRES_USER:-synapse_user}" -d synapse -c -v /tmp/synapse_db.dump || true
docker exec cipherchat-postgres rm /tmp/synapse_db.dump

# 3. Restore Media Store
if [ -f "${RESTORE_SRC}/media_store.tar.gz" ]; then
    echo "[CipherChat Restore] Restoring media store..."
    tar -xzf "${RESTORE_SRC}/media_store.tar.gz" -C ./docker/synapse/data/
fi

# 4. Restart Services
echo "[CipherChat Restore] Restarting Synapse service..."
docker start cipherchat-synapse

echo "[CipherChat Restore] Disaster recovery completed successfully."
