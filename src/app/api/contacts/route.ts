/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { contactSchema, listQuerySchema } from '@/src/validation';
import { contactsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { toBaseEntityFields } from '@/src/lib/entity-payload';
import { ok, fail } from '@/src/lib/api-response';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listQuerySchema.parse(params);
  const filters = {
    source: params.source,
    priority: params.priority,
    assignedTo: params.assignedTo,
  };

  return ok(contactsDb.list(query, filters));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Contact payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const contact = contactsDb.create(toBaseEntityFields(parsed.data), user.name);
  return ok(contact, 201);
}
