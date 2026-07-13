/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { userSchema } from '@/src/validation';
import { usersDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  return ok(usersDb.list());
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Team member payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const created = usersDb.create(parsed.data);
  return ok(created, 201);
}
