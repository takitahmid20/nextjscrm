/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { leadSchema, listQuerySchema } from '@/src/validation';
import { leadsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { toBaseEntityFields } from '@/src/lib/entity-payload';
import { ok, fail } from '@/src/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listQuerySchema.parse(params);
  const filters = {
    status: params.status,
    source: params.source,
    assignedTo: params.assignedTo,
  };

  return ok(leadsDb.list(query, filters));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  // leadSchema validates the demographic/base fields; dealValue is required
  // on Lead specifically and checked separately since it isn't part of the
  // shared baseEntitySchema used by both Lead and Contact forms.
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Lead payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }
  const dealValue = Number(body?.dealValue);
  if (!Number.isFinite(dealValue) || dealValue < 0) {
    return fail('A valid, non-negative deal value is required.', 400);
  }

  const lead = leadsDb.create({ ...toBaseEntityFields(parsed.data), status: parsed.data.status, dealValue }, user.name);
  return ok(lead, 201);
}
