import { describe, it, expect } from 'vitest';
import { MediaEncryptionService } from '../src/services/matrix/mediaEncryption';

describe('Client-Side Media & Attachment Encryption (AES-CTR & SHA-256)', () => {
  it('encrypts a file and verifies ciphertext integrity roundtrip', async () => {
    const originalText = 'Top Secret Confidential Memorandum - CipherChat 3.0';
    const blob = new Blob([originalText], { type: 'text/plain' });
    const file = new File([blob], 'secret.txt', { type: 'text/plain' });

    // 1. Encrypt file client-side
    const { ciphertextBlob, encryptionInfo } = await MediaEncryptionService.encryptFile(file);

    expect(ciphertextBlob).toBeDefined();
    expect(encryptionInfo.v).toBe('v2');
    expect(encryptionInfo.key.alg).toBe('A256CTR');
    expect(encryptionInfo.hashes.sha256).toBeTypeOf('string');

    // Verify ciphertext is not plaintext
    const ciphertextBuffer = await ciphertextBlob.arrayBuffer();
    const decoder = new TextDecoder();
    const decodedCiphertext = decoder.decode(ciphertextBuffer);
    expect(decodedCiphertext).not.toContain(originalText);

    // 2. Decrypt ciphertext using encryption metadata
    const decryptedBuffer = await MediaEncryptionService.decryptAttachment(
      encryptionInfo,
      ciphertextBuffer
    );

    const decryptedText = decoder.decode(decryptedBuffer);
    expect(decryptedText).toBe(originalText);
  });

  it('detects tampering and throws integrity violation if ciphertext is altered', async () => {
    const originalText = 'Financial Transaction Data: $1,000,000';
    const blob = new Blob([originalText], { type: 'text/plain' });
    const file = new File([blob], 'ledger.txt', { type: 'text/plain' });

    const { ciphertextBlob, encryptionInfo } = await MediaEncryptionService.encryptFile(file);
    const ciphertextBuffer = await ciphertextBlob.arrayBuffer();

    // Tamper with the ciphertext by flipping one byte
    const tamperedBytes = new Uint8Array(ciphertextBuffer);
    tamperedBytes[0] = tamperedBytes[0] ^ 0xff;

    // Decryption must throw cryptographic integrity violation error
    await expect(
      MediaEncryptionService.decryptAttachment(encryptionInfo, tamperedBytes.buffer)
    ).rejects.toThrow(/Cryptographic integrity verification failed/);
  });
});
