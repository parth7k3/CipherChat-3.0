# CipherChat 3.0 — Testing & Quality Assurance Documentation

## 1. Test Suite Overview

CipherChat 3.0 employs Vitest for automated unit, cryptographic, and security testing.

Run all tests:
```bash
npm test
```

### 1.1 Test Execution Results (Nov 17, 2026)

```
 RUN  v5.1.0 X:/devansh

 ✓ tests/sanitizer.test.ts (3 tests) 3ms
 ✓ tests/cryptoUtils.test.ts (4 tests) 7ms
 ✓ tests/authService.test.ts (5 tests) 3ms
 ✓ tests/cryptoGuard.test.ts (3 tests) 4ms
 ✓ tests/mediaEncryption.test.ts (2 tests) 9ms

 Test Files  5 passed (5)
      Tests  17 passed (17)
   Start at  23:43:07
   Duration  2.73s
```

---

## 2. Test File Breakdown

| Test File | Target Module | Scope & Invariants Verified |
|---|---|---|
| `cryptoUtils.test.ts` | `src/utils/cryptoUtils.ts` | SHA-256 hash calculation, Base64 & Base64URL roundtrips, secure random entropy generation. |
| `sanitizer.test.ts` | `src/utils/sanitizer.ts` | Scrubbing sensitive authentication tokens (`syt_...`), passwords, and private keys from logs; HTML XSS character escaping. |
| `authService.test.ts` | `src/services/matrix/authService.ts` | Enforcing minimum 10 characters, uppercase, lowercase, numbers, and symbols in password complexity validation. |
| `cryptoGuard.test.ts` | `src/services/matrix/cryptoService.ts` | **Critical Security Invariant:** Throws unrecoverable error and blocks transmission if a room is encrypted but the crypto engine is unready; prevents accidental plaintext fallback. |
| `mediaEncryption.test.ts` | `src/services/matrix/mediaEncryption.ts` | Encrypting file to ciphertext, verifying ciphertext differs from plaintext, verifying SHA-256 digest, decrypting back to original plaintext. **Tamper Detection:** Proves that modifying 1 byte in ciphertext triggers cryptographic integrity violation error. |
