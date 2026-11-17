import { describe, it, expect } from 'vitest';
import { sanitizeLogOutput, escapeHtml } from '../src/utils/sanitizer';

describe('Sanitizer & Privacy Leakage Prevention', () => {
  it('scrubs access tokens from log messages', () => {
    const raw = 'Login success for user: {"access_token": "syt_abc123xyz_token_secret"}';
    const sanitized = sanitizeLogOutput(raw);
    expect(sanitized).not.toContain('syt_abc123xyz_token_secret');
    expect(sanitized).toContain('[REDACTED_SECRET]');
  });

  it('scrubs passwords and private keys from debug traces', () => {
    const raw = 'Debug trace: {"password": "SuperSecretPassword123!"} and {"private_key": "MIIB...key"}';
    const sanitized = sanitizeLogOutput(raw);
    expect(sanitized).not.toContain('SuperSecretPassword123!');
    expect(sanitized).not.toContain('MIIB...key');
    expect(sanitized).toContain('[REDACTED_SECRET]');
  });

  it('escapes hazardous HTML to prevent XSS injection', () => {
    const malicious = '<script>alert("XSS")</script><img src="x" onerror="evil()" />';
    const safe = escapeHtml(malicious);
    expect(safe).not.toContain('<script>');
    expect(safe).toContain('&lt;script&gt;');
    expect(safe).toContain('&quot;');
  });
});
