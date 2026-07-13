/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cookies } from 'next/headers';
import { CRMUser } from '../types';
import { SESSION_COOKIE_NAME, verifySession } from './session';
import { authDb } from './mock-db';

/** Server-only helper — reads the session cookie and resolves the current user, for use inside API route handlers. */
export async function getCurrentUser(): Promise<CRMUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  return authDb.getUserById(payload.uid) ?? null;
}
