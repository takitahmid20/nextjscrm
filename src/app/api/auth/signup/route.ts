/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { signupSchema } from '@/src/validation';
import { authDb } from '@/src/lib/mock-db';
import { signSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/src/lib/session';
import { ok, fail } from '@/src/lib/api-response';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request payload.', 400, parsed.error.flatten().fieldErrors);
  }

  // TODO(backend): persist the new tenant/user in the real DB inside authDb.signup.
  const user = authDb.signup(parsed.data);
  if (!user) {
    return fail('An account with that email already exists.', 409);
  }

  const token = await signSession({ uid: user.id, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const response = ok({ user }, 201);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
