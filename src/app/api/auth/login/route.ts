/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { loginSchema } from '@/src/validation';
import { authDb } from '@/src/lib/mock-db';
import { signSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/src/lib/session';
import { ok, fail } from '@/src/lib/api-response';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request payload.', 400, parsed.error.flatten().fieldErrors);
  }

  // TODO(backend): replace authDb.verifyCredentials with a real DB lookup + bcrypt/argon2 compare.
  const user = authDb.verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return fail('Invalid email or password.', 401);
  }

  const token = await signSession({ uid: user.id, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const response = ok({ user });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
