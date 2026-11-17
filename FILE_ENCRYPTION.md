# CipherChat 3.0 — Client-Side Encrypted File & Media Sharing

## 1. Security Architecture

All file attachments (images, videos, audio, PDF documents, archives) are encrypted client-side in the sender's browser before transmission to the Matrix media repository. The homeserver receives only opaque binary ciphertext.

```
 Sender Client                                              Matrix Media Store
 +------------------------+                                 +------------------+
 | 1. Plaintext File      |                                 |                  |
 |    (e.g., photo.png)   |                                 |                  |
 | 2. Generate 256-bit    |                                 |                  |
 |    AES Key & 16-byte IV|                                 |                  |
 | 3. Encrypt (AES-CTR)   |                                 |                  |
 |    -> Ciphertext Blob  |                                 |                  |
 | 4. Compute SHA-256     |                                 |                  |
 |    over Ciphertext     |                                 |                  |
 | 5. Upload Ciphertext   | === POST /_matrix/media/v3 ===> | Stores opaque    |
 |    Blob to Media Store |     (Type: application/octet)   | encrypted binary |
 +------------------------+                                 +------------------+
             |                                                        ^
             v Encrypted Room Event (m.room.message)                  |
 +--------------------------------------------------------+           |
 | {                                                      |           |
 |   "msgtype": "m.image",                                |           |
 |   "file": {                                            |           |
 |     "url": "mxc://homeserver/media_id", ---------------+           |
 |     "key": { "alg": "A256CTR", "k": "<b64url_key>" },  |           |
 |     "iv": "<b64_iv>",                                  |           |
 |     "hashes": { "sha256": "<b64_sha256>" }             |           |
 |   }                                                    |           |
 | }                                                      |           |
 +--------------------------------------------------------+           |
             |                                                        |
             v Megolm Decrypted on Recipient Device                   |
 Recipient Client                                                     |
 +--------------------------------------------------------+           |
 | 1. Download Ciphertext Binary -------------------------+-----------+
 | 2. Calculate SHA-256 Hash of downloaded bytes                      |
 |    - Compare against file.hashes.sha256                            |
 |    - If mismatch: ABORT (Tamper detection!)                        |
 | 3. Decrypt with AES-CTR using decrypted key & IV                   |
 | 4. Create ephemeral Object URL (blob:...) for local display/save   |
 +--------------------------------------------------------------------+
```

## 2. Cryptographic Specifications

* **Algorithm:** AES-CTR (Counter Mode) with 256-bit symmetric keys.
* **Integrity Validation:** SHA-256 checksum over the raw ciphertext. Tampering with any byte causes decryption to abort immediately.
* **Privacy Controls:** Filenames are omitted from the upload header so the media server operator cannot observe the original file name from HTTP logs.
