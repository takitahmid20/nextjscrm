/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);
  return ok({ user });
}
