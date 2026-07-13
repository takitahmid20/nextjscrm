/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { accountSchema } from '@/src/validation';
import { accountsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';
import { Account } from '@/src/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function toAccountPatch(data: Partial<ReturnType<typeof accountSchema.parse>>): Partial<Account> {
  const { addressStreet, addressCity, addressState, addressPostalCode, addressCountry, ...rest } = data;
  const hasAddress = addressStreet || addressCity || addressState || addressPostalCode || addressCountry;
  return {
    ...rest,
    ...(hasAddress
      ? { billingAddress: { street: addressStreet, city: addressCity, state: addressState, postalCode: addressPostalCode, country: addressCountry } }
      : {}),
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const account = accountsDb.get(id);
  if (!account) return fail('Account not found.', 404);
  return ok(account);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = accountSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail('Account payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const updated = accountsDb.update(id, toAccountPatch(parsed.data), user.name);
  if (!updated) return fail('Account not found.', 404);
  return ok(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const { id } = await params;
  accountsDb.remove(id);
  return ok({ deleted: true });
}
