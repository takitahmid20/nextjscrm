/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { taskSchema, listQuerySchema } from '@/src/validation';
import { tasksDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listQuerySchema.parse(params);
  const filters = {
    status: params.status,
    priority: params.priority,
    assignedTo: params.assignedTo,
  };

  return ok(tasksDb.list(query, filters));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Task payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const task = tasksDb.create({ ...parsed.data, status: 'Pending' });
  return ok(task, 201);
}
