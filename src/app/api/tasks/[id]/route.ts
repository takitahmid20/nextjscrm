/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { taskSchema } from '@/src/validation';
import { tasksDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const taskPatchSchema = taskSchema.partial().extend({
  status: z.enum(['Pending', 'Completed']).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Task payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const updated = tasksDb.update(id, parsed.data, user.name);
  if (!updated) return fail('Task not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  tasksDb.remove(id);
  return ok({ deleted: true });
}
