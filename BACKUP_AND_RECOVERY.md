# CipherChat 3.0 — Backup & Disaster Recovery Runbook

## 1. Backup Strategy

CipherChat 3.0 data resides in three primary locations:
1. **PostgreSQL Database:** Accounts, room memberships, event graphs, and ciphertext events.
2. **Synapse Configuration & Signing Keys:** Server Ed25519 signing keys and TLS configs.
3. **Encrypted Media Store:** Ciphertext media blobs uploaded by users.

---

## 2. Automated Backup Execution

Run the provided backup script:
```bash
./scripts/backup.sh
```
This produces a timestamped archive under `./backups/YYYYMMDD_HHMMSS/` containing:
- `synapse_db.dump`: PostgreSQL binary custom dump (`pg_dump -F c`).
- `synapse_config.tar.gz`: Server keys and YAML configuration.
- `media_store.tar.gz`: Compressed ciphertext media files.

---

## 3. Disaster Recovery Execution

To restore a fresh host from an existing backup:

```bash
# Execute restore script pointing to target backup directory
./scripts/restore.sh ./backups/20261117_234500
```

The restore script:
1. Stops the Synapse homeserver process to avoid concurrent writes.
2. Drops and restores the `synapse` PostgreSQL database cleanly.
3. Unpacks the media store archive into `./docker/synapse/data/media_store`.
4. Restarts Synapse and performs health verification.
