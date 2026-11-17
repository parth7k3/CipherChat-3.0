# CipherChat 3.0 — End-to-End Encryption (E2EE) Architecture

## 1. Cryptographic Principles

1. **Standard Protocols Only:** CipherChat 3.0 never implements custom ciphers, hashing algorithms, or proprietary key agreements. It strictly uses the open Matrix cryptographic specification (Olm, Megolm, and Ed25519 digital signatures).
2. **Zero Plaintext on Server:** Plaintext message bodies and unencrypted file attachments never leave the user's client device.
3. **Fail-Safe Message Dispatch:** The application includes a hard assertion (`CryptoService.assertSafeMessageDispatch`) that blocks event transmission if encryption fails or if the room is encrypted while the crypto engine is unready. Accidental plaintext fallback is mathematically and architecturally prohibited.
4. **Forward Secrecy & Break-in Recovery:** The Megolm ratchet advances with every message. When a room member is removed or leaves, the outbound session is immediately rotated so the former member cannot decrypt future events.

## 2. Olm Protocol (Pairwise E2EE)

* **Key Exchange:** Triple Diffie-Hellman (3DH) over Curve25519.
* **Ratchet:** Double Ratchet combining symmetric ratchet (HKDF-SHA256) and asymmetric DH ratchet.
* **Payload Encryption:** AES-256-CBC with PKCS#7 padding and HMAC-SHA-256 message authentication.
* **Use Case:** Direct pairwise communication between individual devices, including the initial distribution of Megolm room session keys (`m.room_key` to-device events).

## 3. Megolm Protocol (Multi-Party Group Ratchet)

* **Key Ratchet:** Symmetric key derivation chain based on HKDF-SHA256.
* **Payload Encryption:** AES-256-CTR with HMAC-SHA-256.
* **Session Lifecycle:**
  * Outbound sessions are initialized per device per room.
  * Session keys are sent individually to all verified member devices using Olm.
  * Outbound sessions are automatically rotated after 100 messages or 1 week, or immediately upon room membership changes (member departure / ban).

## 4. Key Storage Security

Private cryptographic keys are never written to unencrypted `localStorage`. CipherChat 3.0 stores all long-term identity keys, one-time prekeys, and Megolm session states in an isolated browser `IndexedDBCryptoStore` managed by Matrix's Rust/WASM crypto subsystem.
