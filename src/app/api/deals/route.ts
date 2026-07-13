/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { dealSchema, listQuerySchema } from '@/src/validation';
import { dealsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listQuerySchema.parse(params);
  const filters = {
    stage: params.stage,
    status: params.status,
    assignedTo: params.assignedTo,
  };

  return ok(dealsDb.list(query, filters));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Deal payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const deal = dealsDb.create(
    {
      title: parsed.data.title,
      company: parsed.data.company,
      value: parsed.data.value,
      stage: parsed.data.stage,
      contactPerson: parsed.data.contactPerson,
      email: parsed.data.email,
      phone: parsed.data.phone,
      expectedCloseDate: parsed.data.expectedCloseDate,
      assignedTo: parsed.data.assignedTo,
      status: 'Open',
    },
    user.name
  );
  return ok(deal, 201);
}
