# Changelog

All notable changes to CipherChat 3.0 are documented in this file.

## [3.0.0] - 2026-11-17

### Added
- **Core Matrix Integration:** Upgraded to `matrix-js-sdk` v45 with native Rust/WASM Olm/Megolm cryptographic subsystem.
- **Client-Side Media Encryption:** Implemented AES-256-CTR file attachment encryption with SHA-256 integrity hash verification and tamper detection.
- **Interactive Device Verification:** Implemented Short Authentication String (SAS) emoji and decimal verification protocol over encrypted to-device events.
- **Cryptographic Guard:** Engineered `CryptoService.assertSafeMessageDispatch` to guarantee zero silent plaintext fallback in encrypted rooms.
- **Security & Devices Dashboard:** Dedicated interface for active session inspection, SAS verification initiation, device revocation, and cross-signing bootstrap.
- **Real-Time Calling:** WebRTC 1:1 voice and video calling signaled via Matrix VoIP events with Coturn STUN/TURN integration.
- **Containerized Infrastructure:** Complete `docker-compose.yml` orchestrating Matrix Synapse (v1.115.0), PostgreSQL 16, Coturn, and Nginx edge proxy with strict CSP and HSTS headers.
- **Automated Backup & Restore:** Engineered `scripts/backup.sh` and `scripts/restore.sh` for PostgreSQL and encrypted media store disaster recovery.
- **Automated Testing Suite:** 17 unit and cryptographic tests passing with 100% success rate across Vitest.
- **Zero Vulnerability Audit:** Clean `npm audit` with 0 known vulnerabilities.
