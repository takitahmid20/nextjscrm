/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { leadSchema } from '@/src/validation';
import { leadsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { toBaseEntityPatch } from '@/src/lib/entity-payload';
import { ok, fail } from '@/src/lib/api-response';
import { Lead } from '@/src/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const lead = leadsDb.get(id);
  if (!lead) return fail('Lead not found.', 404);
  return ok(lead);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail('Lead payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const patch: Partial<Lead> = { ...toBaseEntityPatch(parsed.data) };
  if (body?.dealValue !== undefined) {
    const dealValue = Number(body.dealValue);
    if (!Number.isFinite(dealValue) || dealValue < 0) return fail('Deal value must be a non-negative number.', 400);
    patch.dealValue = dealValue;
  }
  if (parsed.data.status) patch.status = parsed.data.status;

  const updated = leadsDb.update(id, patch, user.name);
  if (!updated) return fail('Lead not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  leadsDb.remove([id], user.name);
  return ok({ deleted: true });
}
