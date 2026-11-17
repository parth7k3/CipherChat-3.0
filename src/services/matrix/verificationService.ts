import { matrixClientManager } from './matrixClient';
import type { VerificationRequestState } from '../../types';

export type VerificationListener = (state: VerificationRequestState | null) => void;

export class VerificationService {
  private static listeners: Set<VerificationListener> = new Set();
  private static activeRequest: any = null;
  private static activeVerifier: any = null;

  public static subscribe(listener: VerificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(state: VerificationRequestState | null) {
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  /**
   * Initiates an interactive device verification request to another user/device.
   */
  public static async requestVerification(userId: string, deviceId: string): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not ready');

    const crypto = client.getCrypto();
    if (!crypto) throw new Error('Crypto engine unavailable');

    console.info(`[CipherChat Verification] Requesting verification with ${userId} (${deviceId})`);
    const request = await crypto.requestDeviceVerification(userId, deviceId);
    this.attachRequestListeners(request);
  }

  /**
   * Accepts an incoming verification request.
   */
  public static async acceptVerification(): Promise<void> {
    if (!this.activeRequest) return;
    await this.activeRequest.accept();
  }

  /**
   * Starts SAS verification once request is in ready state.
   */
  public static async startSAS(): Promise<void> {
    if (!this.activeRequest) return;
    const verifier = await this.activeRequest.startVerification('m.sas.v1');
    this.attachVerifierListeners(verifier);
  }

  /**
   * Confirms that the SAS emojis/decimals match on both devices.
   */
  public static async confirmSASMatch(): Promise<void> {
    if (!this.activeVerifier) return;
    console.info('[CipherChat Verification] User confirmed SAS matches.');
    await this.activeVerifier.confirm();
  }

  /**
   * Flags a SAS mismatch, safely aborting verification to prevent MITM.
   */
  public static async reportSASMismatch(): Promise<void> {
    if (!this.activeVerifier) return;
    console.warn('[CipherChat Verification] User reported SAS mismatch! Aborting.');
    this.activeVerifier.mismatch();
    this.reset();
  }

  /**
   * Cancels verification.
   */
  public static async cancel(): Promise<void> {
    if (this.activeRequest) {
      this.activeRequest.cancel();
    }
    this.reset();
  }

  private static attachRequestListeners(request: any) {
    this.activeRequest = request;

    const updateState = () => {
      this.notify({
        transactionId: request.transactionId || 'unknown',
        otherUserId: request.otherUserId,
        otherDeviceId: request.otherDeviceId,
        methods: request.methods || [],
        phase: request.phase === 1 ? 'ready' : request.phase === 2 ? 'started' : request.phase === 3 ? 'done' : 'requested',
      });
    };

    request.on('change', () => {
      if (request.phase === 4 || request.cancelled) {
        this.reset();
      } else {
        updateState();
      }
    });

    updateState();
  }

  private static attachVerifierListeners(verifier: any) {
    this.activeVerifier = verifier;

    verifier.on('show_sas', (sasData: any) => {
      console.info('[CipherChat Verification] SAS payload received from peer.');
      this.notify({
        transactionId: this.activeRequest?.transactionId || 'unknown',
        otherUserId: this.activeRequest?.otherUserId || '',
        otherDeviceId: this.activeRequest?.otherDeviceId || '',
        methods: ['m.sas.v1'],
        phase: 'sas_shown',
        sas: {
          emoji: sasData.sas?.emoji,
          decimal: sasData.sas?.decimal,
        },
      });
    });
  }

  private static reset() {
    this.activeRequest = null;
    this.activeVerifier = null;
    this.notify(null);
  }
}
