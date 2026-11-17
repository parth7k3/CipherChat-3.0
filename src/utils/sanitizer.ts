/**
 * Sanitization utility for CipherChat 3.0
 * Prevents log leakage of tokens/keys and ensures safe display of user-generated content.
 */

// Regex patterns for sensitive data
const SENSITIVE_PATTERNS = [
  /("access_token"\s*:\s*")[^"]+(")/gi,
  /("password"\s*:\s*")[^"]+(")/gi,
  /("private_key"\s*:\s*")[^"]+(")/gi,
  /("session_key"\s*:\s*")[^"]+(")/gi,
  /(syt_[a-zA-Z0-9_-]+)/g, // Synapse access token prefix
];

/**
 * Scrubs sensitive authentication tokens, passwords, and private cryptographic keys from log strings.
 */
export function sanitizeLogOutput(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '$1[REDACTED_SECRET]$2');
  }
  return sanitized;
}

/**
 * Basic HTML escaping to prevent XSS in text rendering.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
