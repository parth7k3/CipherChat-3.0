# CipherChat 3.0

**Enterprise-Grade, Privacy-Centric, End-to-End Encrypted Real-Time Communication Platform**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-17%20passed-success.svg)]()
[![Security Audit](https://img.shields.io/badge/security%20audit-0%20vulnerabilities-emerald.svg)]()
[![Matrix Spec](https://img.shields.io/badge/Matrix%20Spec-v1.11-blue.svg)]()

CipherChat 3.0 is a modern, self-hosted, end-to-end encrypted communication platform built on the open standard **Matrix Protocol** (`matrix-js-sdk` v45 with Rust/WASM Olm/Megolm cryptographic engine). It combines strong cryptographic guarantees with real-time text messaging, encrypted file transfers, WebRTC voice/video calls, device verification (SAS/Cross-Signing), and hardened containerized infrastructure.

---

## Key Capabilities

1. **End-to-End Encrypted Messaging (Olm & Megolm):**
   - Pairwise 1:1 encryption using Olm (Double Ratchet + Curve25519).
   - Multi-party group encryption using Megolm (`m.megolm.v1.aes-sha2`).
   - Zero plaintext stored on homeserver; messages stored as opaque ciphertext payloads.
   - Accidental plaintext fallback prevention guard (`CryptoService.assertSafeMessageDispatch`).
2. **Device Verification & Trust Management:**
   - Interactive Short Authentication String (SAS) emoji & decimal comparison.
   - Cryptographic Cross-Signing (Master, Self-Signing, and User-Signing keys).
   - Dedicated Security & Devices dashboard with one-click remote session revocation.
3. **Client-Side Encrypted File Sharing:**
   - In-browser AES-CTR/GCM 256-bit encryption before upload.
   - SHA-256 integrity hash verification prevents tampering.
   - Ephemeral object URL lifecycle prevents memory leakage and XSS.
4. **Real-Time VoIP Voice & Video Calling:**
   - WebRTC audio/video calling signaled over encrypted Matrix call events.
   - Media controls: mute, camera toggle, screen sharing (`getDisplayMedia`).
   - Coturn STUN/TURN integration for NAT traversal with dynamic HMAC shared secrets.
5. **Hardened Multi-Service Infrastructure:**
   - Docker Compose stack: Matrix Synapse, PostgreSQL 16, Coturn, Nginx edge ingress.
   - Modern TLS 1.3/1.2, HSTS preloading, strict Content Security Policy (CSP).
   - Automated disaster recovery and backup scripts (`scripts/backup.sh`, `scripts/restore.sh`).

---

## Architecture Overview

```
 [ React 18 + TS Client ] <---> [ WebRTC Media Stream ] <---> [ Coturn STUN/TURN ]
           |                                                        |
           v (TLS 1.3 / WSS)                                        |
  [ Nginx Reverse Proxy ]                                           |
           |                                                        |
           v                                                        |
 [ Matrix Synapse Homeserver ] <------------------------------------+
           |
           v
 [ PostgreSQL 16 DB (Isolated) ]
```

---

## Quick Start (Development)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Run Automated Cryptographic & Unit Tests
```bash
npm test
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## Production Deployment (Docker Compose)

### 1. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your production secrets
```

### 2. Launch Services
```bash
docker compose up -d
```

The application will be served at `http://localhost` (or configured domain), proxying client requests to Synapse and media streams through Coturn.

---

## Documentation

- [Project Audit](PROJECT_AUDIT.md)
- [Feature Completion Matrix](FEATURE_COMPLETION.md)
- [Security & Cryptographic Audit](SECURITY_AUDIT.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [System Architecture](ARCHITECTURE.md)
- [Encryption Architecture](ENCRYPTION_ARCHITECTURE.md)
- [Device Verification Guide](DEVICE_VERIFICATION.md)
- [File Encryption Specification](FILE_ENCRYPTION.md)
- [Voice & Video Security](VOICE_VIDEO_SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Backup & Disaster Recovery](BACKUP_AND_RECOVERY.md)
- [Testing & Quality Assurance](TESTING.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Changelog](CHANGELOG.md)
