/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { accountSchema, listQuerySchema } from '@/src/validation';
import { accountsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';
import { Account } from '@/src/types';

function toAccountFields(data: ReturnType<typeof accountSchema.parse>): Omit<Account, 'id' | 'createdAt'> {
  const hasAddress = data.addressStreet || data.addressCity || data.addressState || data.addressPostalCode || data.addressCountry;
  return {
    name: data.name,
    industry: data.industry,
    website: data.website,
    phone: data.phone,
    description: data.description,
    assignedTo: data.assignedTo,
    billingAddress: hasAddress
      ? { street: data.addressStreet, city: data.addressCity, state: data.addressState, postalCode: data.addressPostalCode, country: data.addressCountry }
      : undefined,
  };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = listQuerySchema.parse(params);
  return ok(accountsDb.list(query, { assignedTo: params.assignedTo }));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Account payload failed validation.', 400, parsed.error.flatten().fieldErrors);
  }

  const account = accountsDb.create(toAccountFields(parsed.data), user.name);
  return ok(account, 201);
}
