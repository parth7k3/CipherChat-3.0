# CipherChat 3.0 — Voice & Video Calling Security Design

## 1. WebRTC Architecture

CipherChat 3.0 integrates real-time peer-to-peer and relayed voice and video calling. Call signaling is fully integrated into the Matrix room event pipeline (`m.call.invite`, `m.call.candidates`, `m.call.answer`, `m.call.hangup`).

```
 Peer A (Caller)                                           Peer B (Callee)
 +--------------------+                                    +--------------------+
 | Matrix JS SDK      | === m.call.invite (SDP Offer) ===> | Matrix JS SDK      |
 |                    | <== m.call.answer (SDP Answer) === |                    |
 |                    | <== m.call.candidates (ICE) =====> |                    |
 +--------------------+                                    +--------------------+
          |                                                          |
          +----------------------------------------------------------+
                                       |
                   Encrypted Media Flow (DTLS 1.2 / SRTP)
                                       v
                     +-----------------------------------+
                     | Coturn STUN/TURN Media Relay      |
                     | - Dynamic HMAC credentials        |
                     | - Relayed when direct P2P fails   |
                     +-----------------------------------+
```

## 2. Media Transport Security

* **Key Exchange:** Datagram Transport Layer Security (DTLS) establishes symmetric keys directly between the communicating WebRTC endpoints.
* **Stream Encryption:** Secure Real-time Transport Protocol (SRTP) encrypts audio and video payloads using AES-128 or AES-256 with HMAC-SHA1 or AEAD ciphers.
* **NAT Traversal & IP Privacy:**
  * When peers communicate directly (P2P), their public IP addresses are visible to each other.
  * To protect client IP addresses, Coturn TURN server relaying can be enforced (`iceTransportPolicy: "relay"`), ensuring that media packets traverse only the hardened relay server.
  * Coturn access is authenticated via dynamic HMAC shared secrets with time-limited token validity (`turn_user_lifetime: "1h"`).
