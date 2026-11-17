import * as matrixcs from 'matrix-js-sdk';
import { matrixClientManager } from './matrixClient';
import { sanitizeLogOutput } from '../../utils/sanitizer';

const SESSION_STORAGE_KEY = 'cipherchat_active_session_v1';

export interface StoredSession {
  baseUrl: string;
  userId: string;
  accessToken: string;
  deviceId: string;
}

export class AuthService {
  /**
   * Performs standard Matrix password authentication.
   */
  public static async login(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<StoredSession> {
    const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    console.info(`[CipherChat Auth] Initiating login for user ${username} against ${cleanBaseUrl}`);

    const tempClient = matrixcs.createClient({ baseUrl: cleanBaseUrl });
    const response = await tempClient.login('m.login.password', {
      user: username,
      password: password,
      initial_device_display_name: `CipherChat Web (${navigator.userAgent.slice(0, 30)})`,
    });

    const session: StoredSession = {
      baseUrl: cleanBaseUrl,
      userId: response.user_id || `@${username}:${cleanBaseUrl}`,
      accessToken: response.access_token || '',
      deviceId: response.device_id || 'DEFAULT_DEVICE',
    };

    // Store token in sessionStorage (isolated to current tab/session lifetime)
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    // Initialize the primary Matrix client and E2EE engine
    await matrixClientManager.initialize(session);

    return session;
  }

  /**
   * Registers a new user account with the Matrix homeserver.
   */
  public static async register(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<StoredSession> {
    const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    console.info(`[CipherChat Auth] Registering user ${username} against ${cleanBaseUrl}`);

    const tempClient = matrixcs.createClient({ baseUrl: cleanBaseUrl });
    const response = await tempClient.register(
      username,
      password,
      null,
      { type: 'm.login.dummy' }
    );

    const session: StoredSession = {
      baseUrl: cleanBaseUrl,
      userId: response.user_id || `@${username}:${cleanBaseUrl}`,
      accessToken: response.access_token || '',
      deviceId: response.device_id || 'DEFAULT_DEVICE',
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    await matrixClientManager.initialize(session);

    return session;
  }

  /**
   * Restores an existing session from secure session storage if present.
   */
  public static async restoreSession(): Promise<StoredSession | null> {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
      const session: StoredSession = JSON.parse(raw);
      console.info(`[CipherChat Auth] Restoring active session for ${session.userId}`);
      await matrixClientManager.initialize(session);
      return session;
    } catch (err) {
      console.error(sanitizeLogOutput(`[CipherChat Auth] Failed to restore session: ${err}`));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  /**
   * Terminates active session, revokes access token on the homeserver, and cleans up local state.
   */
  public static async logout(): Promise<void> {
    const client = matrixClientManager.getClient();
    if (client) {
      try {
        await client.logout();
      } catch (err) {
        console.warn(sanitizeLogOutput(`[CipherChat Auth] Homeserver logout error (continuing local cleanup): ${err}`));
      }
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    await matrixClientManager.stop();
    console.info('[CipherChat Auth] Successfully logged out and cleared session.');
  }

  /**
   * Enforces password complexity rules prior to transmission.
   */
  public static validatePasswordComplexity(password: string): { isValid: boolean; reason?: string } {
    if (password.length < 10) {
      return { isValid: false, reason: 'Password must be at least 10 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, reason: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, reason: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, reason: 'Password must contain at least one digit.' };
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { isValid: false, reason: 'Password must contain at least one special symbol.' };
    }
    return { isValid: true };
  }
}
