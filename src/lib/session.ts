/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimal signed-session-token helper, built on Web Crypto (crypto.subtle)
 * so it runs identically in the Node API routes and in Edge middleware —
 * no Node-only APIs, no external JWT library.
 *
 * This is the seam a backend team replaces once real auth exists: swap
 * `signSession`/`verifySession` for a real JWT (jose, next-auth, etc.) and
 * keep the same {uid, exp} payload shape and cookie name so nothing else
 * in the app has to change.
 */

export const SESSION_COOKIE_NAME = 'crm_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  uid: string;
  exp: number; // epoch ms
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production.');
    }
    return 'dev-only-insecure-session-secret-do-not-use-in-prod';
  }
  return secret;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(getSecret());
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  try {
    const key = await importKey(getSecret());
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(body));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.uid !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}
