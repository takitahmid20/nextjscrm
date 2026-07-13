/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { leadsDb } from '@/src/lib/mock-db';
import { getCurrentUser } from '@/src/lib/auth-server';
import { ok, fail } from '@/src/lib/api-response';

const bodySchema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail('Not authenticated.', 401);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return fail('Expected a non-empty array of lead ids.', 400);

  leadsDb.remove(parsed.data.ids, user.name);
  return ok({ deleted: parsed.data.ids.length });
}
