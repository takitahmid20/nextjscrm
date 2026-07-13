/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { userSchema } from '@/src/validation';
import { usersDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = userSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail('Team member payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const updated = usersDb.update(id, parsed.data);
  if (!updated) return fail('Team member not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  if (id === user.id) return fail('You cannot remove your own account.', 400);

  usersDb.remove(id);
  return ok({ deleted: true });
}
