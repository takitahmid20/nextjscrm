/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { contactSchema } from '@/src/validation';
import { contactsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { toBaseEntityPatch } from '@/src/lib/entity-payload';
import { ok, fail } from '@/src/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const contact = contactsDb.get(id);
  if (!contact) return fail('Contact not found.', 404);
  return ok(contact);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail('Contact payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const updated = contactsDb.update(id, toBaseEntityPatch(parsed.data), user.name);
  if (!updated) return fail('Contact not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  contactsDb.remove([id], user.name);
  return ok({ deleted: true });
}
