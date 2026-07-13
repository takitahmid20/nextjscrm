/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyOtpSchema } from '@/src/validation';
import { authDb } from '@/src/lib/mock-db';
import { signSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/src/lib/session';
import { ok, fail } from '@/src/lib/api-response';

const bodySchema = verifyOtpSchema.extend({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request payload.', 400, parsed.error.flatten().fieldErrors);
  }

  const valid = authDb.verifyOtp(parsed.data.email, parsed.data.otp);
  if (!valid) return fail('That code is invalid or has expired.', 401);

  const user = authDb.findUserByEmail(parsed.data.email);
  if (!user) return fail('No account found for that email.', 404);

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
