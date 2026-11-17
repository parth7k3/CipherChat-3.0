# CipherChat 3.0 — API & Protocol Documentation

CipherChat 3.0 adheres to the Matrix Client-Server API specification (v3 / v1.11).

## 1. Authentication Endpoints

### 1.1 Password Login
* **Endpoint:** `POST /_matrix/client/v3/login`
* **Request:**
  ```json
  {
    "type": "m.login.password",
    "user": "alice",
    "password": "Password123!",
    "initial_device_display_name": "CipherChat Web"
  }
  ```
* **Response:**
  ```json
  {
    "user_id": "@alice:cipherchat.local",
    "access_token": "syt_...",
    "device_id": "ABCDEFGHIJ",
    "home_server": "cipherchat.local"
  }
  ```

### 1.2 User Registration
* **Endpoint:** `POST /_matrix/client/v3/register`
* **Request:**
  ```json
  {
    "username": "alice",
    "password": "Password123!",
    "auth": { "type": "m.login.dummy" }
  }
  ```

### 1.3 Logout & Session Revocation
* **Endpoint:** `POST /_matrix/client/v3/logout`
* **Header:** `Authorization: Bearer <access_token>`

---

## 2. Cryptographic Endpoints

### 2.1 Upload Device Keys
* **Endpoint:** `POST /_matrix/client/v3/keys/upload`
* **Description:** Publishes Curve25519 identity key, Ed25519 signing key, and one-time prekeys (OTKs).

### 2.2 Query Device Keys
* **Endpoint:** `POST /_matrix/client/v3/keys/query`
* **Description:** Fetches device public keys and cross-signing signatures for specified user IDs.

### 2.3 Send To-Device Event
* **Endpoint:** `PUT /_matrix/client/v3/sendToDevice/{eventType}/{txnId}`
* **Description:** Dispatches pairwise encrypted Olm events (`m.room_key` or `m.key.verification.*`) directly to a specific device.

---

## 3. Room & Messaging Endpoints

### 3.1 Send Event
* **Endpoint:** `PUT /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}`
* **Encrypted Event Type:** `m.room.encrypted`
* **Plaintext Message Type:** `m.room.message`

### 3.2 Redact Event
* **Endpoint:** `PUT /_matrix/client/v3/rooms/{roomId}/redact/{eventId}/{txnId}`
* **Description:** Removes an event from the room timeline.

---

## 4. Media Endpoints

### 4.1 Encrypted Media Upload
* **Endpoint:** `POST /_matrix/media/v3/upload`
* **Header:** `Content-Type: application/octet-stream`
* **Body:** Raw binary ciphertext
* **Response:** `{ "content_uri": "mxc://homeserver/mediaId" }`

### 4.2 Media Download
* **Endpoint:** `GET /_matrix/media/v3/download/{serverName}/{mediaId}`
* **Response:** Raw binary ciphertext stream
