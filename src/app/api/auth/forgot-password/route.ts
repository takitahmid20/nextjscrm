/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { forgotPasswordSchema } from '@/src/validation';
import { authDb } from '@/src/lib/mock-db';
import { ok, fail } from '@/src/lib/api-response';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request payload.', 400, parsed.error.flatten().fieldErrors);
  }

  const exists = !!authDb.findUserByEmail(parsed.data.email);
  // Always respond the same way whether or not the email exists, so the
  // endpoint can't be used to enumerate registered accounts.
  let devOtp: string | undefined;
  if (exists) {
    devOtp = authDb.requestOtp(parsed.data.email);
    // TODO(backend): send `devOtp` via a real email/SMS provider instead of returning it.
  }

  return ok({
    message: 'If that email is registered, a verification code has been sent.',
    // Only surfaced outside production so the flow is testable without a mailer.
    devOtp: process.env.NODE_ENV !== 'production' ? devOtp : undefined,
  });
}
