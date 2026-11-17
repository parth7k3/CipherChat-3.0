import { matrixClientManager } from './matrixClient';
import { calculateSha256Base64, encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url } from '../../utils/cryptoUtils';
import type { EncryptedAttachmentMetadata } from '../../types';

export class MediaEncryptionService {
  /**
   * Encrypts a local file before transmission using AES-CTR (Matrix attachment spec v2).
   */
  public static async encryptFile(file: File): Promise<{
    ciphertextBlob: Blob;
    encryptionInfo: EncryptedAttachmentMetadata['encryption'];
  }> {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Generate 256-bit AES key
    const rawKey = new Uint8Array(32);
    crypto.getRandomValues(rawKey);

    // 2. Generate 16-byte IV (initial counter)
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    // Ensure counter bits are cleared to avoid overflow in CTR mode
    iv[8] = 0;
    iv[9] = 0;
    iv[10] = 0;
    iv[11] = 0;
    iv[12] = 0;
    iv[13] = 0;
    iv[14] = 0;
    iv[15] = 0;

    // 3. Import key into Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-CTR' },
      false,
      ['encrypt']
    );

    // 4. Encrypt the file data
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-CTR',
        counter: iv,
        length: 64,
      },
      cryptoKey,
      arrayBuffer
    );

    // 5. Calculate SHA-256 hash of the ciphertext for integrity verification
    const sha256Hash = await calculateSha256Base64(ciphertextBuffer);

    // 6. Build Matrix-compliant encryption metadata
    const encryptionInfo: EncryptedAttachmentMetadata['encryption'] = {
      v: 'v2',
      key: {
        alg: 'A256CTR',
        ext: true,
        k: encodeBase64Url(rawKey.buffer),
        key_ops: ['encrypt', 'decrypt'],
        kty: 'oct',
      },
      iv: encodeBase64(iv.buffer),
      hashes: {
        sha256: sha256Hash,
      },
    };

    const ciphertextBlob = new Blob([ciphertextBuffer], { type: 'application/octet-stream' });

    return {
      ciphertextBlob,
      encryptionInfo,
    };
  }

  /**
   * Uploads an encrypted file to Matrix Media Repository and sends the encrypted attachment message.
   */
  public static async uploadAndSendEncryptedFile(
    roomId: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');

    // Encrypt file client-side
    const { ciphertextBlob, encryptionInfo } = await this.encryptFile(file);

    // Upload ciphertext
    onProgress?.(30);
    const uploadResponse = await client.uploadContent(ciphertextBlob, {
      type: 'application/octet-stream',
      includeFilename: false, // Privacy: do not leak plaintext filename to media server
    });

    onProgress?.(80);

    const mxcUrl = uploadResponse.content_uri;
    const msgtype = file.type.startsWith('image/')
      ? 'm.image'
      : file.type.startsWith('video/')
      ? 'm.video'
      : file.type.startsWith('audio/')
      ? 'm.audio'
      : 'm.file';

    // Construct Matrix encrypted attachment event
    const content = {
      body: file.name,
      msgtype,
      file: {
        url: mxcUrl,
        mimetype: file.type,
        ...encryptionInfo,
      },
      info: {
        size: file.size,
        mimetype: file.type,
      },
    };

    await client.sendMessage(roomId, content as any);
    onProgress?.(100);
  }

  /**
   * Downloads and decrypts an encrypted attachment, verifying its SHA-256 integrity hash.
   */
  public static async decryptAttachment(
    fileMetadata: EncryptedAttachmentMetadata['encryption'],
    ciphertextBuffer: ArrayBuffer
  ): Promise<ArrayBuffer> {
    // 1. Verify SHA-256 integrity of the ciphertext
    const computedHash = await calculateSha256Base64(ciphertextBuffer);
    if (computedHash !== fileMetadata.hashes.sha256) {
      throw new Error(
        `[Security Violation] Cryptographic integrity verification failed! Expected SHA-256: ${fileMetadata.hashes.sha256}, but computed: ${computedHash}. Attachment may have been tampered with.`
      );
    }

    // 2. Decode key and IV
    const rawKey = decodeBase64Url(fileMetadata.key.k);
    const rawIv = new Uint8Array(decodeBase64(fileMetadata.iv));

    // 3. Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-CTR' },
      false,
      ['decrypt']
    );

    // 4. Decrypt
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-CTR',
        counter: rawIv,
        length: 64,
      },
      cryptoKey,
      ciphertextBuffer
    );

    return plaintextBuffer;
  }
}
