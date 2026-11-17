# CipherChat 3.0 — Production Deployment Guide

## 1. System Requirements

* **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 recommended) or Windows Server with Docker Desktop.
* **Hardware:** Minimum 2 vCPUs, 4 GB RAM, 20 GB SSD storage.
* **Network:** Ports 80 (HTTP) and 443 (HTTPS) open; UDP ports 3478 and 49152-49172 open for WebRTC Coturn relay.

---

## 2. Step-by-Step Deployment

### Step 1: Clone the Repository
```bash
git clone https://github.com/parth7k3/CipherChat-3.0.git
cd CipherChat-3.0
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Generate strong random strings for all secrets:
```bash
# Generate 32-byte hex secrets
openssl rand -hex 32
```
Update `.env` with the generated values for:
- `POSTGRES_PASSWORD`
- `SYNAPSE_REGISTRATION_SHARED_SECRET`
- `COTURN_SHARED_SECRET`

### Step 3: Build Frontend Bundle
```bash
npm install
npm run build
```
This generates the optimized production bundle inside `dist/` with the WebAssembly cryptographic engine.

### Step 4: Launch Docker Services
```bash
docker compose up -d
```

### Step 5: Verify Container Health
```bash
docker compose ps
```
All four services (`cipherchat-postgres`, `cipherchat-synapse`, `cipherchat-coturn`, `cipherchat-nginx`) should show `healthy` or `running`.

---

## 3. Creating an Initial Admin User
```bash
docker exec -it cipherchat-synapse register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008 -a
```
Follow the interactive prompt to set admin username and password.
