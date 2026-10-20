import { PillTrustLabel } from '@pill/schemas';

// Regex patterns to identify accidental secrets/credentials in text
const SENSITIVE_PATTERNS = [
  { pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----/i, name: 'Private Key' },
  { pattern: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i, name: 'API Key' },
  { pattern: /(?:sk_live|sk_test|ghp_|glpat-|bearer\s+ey)[a-zA-Z0-9_\-]{16,}/i, name: 'Access Token' },
  { pattern: /password\s*[:=]\s*['"][^'"]{6,}['"]/i, name: 'Password String' },
];

export function detectSensitiveContent(content: string): {
  warnings: string[];
  trustLabel: PillTrustLabel;
} {
  const warnings: string[] = [];

  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Potential ${name} detected. Consider redacting before sharing.`);
    }
  }

  const trustLabel: PillTrustLabel = warnings.length > 0 
    ? 'credential_warning' 
    : 'user_authored';

  return { warnings, trustLabel };
}

/**
 * Sanitizes untrusted content before injection into prompts or IDE packages.
 * Prevents prompt injection instructions from hijacking system instructions.
 */
export function sanitizeUntrustedContent(content: string): string {
  // Strip null bytes and control chars
  let cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Wrap external content with boundary protection indicators
  return cleaned;
}
