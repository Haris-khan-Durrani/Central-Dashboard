// Authentication helper for Central Dashboard Admin Access
// Uses Web Crypto API compatible with both Node.js Runtime and Next.js Edge Middleware

export const ADMIN_COOKIE_NAME = 'central_admin_session';

/**
 * Derives a deterministic session signature token based on the admin password and application salt.
 */
export async function getExpectedAdminToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const salt = process.env.APP_ENCRYPTION_KEY || 'central-dashboard-admin-salt-key';
  const data = new TextEncoder().encode(`${password}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a session token from request cookies.
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await getExpectedAdminToken();
  return token === expected;
}

/**
 * Validates a plain text password against the configured ADMIN_PASSWORD environment variable.
 */
export function checkAdminPassword(enteredPassword: string): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';
  return enteredPassword.trim() === configuredPassword.trim();
}
