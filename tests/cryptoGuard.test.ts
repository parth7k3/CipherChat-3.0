import { describe, it, expect, vi } from 'vitest';
import { CryptoService } from '../src/services/matrix/cryptoService';
import { matrixClientManager } from '../src/services/matrix/matrixClient';

describe('Cryptographic Downgrade & Plaintext Fallback Guard', () => {
  it('throws security exception when client is not initialized', () => {
    vi.spyOn(matrixClientManager, 'getClient').mockReturnValue(null);

    expect(() => {
      CryptoService.assertSafeMessageDispatch('!fake_room:cipherchat.local');
    }).toThrow(/Matrix client is not initialized/);
  });

  it('throws security exception and prevents send when room is encrypted but crypto engine is unready', () => {
    const mockClient: any = {
      isRoomEncrypted: vi.fn().mockReturnValue(true),
    };
    vi.spyOn(matrixClientManager, 'getClient').mockReturnValue(mockClient);
    vi.spyOn(matrixClientManager, 'getIsCryptoReady').mockReturnValue(false);

    expect(() => {
      CryptoService.assertSafeMessageDispatch('!secure_room:cipherchat.local');
    }).toThrow(/Room requires End-to-End Encryption, but the cryptographic engine is not ready/);
  });

  it('allows safe message dispatch when crypto engine is active and ready', () => {
    const mockClient: any = {
      isRoomEncrypted: vi.fn().mockReturnValue(true),
    };
    vi.spyOn(matrixClientManager, 'getClient').mockReturnValue(mockClient);
    vi.spyOn(matrixClientManager, 'getIsCryptoReady').mockReturnValue(true);

    expect(() => {
      CryptoService.assertSafeMessageDispatch('!secure_room:cipherchat.local');
    }).not.toThrow();
  });
});
