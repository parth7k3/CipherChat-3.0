# CipherChat 3.0 — System Architecture & Design Specification

## 1. System Overview

CipherChat 3.0 is a decentralized, end-to-end encrypted real-time communication platform engineered on the open Matrix Protocol standard (Client-Server API v3). The platform separates communication coordination, cryptographic state, media relay, and persistent storage into distinct, least-privilege security zones.

```
+-----------------------------------------------------------------------------------------+
|                                  CLIENT TIER (Browser)                                  |
|                                                                                         |
|  +--------------------+    +---------------------------+    +------------------------+  |
|  | React 18 UI        |<-->| Matrix JS SDK (v45)       |<-->| IndexedDB Crypto Store |  |
|  | - Tailwind Theme   |    | - Rust/WASM Crypto Engine |    | - Olm/Megolm sessions  |  |
|  | - Strict CSP       |    | - WebRTC Signaling Engine |    | - Cross-signing keys   |  |
|  +--------------------+    +---------------------------+    +------------------------+  |
+-----------------------------------------------------------------------------------------+
                                          |
                      TLS 1.3 / HTTPS / WSS Ingress
                                          v
+-----------------------------------------------------------------------------------------+
|                                    EDGE TIER                                            |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | Nginx Reverse Proxy & Ingress Guard                                               |  |
|  | - Strict CSP, HSTS, X-Frame-Options: DENY, Referrer-Policy                        |  |
|  | - Rate limiting (10 req/s, burst 20)                                               |  |
|  | - Upstream proxying to Synapse :8008 & Static Client Serving                      |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------------+
|                              HOMESERVER & MEDIA RELAY TIER                              |
|                                                                                         |
|  +-----------------------------------+         +-------------------------------------+  |
|  | Matrix Synapse Core               |         | Coturn STUN/TURN Service            |  |
|  | - Event Routing & Sync            |         | - UDP/TCP 3478, Relay Ports         |  |
|  | - Opaque Ciphertext Storage       |         | - Dynamic HMAC Shared Secret        |  |
|  | - Media Repository (Encrypted)    |         | - RFC 1918 Private IP Filtering     |  |
|  +-----------------------------------+         +-------------------------------------+  |
|                   |                                                                     |
|                   v (Internal Network Only)                                             |
|  +-----------------------------------+                                                  |
|  | PostgreSQL 16 Relational Store    |                                                  |
|  | - Non-root user: synapse_user     |                                                  |
|  | - Port 5432 Unexposed to Host     |                                                  |
|  +-----------------------------------+                                                  |
+-----------------------------------------------------------------------------------------+
```

## 2. Component Architecture

### 2.1 Frontend Client Tier
* **State & Sync Engine (`SyncService`):** Connects to Matrix homeserver `/sync` long-polling loop, dispatching state changes to the UI reactively.
* **Cryptographic Layer (`CryptoService`, `matrixClientManager`):** Manages identity keys, device keys, and Olm/Megolm sessions backed by browser `IndexedDB`.
* **Attachment Engine (`MediaEncryptionService`):** Performs in-browser symmetric encryption (AES-256-CTR) and SHA-256 integrity hash verification before uploading ciphertext to the media repo.
* **Real-Time Calling (`CallingService`):** Coordinates WebRTC `RTCPeerConnection` sessions over Matrix VoIP signaling (`m.call.invite`, `m.call.candidates`, `m.call.answer`, `m.call.hangup`).

### 2.2 Homeserver & Storage Tier
* **Matrix Synapse:** Responsible for user accounts, room membership, and event distribution. Synapse acts purely as a blind storage and relay mechanism for encrypted rooms.
* **PostgreSQL:** Persists account metadata, room hierarchies, and event graphs. All message payloads for encrypted rooms reside as encrypted ciphertext blocks (`m.room.encrypted`).
* **Coturn Media Relay:** Provides NAT traversal and media packet routing when direct P2P connections cannot be established.
