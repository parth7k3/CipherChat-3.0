# CipherChat 3.0 — Device Verification & Trust Management

## 1. Overview

CipherChat 3.0 implements the Matrix Cross-Signing and Interactive Device Verification specifications to prevent Man-in-the-Middle (MITM) attacks and provide users with verifiable cryptographic trust indicators.

## 2. Cross-Signing Architecture

Cross-signing replaces the need to verify every individual device of a contact manually by creating a 3-tier hierarchy of Ed25519 digital signatures:

```
                  +---------------------------+
                  |     Master Key (MSK)      |
                  |  - Root identity key      |
                  |  - Stored in secure store |
                  +---------------------------+
                         /             \
       Signs User-Signing Key           Signs Self-Signing Key
                       /                 \
                      v                   v
+--------------------------+       +--------------------------+
|  User-Signing Key (USK)  |       |  Self-Signing Key (SSK)  |
|  - Signs other users'    |       |  - Signs your own new    |
|    Master Keys           |       |    devices after SAS     |
+--------------------------+       +--------------------------+
```

1. **Master Signing Key (MSK):** The root cryptographic identity for the user account.
2. **Self-Signing Key (SSK):** Authorized by the Master Key to sign new devices belonging to the same user.
3. **User-Signing Key (USK):** Authorized by the Master Key to sign the Master Keys of verified contacts.

## 3. Short Authentication String (SAS) Verification Flow

Interactive SAS verification operates over encrypted to-device events (`m.key.verification.*`):

1. **Request (`m.key.verification.request`):** Device A initiates verification with Device B.
2. **Ready (`m.key.verification.ready`):** Both devices agree on supported verification methods (`m.sas.v1`).
3. **Start (`m.key.verification.start`):** Ephemeral Curve25519 public keys are exchanged.
4. **Key Exchange (`m.key.verification.key`):** Both devices independently compute a shared secret using Diffie-Hellman and derive the Short Authentication String via HKDF.
5. **SAS Comparison (`m.key.verification.mac`):**
   * **Emoji Method:** 7 visual emojis with standard names (e.g. Dog, Airplane, Shield) are rendered on both screens.
   * **Decimal Method:** Three 4-digit numbers are rendered on both screens.
6. **User Confirmation:** If the emojis/numbers match, both users click "They Match". If they differ, the user clicks "They Do Not Match", which immediately cancels the transaction and flags the peer as untrusted.
7. **Done:** Once confirmed, Device A signs Device B's device key using its Self-Signing Key, updating its trust status to `verified`.
