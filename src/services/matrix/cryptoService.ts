import { matrixClientManager } from './matrixClient';
import { sanitizeLogOutput } from '../../utils/sanitizer';

export class CryptoService {
  /**
   * Asserts whether a given Matrix room has end-to-end encryption enabled.
   */
  public static isRoomEncrypted(roomId: string): boolean {
    const client = matrixClientManager.getClient();
    if (!client) return false;
    const room = client.getRoom(roomId);
    if (!room) return false;
    return client.isRoomEncrypted(roomId);
  }

  /**
   * Critical Security Guard: Verifies cryptographic prerequisites before sending any event.
   * STRICT ENFORCEMENT: Never allows silent fallback to unencrypted transmission if encryption is expected.
   */
  public static assertSafeMessageDispatch(roomId: string): void {
    const client = matrixClientManager.getClient();
    if (!client) {
      throw new Error('[Security Exception] Matrix client is not initialized.');
    }

    const isEncrypted = client.isRoomEncrypted(roomId);
    const isCryptoReady = matrixClientManager.getIsCryptoReady();

    if (isEncrypted && !isCryptoReady) {
      throw new Error(
        '[Security Exception] Room requires End-to-End Encryption, but the cryptographic engine is not ready. Message dispatch blocked to prevent plaintext leakage.'
      );
    }
  }

  /**
   * Initializes or bootstraps Cross-Signing (Master Key, Self-Signing Key, User-Signing Key).
   */
  public static async bootstrapCrossSigning(): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not ready');

    const crypto = client.getCrypto();
    if (!crypto) throw new Error('Crypto backend unavailable');

    console.info('[CipherChat Crypto] Bootstrapping Cross-Signing keys...');
    try {
      await crypto.bootstrapCrossSigning({
        authUploadDeviceSigningKeys: async (makeRequest) => {
          await makeRequest({});
        },
      });
      console.info('[CipherChat Crypto] Cross-Signing bootstrap completed successfully.');
    } catch (err) {
      console.error(sanitizeLogOutput(`[CipherChat Crypto] Cross-signing bootstrap failed: ${err}`));
      throw err;
    }
  }

  /**
   * Verifies an opponent user's device trust status.
   */
  public static async checkDeviceTrust(userId: string, deviceId: string): Promise<boolean> {
    const client = matrixClientManager.getClient();
    if (!client) return false;

    const crypto = client.getCrypto();
    if (!crypto) return false;

    try {
      const status = await crypto.getDeviceVerificationStatus(userId, deviceId);
      return status?.isVerified() ?? false;
    } catch {
      return false;
    }
  }
}
