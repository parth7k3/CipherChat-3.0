import * as matrixcs from 'matrix-js-sdk';
import { sanitizeLogOutput } from '../../utils/sanitizer';
import type { TrustStatus, UserDevice } from '../../types';

export interface MatrixClientConfig {
  baseUrl: string;
  userId: string;
  accessToken: string;
  deviceId: string;
}

class MatrixClientManager {
  private static instance: MatrixClientManager;
  private client: matrixcs.MatrixClient | null = null;
  private isCryptoInitialized = false;

  private constructor() {}

  public static getInstance(): MatrixClientManager {
    if (!MatrixClientManager.instance) {
      MatrixClientManager.instance = new MatrixClientManager();
    }
    return MatrixClientManager.instance;
  }

  public getClient(): matrixcs.MatrixClient | null {
    return this.client;
  }

  public async initialize(config: MatrixClientConfig): Promise<matrixcs.MatrixClient> {
    if (this.client) {
      this.client.stopClient();
      this.client = null;
      this.isCryptoInitialized = false;
    }

    console.info(`[CipherChat] Initializing Matrix client for ${config.userId} (device: ${config.deviceId})`);

    // Create client instance using matrix-js-sdk
    this.client = matrixcs.createClient({
      baseUrl: config.baseUrl,
      userId: config.userId,
      accessToken: config.accessToken,
      deviceId: config.deviceId,
      timelineSupport: true,
    });

    try {
      // Initialize cryptographic engine (Matrix Rust/WASM crypto with Olm/Megolm)
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        console.info('[CipherChat] Initializing E2EE cryptographic engine with IndexedDB...');
        await this.client.initRustCrypto();
        this.isCryptoInitialized = true;
        console.info('[CipherChat] E2EE cryptographic engine initialized successfully.');
      }
    } catch (err) {
      console.error('[CipherChat] Failed to initialize cryptographic engine:', err);
      throw new Error(`Cryptographic initialization failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Start client synchronization pipeline
    await this.client.startClient({ initialSyncLimit: 20 });
    console.info('[CipherChat] Matrix sync pipeline started.');

    return this.client;
  }

  public getIsCryptoReady(): boolean {
    return this.isCryptoInitialized;
  }

  public async stop(): Promise<void> {
    if (this.client) {
      console.info('[CipherChat] Stopping Matrix client sync...');
      this.client.stopClient();
      this.client = null;
      this.isCryptoInitialized = false;
    }
  }

  /**
   * Retrieves all registered devices for the current user and their verification status.
   */
  public async getUserDevices(): Promise<UserDevice[]> {
    if (!this.client) return [];
    try {
      const response = await this.client.getDevices();
      const crypto = this.client.getCrypto();

      const devices: UserDevice[] = await Promise.all(
        response.devices.map(async (dev) => {
          let trustStatus: TrustStatus = 'unverified';
          if (crypto && dev.device_id) {
            try {
              const deviceTrust = await crypto.getDeviceVerificationStatus(
                this.client!.getUserId()!,
                dev.device_id
              );
              if (deviceTrust?.isVerified()) {
                trustStatus = 'verified';
              }
            } catch {
              trustStatus = 'unverified';
            }
          }

          return {
            deviceId: dev.device_id,
            displayName: dev.display_name || dev.device_id,
            lastSeenIp: dev.last_seen_ip,
            lastSeenTs: dev.last_seen_ts,
            trustStatus,
            algorithms: [],
            keys: {},
          };
        })
      );
      return devices;
    } catch (err) {
      console.error(sanitizeLogOutput(`[CipherChat] Error fetching devices: ${err}`));
      return [];
    }
  }

  /**
   * Revokes a specific device session from the homeserver.
   */
  public async revokeDevice(deviceId: string): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');
    await this.client.deleteDevice(deviceId);
    console.info(`[CipherChat] Successfully revoked device: ${deviceId}`);
  }
}

export const matrixClientManager = MatrixClientManager.getInstance();
