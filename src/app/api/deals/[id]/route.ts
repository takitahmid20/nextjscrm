/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { dealSchema } from '@/src/validation';
import { dealsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const dealPatchSchema = dealSchema.partial().extend({
  status: z.enum(['Open', 'Won', 'Lost']).optional(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const deal = dealsDb.get(id);
  if (!deal) return fail('Deal not found.', 404);
  return ok(deal);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = dealPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Deal payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const updated = dealsDb.update(id, parsed.data, user.name);
  if (!updated) return fail('Deal not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const removed = dealsDb.remove(id, user.name);
  if (!removed) return fail('Deal not found.', 404);
  return ok({ deleted: true });
}
