# CipherChat 3.0 — Database Architecture & Security

## 1. Relational Database (PostgreSQL 16)

CipherChat 3.0 utilizes PostgreSQL 16 as the persistent backing store for Matrix Synapse.

### 1.1 Connection & Isolation
* **Network Isolation:** PostgreSQL is bound strictly to the internal Docker bridge network (`cipherchat-internal`). Port `5432` is not exposed to the public host interface.
* **Least Privilege Account:** Synapse connects as unprivileged user `synapse_user` with restricted grants only on the `synapse` database schema.
* **Encoding & Collation:** Database initialized with UTF-8 encoding (`--encoding=UTF-8 --lc-collate=C --lc-ctype=C`).

## 2. Event Storage & Ciphertext Handling

In Matrix, room messages are stored in the `events` and `event_json` tables:
* In encrypted rooms (`m.room.encryption`), the `event_json` column stores the event with `type: "m.room.encrypted"`.
* The `content` column contains only the ciphertext:
  ```json
  {
    "algorithm": "m.megolm.v1.aes-sha2",
    "ciphertext": "AwgAEk...",
    "sender_key": "...",
    "session_id": "...",
    "device_id": "..."
  }
  ```
* The plaintext message body never enters the PostgreSQL database. Database administrators or storage snapshot inspectors cannot read conversation contents.

## 3. Client Storage (IndexedDB)

Client-side cryptographic identity and session state are persisted using browser `IndexedDB`:
* **IndexedDBCryptoStore:** Stores Megolm inbound/outbound session ratchet states, device signing keys, and room keys.
* **IndexedDBStore:** Stores room metadata, member presence, and timeline pagination caches.
