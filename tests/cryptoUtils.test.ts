import { describe, it, expect } from 'vitest';
import {
  calculateSha256,
  calculateSha256Base64,
  generateSecureRandomBytes,
  encodeBase64,
  decodeBase64,
  encodeBase64Url,
  decodeBase64Url,
} from '../src/utils/cryptoUtils';

describe('Cryptographic Helper Utilities (cryptoUtils)', () => {
  it('generates secure random bytes of specified length', () => {
    const bytes1 = generateSecureRandomBytes(32);
    const bytes2 = generateSecureRandomBytes(32);

    expect(bytes1.byteLength).toBe(32);
    expect(bytes2.byteLength).toBe(32);
    // Non-zero and distinct entropy
    expect(bytes1).not.toEqual(bytes2);
  });

  it('correctly calculates SHA-256 hash in hex format', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('CipherChat-3.0-Secure-E2EE');
    const hashHex = await calculateSha256(data.buffer);

    expect(hashHex).toBeTypeOf('string');
    expect(hashHex.length).toBe(64); // 256 bits = 64 hex chars
  });

  it('correctly encodes and decodes Base64 data with roundtrip parity', () => {
    const originalText = 'Hello CipherChat E2EE World!';
    const encoder = new TextEncoder();
    const originalBuffer = encoder.encode(originalText).buffer;

    const base64 = encodeBase64(originalBuffer);
    expect(base64).toBeTypeOf('string');

    const decodedBuffer = decodeBase64(base64);
    const decoder = new TextDecoder();
    const decodedText = decoder.decode(decodedBuffer);

    expect(decodedText).toBe(originalText);
  });

  it('correctly encodes and decodes Base64Url data removing +, /, and =', () => {
    const sample = new Uint8Array([251, 255, 254, 0, 1, 2]);
    const base64Url = encodeBase64Url(sample.buffer);

    expect(base64Url).not.toContain('+');
    expect(base64Url).not.toContain('/');
    expect(base64Url).not.toContain('=');

    const decoded = new Uint8Array(decodeBase64Url(base64Url));
    expect(decoded).toEqual(sample);
  });
});
